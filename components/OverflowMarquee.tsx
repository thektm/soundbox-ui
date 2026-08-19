import React, {
  CSSProperties,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type TextDirection = "ltr" | "rtl";

type OverflowMarqueeProps = {
  text: string;
  children?: React.ReactNode;
  className?: string;
  direction?: TextDirection | "auto";
  align?: "start" | "center" | "end";
  speedPxPerSecond?: number;
  title?: string;
  deferMeasurement?: boolean;
};

type MarqueeStyle = CSSProperties & {
  "--overflow-marquee-shift"?: string;
  "--overflow-marquee-duration"?: string;
};

const RTL_CHARACTER = /[\u0590-\u08ff\ufb1d-\ufdfd\ufe70-\ufefc]/;
const LTR_CHARACTER = /[A-Za-z\u00c0-\u02af\u0370-\u058f]/;

const resolveTextDirection = (
  text: string,
  requestedDirection: OverflowMarqueeProps["direction"],
): TextDirection => {
  if (requestedDirection === "ltr" || requestedDirection === "rtl") {
    return requestedDirection;
  }

  for (const character of text) {
    if (RTL_CHARACTER.test(character)) return "rtl";
    if (LTR_CHARACTER.test(character)) return "ltr";
  }

  if (typeof document !== "undefined" && document.documentElement.dir === "rtl") {
    return "rtl";
  }
  return "ltr";
};

const alignToCss = (
  align: NonNullable<OverflowMarqueeProps["align"]>,
  direction: TextDirection,
): CSSProperties["textAlign"] => {
  if (align === "center") return "center";
  if (align === "end") return direction === "rtl" ? "left" : "right";
  return direction === "rtl" ? "right" : "left";
};

/**
 * Animates only when the rendered text is genuinely clipped by its container.
 * The motion is a relaxed, reversible marquee with pauses at both ends, so it
 * never jumps between loops and remains readable in both RTL and LTR content.
 */
const OverflowMarquee = memo(function OverflowMarquee({
  text,
  children,
  className = "",
  direction = "auto",
  align = "start",
  speedPxPerSecond = 28,
  title,
  deferMeasurement = false,
}: OverflowMarqueeProps) {
  const viewportRef = useRef<HTMLSpanElement | null>(null);
  const contentRef = useRef<HTMLSpanElement | null>(null);
  const [overflowPixels, setOverflowPixels] = useState(0);
  const [isVisible, setIsVisible] = useState(!deferMeasurement);

  const resolvedDirection = useMemo(
    () => resolveTextDirection(text, direction),
    [direction, text],
  );

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const nextOverflow = Math.max(
      0,
      Math.ceil(content.scrollWidth - viewport.clientWidth),
    );
    setOverflowPixels((current) =>
      Math.abs(current - nextOverflow) > 1 ? nextOverflow : current,
    );
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;
    if (deferMeasurement && !isVisible) return;

    let frame = window.requestAnimationFrame(measure);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(measure);
          })
        : null;

    resizeObserver?.observe(viewport);
    resizeObserver?.observe(content);
    window.addEventListener("resize", measure, { passive: true });

    const fonts = document.fonts;
    void fonts?.ready?.then(() => {
      frame = window.requestAnimationFrame(measure);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [deferMeasurement, isVisible, measure, text]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.01 },
    );
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const isOverflowing = overflowPixels > 1;
  // Moving occupies 60% of the keyframe; the remaining time is split between
  // pauses. Clamp keeps very short labels calm and very long labels practical.
  const durationSeconds = Math.min(
    26,
    Math.max(9, (overflowPixels * 2) / Math.max(18, speedPxPerSecond) / 0.6),
  );
  const shift = resolvedDirection === "rtl" ? overflowPixels : -overflowPixels;
  const style: MarqueeStyle = isOverflowing
    ? {
        "--overflow-marquee-shift": `${shift}px`,
        "--overflow-marquee-duration": `${durationSeconds.toFixed(2)}s`,
      }
    : {};

  return (
    <span
      ref={viewportRef}
      dir={resolvedDirection}
      title={title ?? text}
      data-overflowing={isOverflowing ? "true" : "false"}
      data-marquee-visible={isVisible ? "true" : "false"}
      className={`overflow-marquee block min-w-0 max-w-full overflow-hidden ${className}`}
      style={{
        ...style,
        textAlign: isOverflowing
          ? alignToCss("start", resolvedDirection)
          : alignToCss(align, resolvedDirection),
      }}
    >
      <span
        ref={contentRef}
        className="overflow-marquee__content inline-block max-w-none whitespace-nowrap"
      >
        {children ?? text}
      </span>

      <style jsx>{`
        .overflow-marquee__content {
          transform: translate3d(0, 0, 0);
          will-change: auto;
        }

        .overflow-marquee[data-overflowing="false"]
          .overflow-marquee__content {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          vertical-align: bottom;
        }

        .overflow-marquee[data-overflowing="true"][data-marquee-visible="true"]
          .overflow-marquee__content {
          animation: overflow-marquee-pan var(--overflow-marquee-duration)
            cubic-bezier(0.45, 0, 0.55, 1) infinite;
          will-change: transform;
        }

        .overflow-marquee:hover .overflow-marquee__content {
          animation-play-state: paused;
        }

        @keyframes overflow-marquee-pan {
          0%,
          15% {
            transform: translate3d(0, 0, 0);
          }
          45%,
          55% {
            transform: translate3d(var(--overflow-marquee-shift), 0, 0);
          }
          85%,
          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .overflow-marquee__content {
            animation: none !important;
            transform: none !important;
            will-change: auto !important;
          }
        }
      `}</style>
    </span>
  );
});

export default OverflowMarquee;

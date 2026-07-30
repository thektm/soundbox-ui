import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import { warmAppScreensDuringSplash, continueAppScreenWarmup } from "../lib/appScreenPreloader";
import { useI18n } from "./I18nContext";
import {
  buildHomeSummaryRequestKey,
  HOME_SUMMARY_URL,
  requestHomeSummary,
} from "../lib/homeSummaryPrefetch";
import {
  getSplashRuntime,
  getSplashRuntimeSnapshot,
  getSplashServerSnapshot,
  SPLASH_COLOR_DURATION_MS,
  SPLASH_DRAW_DURATION_MS,
  SPLASH_EXIT_DURATION_MS,
  subscribeSplashRuntime,
} from "../lib/splashRuntime";

const useClientLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const getSplashVisibilitySnapshot = (): boolean =>
  getSplashRuntimeSnapshot().visible;
const getSplashVisibilityServerSnapshot = (): boolean => true;

type PathAnimationRun = {
  host: HTMLDivElement;
  startedAt: number;
  animations: Animation[];
};

/**
 * Owns auth/route readiness and the early Home request. It renders no DOM and
 * is intentionally separated from the visual tree: auth responses, profile
 * refreshes, language hydration, route resolution, and Home data completion
 * can rerender this coordinator without touching the SVG/PNG animation nodes.
 */
const SplashStartupCoordinator: React.FC = () => {
  const { isInitializing, isLoggedIn, accessToken, authenticatedFetch } = useAuth();
  const { isResolving, currentPage } = useNavigation();
  const { language } = useI18n();
  const authenticatedFetchRef = useRef(authenticatedFetch);
  authenticatedFetchRef.current = authenticatedFetch;

  // Subscribe only to the boolean visibility value. Phase changes notify the
  // store, but Object.is(true, true) prevents coordinator rerenders.
  const visible = useSyncExternalStore(
    subscribeSplashRuntime,
    getSplashVisibilitySnapshot,
    getSplashVisibilityServerSnapshot,
  );

  const requestKey = useMemo(
    () => buildHomeSummaryRequestKey(accessToken, language),
    [accessToken, language],
  );

  useEffect(() => {
    getSplashRuntime().ensureStarted();
  }, []);

  useEffect(() => {
    if (!visible || isInitializing) return;

    let active = true;
    const runtime = getSplashRuntime();
    runtime.setScreensReady(false);

    void warmAppScreensDuringSplash({ currentPage, isLoggedIn })
      .catch(() => undefined)
      .finally(() => {
        if (!active) return;
        runtime.setScreensReady(true);
        // Continue filling the browser's immutable chunk cache after the splash
        // budget on constrained connections. This never blocks interaction.
        continueAppScreenWarmup({ currentPage, isLoggedIn });
      });

    return () => {
      active = false;
    };
  }, [currentPage, isInitializing, isLoggedIn, visible]);

  useEffect(() => {
    // Readiness is bookkeeping only. It must never advance or replay the
    // animation timeline; the runtime clock owns all visual phase changes.
    getSplashRuntime().setReadiness(!isInitializing, !isResolving);
  }, [isInitializing, isResolving]);

  useEffect(() => {
    if (isInitializing) return;
    // Authentication can change after the one-time splash (login/logout in the
    // same tab). Warm the newly relevant member/guest chunks during idle time.
    continueAppScreenWarmup({ currentPage, isLoggedIn });
  }, [currentPage, isInitializing, isLoggedIn]);

  useEffect(() => {
    if (!visible || isInitializing) return;

    void requestHomeSummary(requestKey, () => {
      const requestInit: RequestInit = {
        headers: { Accept: "application/json" },
      };
      return accessToken
        ? authenticatedFetchRef.current(HOME_SUMMARY_URL, requestInit)
        : fetch(HOME_SUMMARY_URL, requestInit);
    }).catch(() => {
      // Home owns user-facing retry/error handling if the early prefetch fails.
    });
  }, [accessToken, isInitializing, requestKey, visible]);

  return null;
};

/**
 * Pure splash visual. It consumes no auth, navigation, i18n, or Home context,
 * so network responses cannot cause it to rerender. It only reacts to the
 * browser-lifetime splash runtime's monotonic visual snapshot.
 */
const SplashVisual = memo(function SplashVisual() {
  const outlineHostRef = useRef<HTMLDivElement>(null);
  const pathRunRef = useRef<PathAnimationRun | null>(null);

  const snapshot = useSyncExternalStore(
    subscribeSplashRuntime,
    getSplashRuntimeSnapshot,
    getSplashServerSnapshot,
  );
  const { assets, phase, visible, fading, animationStartedAt } = snapshot;

  // Keep the exact HTML object stable across phase changes. This prevents React
  // from touching/replacing the inline SVG when only coloring/fading changes.
  const outlineMarkup = useMemo(
    () =>
      assets
        ? ({ __html: assets.outlineSvgMarkup } as const)
        : null,
    [assets?.outlineSvgMarkup],
  );

  const cancelPathRun = useCallback(() => {
    const current = pathRunRef.current;
    if (!current) return;
    current.animations.forEach((animation) => animation.cancel());
    pathRunRef.current = null;
  }, []);

  // Start the singleton clock only after the decoded SVG is mounted and has
  // survived two paint frames. Strict Mode/remount calls remain idempotent.
  useEffect(() => {
    if (!assets || !visible || animationStartedAt !== null) return;

    let frame = 0;
    let cancelled = false;
    let paintedFrames = 0;

    const startWhenPainted = () => {
      if (cancelled) return;
      paintedFrames += 1;
      const pathCount =
        outlineHostRef.current?.querySelectorAll("path").length ?? 0;

      if (paintedFrames >= 2 && pathCount > 0) {
        getSplashRuntime().beginAnimation();
        return;
      }

      frame = window.requestAnimationFrame(startWhenPainted);
    };

    frame = window.requestAnimationFrame(startWhenPainted);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [animationStartedAt, assets, visible]);

  // Create/synchronize the path animations before paint. There is deliberately
  // no dependency-cleanup here: phase rerenders and unrelated store updates
  // must not cancel a running animation. A run is replaced only when the real
  // DOM host or immutable singleton start timestamp changes.
  useClientLayoutEffect(() => {
    const host = outlineHostRef.current;
    if (!assets || !visible || animationStartedAt === null || !host) return;

    const existing = pathRunRef.current;
    if (
      existing &&
      existing.host === host &&
      existing.startedAt === animationStartedAt
    ) {
      return;
    }

    cancelPathRun();

    const paths = Array.from(host.querySelectorAll<SVGPathElement>("path"));
    if (paths.length === 0) return;

    const elapsed = Math.max(0, performance.now() - animationStartedAt);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const pathDuration = reduceMotion ? 260 : 5_265;
    const pathStagger = 0;
    const easing = reduceMotion
      ? "ease-out"
      : "cubic-bezier(0.65, 0, 0.18, 1)";

    const animations = paths.map((path, index) =>
      path.animate(
        [
          { strokeDashoffset: "1", opacity: 1 },
          { strokeDashoffset: "0", opacity: 1 },
        ],
        {
          duration: pathDuration,
          delay: index * pathStagger - elapsed,
          easing,
          fill: "both",
        },
      ),
    );

    pathRunRef.current = {
      host,
      startedAt: animationStartedAt,
      animations,
    };
  }, [
    animationStartedAt,
    assets?.outlineSvgMarkup,
    cancelPathRun,
    visible,
  ]);

  // Real unmount cleanup only. This effect has no changing dependencies, so a
  // request/context rerender can never cancel the live path animations.
  useEffect(() => cancelPathRun, [cancelPathRun]);

  if (!visible) return null;

  const showColor = phase === "coloring" || phase === "complete";
  const showDots = showColor;

  return (
    <div
      role="status"
      aria-label="Preparing SedaBox — در حال آماده‌سازی صداباکس"
      aria-live="polite"
      className={`splash-root fixed inset-0 z-60 flex items-center justify-center ${
        fading ? "is-fading" : ""
      }`}
    >
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <div className="splash-stage">
        <div className={`logo-stack phase-${phase}`} aria-hidden="true">
          <div className="logo-aura" />

          {outlineMarkup && (
            <div
              ref={outlineHostRef}
              className="splash-outline"
              dangerouslySetInnerHTML={outlineMarkup}
            />
          )}

          {assets && (
            <img
              src={assets.colorLogoUrl}
              alt=""
              draggable={false}
              decoding="sync"
              className={`splash-color-logo ${showColor ? "is-visible" : ""}`}
            />
          )}

          <div className={`paint-sheen ${showColor ? "is-active" : ""}`} />
        </div>

        <div
          className={`splash-dots ${showDots ? "is-visible" : ""}`}
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </div>
      </div>

      <style jsx>{`
        .splash-root {
          overflow: hidden;
          opacity: 1;
          background:
            radial-gradient(circle at 50% 43%, rgba(0, 126, 94, 0.1), transparent 34%),
            #060707;
          transition: opacity ${SPLASH_EXIT_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1);
          contain: layout paint style;
        }

        .splash-root.is-fading {
          opacity: 0;
          pointer-events: none;
        }

        .ambient {
          position: absolute;
          width: min(76vw, 760px);
          aspect-ratio: 1;
          border-radius: 999px;
          pointer-events: none;
          filter: blur(90px);
          opacity: 0.14;
          will-change: transform, opacity;
        }

        .ambient-one {
          background: rgba(0, 213, 157, 0.2);
          transform: translate3d(-31%, -27%, 0);
        }

        .ambient-two {
          background: rgba(77, 255, 211, 0.08);
          transform: translate3d(34%, 33%, 0) scale(0.72);
        }

        .splash-stage {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          width: min(78vw, 330px);
          user-select: none;
          -webkit-user-select: none;
        }

        .logo-stack {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          isolation: isolate;
          transform: translateZ(0);
        }

        .logo-aura {
          position: absolute;
          inset: 14%;
          z-index: 0;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(0, 226, 167, 0.15) 0%,
            rgba(0, 144, 106, 0.06) 46%,
            transparent 72%
          );
          opacity: 0;
          transform: scale(0.84);
          transition:
            opacity 1.2s ease,
            transform 1.5s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform, opacity;
        }

        .phase-drawing .logo-aura,
        .phase-coloring .logo-aura,
        .phase-complete .logo-aura {
          opacity: 1;
          transform: scale(1);
        }

        .splash-outline,
        .splash-color-logo,
        .paint-sheen {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .splash-outline {
          z-index: 2;
          opacity: 1;
          filter: drop-shadow(0 0 7px rgba(0, 232, 171, 0.22));
          transition: opacity 1.15s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity;
        }

        .phase-coloring .splash-outline,
        .phase-complete .splash-outline {
          opacity: 0.08;
        }

        .splash-color-logo {
          z-index: 3;
          display: block;
          object-fit: contain;
          opacity: 0;
          transform: scale(0.982) translateZ(0);
          filter: saturate(0.88) brightness(0.9);
          transition:
            opacity ${SPLASH_COLOR_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1),
            transform ${SPLASH_COLOR_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1),
            filter ${SPLASH_COLOR_DURATION_MS}ms ease;
          will-change: transform, opacity, filter;
          pointer-events: none;
        }

        .splash-color-logo.is-visible {
          opacity: 1;
          transform: scale(1) translateZ(0);
          filter: saturate(1) brightness(1)
            drop-shadow(0 16px 32px rgba(0, 0, 0, 0.22));
        }

        .paint-sheen {
          z-index: 4;
          overflow: hidden;
          opacity: 0;
          pointer-events: none;
          mix-blend-mode: screen;
          mask-image: linear-gradient(#000, #000);
          -webkit-mask-image: linear-gradient(#000, #000);
        }

        .paint-sheen::after {
          content: "";
          position: absolute;
          inset: -30%;
          background: linear-gradient(
            112deg,
            transparent 38%,
            rgba(255, 255, 255, 0.38) 49%,
            rgba(132, 255, 221, 0.22) 52%,
            transparent 62%
          );
          transform: translate3d(-68%, 0, 0) rotate(4deg);
        }

        .paint-sheen.is-active {
          opacity: 0.45;
        }

        .paint-sheen.is-active::after {
          animation: splash-sheen ${SPLASH_COLOR_DURATION_MS}ms
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .splash-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 12px;
          opacity: 0;
          transform: translate3d(0, 8px, 0);
          transition:
            opacity 420ms ease,
            transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform, opacity;
        }

        .splash-dots.is-visible {
          opacity: 1;
          transform: translate3d(0, 0, 0);
        }

        .splash-dots span {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(225, 235, 232, 0.42);
          box-shadow: 0 0 0 0 rgba(0, 214, 157, 0);
          animation: splash-dot-wave 1.05s infinite cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform, opacity;
        }

        .splash-dots span:nth-child(2) {
          animation-delay: 140ms;
          background: rgba(0, 216, 158, 0.78);
        }

        .splash-dots span:nth-child(3) {
          animation-delay: 280ms;
        }

        @keyframes splash-sheen {
          0% {
            transform: translate3d(-68%, 0, 0) rotate(4deg);
            opacity: 0;
          }
          22% {
            opacity: 1;
          }
          100% {
            transform: translate3d(68%, 0, 0) rotate(4deg);
            opacity: 0;
          }
        }

        @keyframes splash-dot-wave {
          0%,
          62%,
          100% {
            transform: translate3d(0, 0, 0) scale(0.82);
            opacity: 0.46;
            box-shadow: 0 0 0 0 rgba(0, 214, 157, 0);
          }
          30% {
            transform: translate3d(0, -5px, 0) scale(1);
            opacity: 1;
            box-shadow: 0 5px 14px rgba(0, 214, 157, 0.14);
          }
        }

        @media (max-width: 480px) {
          .splash-stage {
            width: min(76vw, 286px);
            gap: 14px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .paint-sheen {
            display: none;
          }
          .splash-dots span {
            animation-name: splash-dot-soft;
          }
        }

        @keyframes splash-dot-soft {
          0%,
          100% {
            opacity: 0.45;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>

      <style jsx global>{`
        .splash-outline .splash-mark-svg {
          display: block;
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .splash-outline .splash-mark-svg path {
          fill: transparent !important;
          stroke-width: 2.15px;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          opacity: 0;
          shape-rendering: geometricPrecision;
        }

        .splash-outline .splash-mark-svg path[fill="#008060"] {
          stroke: #08dda5;
        }

        .splash-outline .splash-mark-svg path[fill="#E2E2E2"],
        .splash-outline .splash-mark-svg path[fill="#E3E3E3"] {
          stroke: #edf4f2;
        }

        .splash-outline .splash-mark-svg path[fill="#AFCAC3"] {
          stroke: #a7ddd0;
        }

      `}</style>
    </div>
  );
});

const SplashScreen: React.FC = () => (
  <>
    <SplashStartupCoordinator />
    <SplashVisual />
  </>
);

export default SplashScreen;

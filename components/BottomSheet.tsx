import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  useSpring,
} from "framer-motion";
import { useDrag } from "@use-gesture/react";

// ============ BOTTOM SHEET COMPONENT - 100% FIXED ============
export interface BottomSheetProps {
  isOpen?: boolean; // controlled
  defaultOpen?: boolean; // uncontrolled initial
  onClose?: () => void;
  onOpen?: () => void;
  onSnap?: (index: number) => void;
  children: React.ReactNode;
  snapPoints?: number[];
  defaultSnap?: number;
  header?: React.ReactNode;
  maxHeight?: number;
  backdropOpacity?: number; // maximum backdrop opacity
  springConfig?: { stiffness?: number; damping?: number; mass?: number };
  closeOnBackdropClick?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export interface BottomSheetHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  snapTo: (index: number) => void;
  isOpen: () => boolean;
}

const BottomSheet = forwardRef(
  (props: BottomSheetProps, ref: React.Ref<BottomSheetHandle>) => {
    const {
      isOpen: controlledIsOpen,
      defaultOpen = false,
      onClose,
      onOpen,
      onSnap,
      children,
      snapPoints = [50, 85],
      defaultSnap = 0,
      header,
      maxHeight = 90,
      backdropOpacity = 0.6,
      springConfig = { stiffness: 400, damping: 40, mass: 0.5 },
      closeOnBackdropClick = true,
      className,
      headerClassName,
      contentClassName,
    } = props;

    const [snapIndex, setSnapIndex] = useState(defaultSnap);
    const [localOpen, setLocalOpen] = useState(defaultOpen);
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startY = useRef(0);
    const startYValue = useRef(0);

    // Motion values with spring physics
    const y = useMotionValue(0);
    const springY = useSpring(y, springConfig);

    // Track if sheet is at top of screen for border radius
    const [isAtTop, setIsAtTop] = useState(false);

    // Window height
    const windowHeight =
      typeof window !== "undefined" ? window.innerHeight : 800;

    const isOpen =
      typeof controlledIsOpen === "boolean" ? controlledIsOpen : localOpen;

    // Calculate snap positions (from top of viewport)
    const getSnapY = useCallback(
      (index: number): number => {
        const snapPercent = snapPoints[index];
        return windowHeight - (windowHeight * snapPercent) / 100;
      },
      [snapPoints, windowHeight]
    );

    // Find nearest snap point based on current position and velocity
    const findNearestSnap = useCallback(
      (currentY: number, velocity: number): number => {
        // Strong downward velocity - close
        if (velocity > 800) {
          return -1;
        }

        // Strong upward velocity - go to max
        if (velocity < -800 && snapIndex < snapPoints.length - 1) {
          return snapPoints.length - 1;
        }

        // Find closest snap point
        let nearest = 0;
        let minDist = Math.abs(currentY - getSnapY(0));

        for (let i = 1; i < snapPoints.length; i++) {
          const dist = Math.abs(currentY - getSnapY(i));
          if (dist < minDist) {
            minDist = dist;
            nearest = i;
          }
        }

        // Closing threshold
        const closeThreshold = windowHeight * 0.7;
        if (currentY > closeThreshold) {
          return -1;
        }

        return nearest;
      },
      [snapPoints, getSnapY, windowHeight, snapIndex]
    );

    // Snap to position
    const snapTo = useCallback(
      (index: number) => {
        if (index === -1) {
          y.set(windowHeight);
          if (typeof controlledIsOpen !== "boolean") setLocalOpen(false);
          setTimeout(() => onClose?.(), 150);
          onSnap?.(-1);
          return;
        }

        const targetY = getSnapY(index);
        y.set(targetY);
        setSnapIndex(index);
        onSnap?.(index);
      },
      [getSnapY, onClose, windowHeight, y]
    );

    // Native pointer event handlers for 100% reliability
    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        // Capture the pointer for reliable tracking
        if (handleRef.current) {
          handleRef.current.setPointerCapture(e.pointerId);
        }

        isDragging.current = true;
        startY.current = e.clientY;
        startYValue.current = y.get();

        // Prevent any default behavior
        e.preventDefault();
        e.stopPropagation();
      },
      [y]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current) return;

        e.preventDefault();
        e.stopPropagation();

        const deltaY = e.clientY - startY.current;
        const newY = startYValue.current + deltaY;

        // Apply constraints with rubber-banding
        const minY = getSnapY(snapPoints.length - 1);
        const maxY = windowHeight;

        let constrainedY = newY;

        if (newY < minY) {
          const diff = minY - newY;
          constrainedY = minY - diff * 0.3;
        } else if (newY > maxY) {
          const diff = newY - maxY;
          constrainedY = maxY + diff * 0.3;
        }

        y.set(constrainedY);
      },
      [y, getSnapY, snapPoints.length, windowHeight]
    );

    const handlePointerUp = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current) return;

        e.preventDefault();
        e.stopPropagation();

        isDragging.current = false;

        // Calculate velocity
        const deltaY = e.clientY - startY.current;
        const velocity = deltaY * 10; // Approximate velocity

        const currentY = y.get();
        const targetSnap = findNearestSnap(currentY, velocity);
        snapTo(targetSnap);

        // Release pointer capture
        if (handleRef.current) {
          handleRef.current.releasePointerCapture(e.pointerId);
        }
      },
      [y, findNearestSnap, snapTo]
    );

    // Fallback: use-gesture for additional support
    const bind = useDrag(
      ({ movement: [, my], velocity: [, vy], last, memo = y.get(), event }) => {
        if (!last) {
          isDragging.current = true;
          const newY = memo + my;

          const minY = getSnapY(snapPoints.length - 1);
          const maxY = windowHeight;

          let constrainedY = newY;

          if (newY < minY) {
            const diff = minY - newY;
            constrainedY = minY - diff * 0.3;
          } else if (newY > maxY) {
            const diff = newY - maxY;
            constrainedY = maxY + diff * 0.3;
          }

          y.set(constrainedY);
          return memo;
        } else {
          isDragging.current = false;
          const currentY = y.get();
          const targetSnap = findNearestSnap(currentY, vy * 1000);
          snapTo(targetSnap);
          return undefined;
        }
      },
      {
        from: () => [0, y.get()],
        filterTaps: true,
        pointer: { touch: true },
        axis: "y",
      }
    );

    // Initialize position and respond to open/close
    useEffect(() => {
      if (isOpen) {
        requestAnimationFrame(() => {
          snapTo(defaultSnap);
          onOpen?.();
        });
      } else {
        y.set(windowHeight);
        onClose?.();
      }
    }, [isOpen, defaultSnap, snapTo, windowHeight, y, onOpen, onClose]);

    // Mark mounted to allow portal rendering only on client
    useEffect(() => {
      setMounted(true);
    }, []);

    // Backdrop opacity
    const opacity = useTransform(
      springY,
      [getSnapY(snapPoints.length - 1), windowHeight],
      [backdropOpacity, 0]
    );

    // Monitor position to update border radius when at top
    useEffect(() => {
      const unsubscribe = springY.on("change", (value) => {
        // Consider "at top" when y position is less than 20px from top
        const atTop = value <= 20;
        setIsAtTop(atTop);
      });
      return () => unsubscribe();
    }, [springY]);

    // Lock body scroll
    useEffect(() => {
      if (isOpen) {
        const originalOverflow = document.body.style.overflow;
        const originalPaddingRight = document.body.style.paddingRight;
        const scrollbarWidth =
          window.innerWidth - document.documentElement.clientWidth;

        document.body.style.overflow = "hidden";
        document.body.style.paddingRight = `${scrollbarWidth}px`;

        return () => {
          document.body.style.overflow = originalOverflow;
          document.body.style.paddingRight = originalPaddingRight;
        };
      }
    }, [isOpen]);

    // Handle content scroll
    const handleContentScroll = useCallback(
      (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isAtTop = target.scrollTop <= 0;
        const isAtBottom =
          target.scrollTop + target.clientHeight >= target.scrollHeight - 1;

        if (contentRef.current) {
          contentRef.current.dataset.isAtTop = String(isAtTop);
          contentRef.current.dataset.isAtBottom = String(isAtBottom);
        }
      },
      []
    );

    // Imperative handle
    useImperativeHandle(
      ref,
      () => ({
        open: () => {
          if (typeof controlledIsOpen !== "boolean") setLocalOpen(true);
        },
        close: () => {
          if (typeof controlledIsOpen !== "boolean") setLocalOpen(false);
          snapTo(-1);
        },
        toggle: () => {
          if (typeof controlledIsOpen !== "boolean") setLocalOpen((v) => !v);
        },
        snapTo: (index: number) => snapTo(index),
        isOpen: () =>
          typeof controlledIsOpen === "boolean" ? controlledIsOpen : localOpen,
      }),
      [controlledIsOpen, localOpen, snapTo]
    );

    if (!mounted) return null;

    return createPortal(
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black z-[100]"
              style={{ opacity }}
              onClick={() => snapTo(-1)}
            />

            {/* Bottom Sheet */}
            <motion.div
              ref={containerRef}
              style={{
                y: springY,
                touchAction: "none",
              }}
              className="fixed left-0 right-0 bottom-0 z-[110] flex flex-col will-change-transform"
              initial={{ y: windowHeight }}
              exit={{ y: windowHeight }}
              transition={{
                type: "spring",
                damping: 40,
                stiffness: 400,
                mass: 0.5,
              }}
            >
              <div
                className={`bg-gray-900 border-t border-white/10 shadow-2xl flex flex-col overflow-hidden transition-[border-radius] duration-200 ${
                  isAtTop ? "rounded-t-none" : "rounded-t-3xl"
                }`}
                style={{
                  maxHeight: `${maxHeight}vh`,
                }}
              >
                {/* Drag Handle - FIXED WITH DUAL EVENT HANDLERS */}
                <div
                  ref={handleRef}
                  {...bind()}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  data-bottom-sheet-handle
                  className="w-full flex items-center justify-center py-3 cursor-grab active:cursor-grabbing select-none"
                  style={{
                    touchAction: "none",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                  }}
                >
                  <div className="w-12 h-1.5 bg-gray-600 rounded-full transition-colors duration-200 hover:bg-gray-500 pointer-events-none" />
                </div>

                {/* Header */}
                {header && (
                  <div className="px-6 pb-4 border-b border-white/5 flex-shrink-0">
                    {header}
                  </div>
                )}

                {/* Content */}
                <div
                  ref={contentRef}
                  className="flex-1 overflow-y-auto overscroll-contain"
                  onScroll={handleContentScroll}
                  style={{
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {children}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    );
  }
) as React.ForwardRefExoticComponent<
  React.PropsWithoutRef<BottomSheetProps> &
    React.RefAttributes<BottomSheetHandle>
>;

export default BottomSheet;

// Hook to use BottomSheet imperatively
export function useBottomSheet() {
  const ref = useRef<BottomSheetHandle | null>(null);

  const open = useCallback(() => {
    ref.current?.open();
  }, []);
  const close = useCallback(() => {
    ref.current?.close();
  }, []);
  const toggle = useCallback(() => {
    ref.current?.toggle();
  }, []);
  const snapToRef = useCallback((i: number) => {
    ref.current?.snapTo(i);
  }, []);
  const isOpen = useCallback(() => !!ref.current?.isOpen(), []);

  return { ref, open, close, toggle, snapTo: snapToRef, isOpen } as const;
}

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "./I18nContext";
import type { ApiNotification } from "./NotificationContext";

interface NotificationPopoverProps {
  notifications: ApiNotification[];
  hasUnread?: boolean;
  markingReadIds: Set<number>;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  isMarkingAll?: boolean;
  onOpen?: () => void;
  getTimeAgo: (dateStr: string) => string;
  trigger?: React.ReactNode;
  isMobile?: boolean;
}

const useNotificationLabels = () => {
  const { language, direction } = useI18n();
  return {
    language,
    direction,
    title: language === "fa" ? "اعلان‌ها" : "Notifications",
    close: language === "fa" ? "بستن" : "Close",
    markAll: language === "fa" ? "همه خوانده شد" : "Mark all as read",
    working: language === "fa" ? "در حال انجام..." : "Working...",
    empty: language === "fa" ? "اعلان جدیدی وجود ندارد" : "No new notifications",
    markOne: language === "fa" ? "خوانده‌شده علامت بزن" : "Mark as read",
    text: (notification: ApiNotification) =>
      language === "en"
        ? notification.text_en || notification.text
        : notification.text,
  };
};

const Bell = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function NotificationPopover({
  notifications,
  hasUnread,
  markingReadIds,
  onMarkAsRead,
  onMarkAllAsRead,
  isMarkingAll = false,
  onOpen,
  getTimeAgo,
  trigger,
  isMobile = false,
}: NotificationPopoverProps) {
  const labels = useNotificationLabels();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const dialog = document.querySelector('[data-notification-dialog]');
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        !(dialog && dialog.contains(target))
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const ContentComponent = isMobile ? MobileContent : DesktopContent;

  return (
    <div ref={popoverRef} className="relative">
      {trigger || (
        <button
          aria-label={labels.title}
          className="text-white/90 p-2 rounded-md hover:bg-white/5 transition relative"
          onClick={(e) => {
            // Capture desktop click coords so popover can appear to the right and below cursor
            if (e && "clientX" in e) {
              const ev = e as React.MouseEvent;
              setAnchor({ x: ev.clientX, y: ev.clientY });
            }
            // Keep provider-side effects out of React state updater functions.
            // Calling onOpen() from inside setOpen(current => ...) causes React to
            // update NotificationProvider while NotificationPopover is calculating
            // its own state, which triggers the cross-component render warning.
            const nextOpen = !open;
            setOpen(nextOpen);
            if (nextOpen) {
              onOpen?.();
            }
          }}
        >
          <Bell className="w-6 h-6" />
          {(hasUnread ?? notifications.some((n) => !n.has_read)) && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black shadow-sm animate-pulse" />
          )}
        </button>
      )}

      <AnimatePresence>
        {open && (
          <ContentComponent
            notifications={notifications}
            markingReadIds={markingReadIds}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
            isMarkingAll={isMarkingAll}
            getTimeAgo={getTimeAgo}
            onClose={() => setOpen(false)}
            anchor={!isMobile ? (anchor ?? undefined) : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface ContentProps {
  notifications: ApiNotification[];
  markingReadIds: Set<number>;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  isMarkingAll: boolean;
  getTimeAgo: (dateStr: string) => string;
  onClose: () => void;
  anchor?: { x: number; y: number } | undefined;
}

// Mobile: Full-width centered container with slide animation from top
function MobileContent({
  notifications,
  markingReadIds,
  onMarkAsRead,
  onMarkAllAsRead,
  isMarkingAll,
  getTimeAgo,
  onClose,
}: ContentProps) {
  const labels = useNotificationLabels();
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.2,
          ease: [0.32, 0.72, 0, 1], // Smooth ease for low-end devices
        }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100"
        onClick={onClose}
        style={{
          // Force GPU acceleration
          transform: "translateZ(0)",
          WebkitBackfaceVisibility: "hidden",
          WebkitPerspective: 1000,
        }}
      />

      {/* Full-width notification panel */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{
          duration: 0.25,
          ease: [0.32, 0.72, 0, 1], // Optimized easing
          opacity: { duration: 0.2 },
        }}
        role="dialog"
        data-notification-dialog
        aria-label={labels.title}
        dir={labels.direction}
        className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-101"
        style={{
          // Performance optimizations
          transform: "translate3d(0, 0, 0)",
          WebkitBackfaceVisibility: "hidden",
          WebkitFontSmoothing: "antialiased",
          willChange: "transform, opacity",
        }}
      >
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="font-bold text-base text-zinc-100">{labels.title}</div>
            <div className="flex gap-3 items-center">
              {notifications.length > 0 && (
                <button
                  className="text-xs text-emerald-400 hover:text-emerald-300 disabled:text-zinc-600 disabled:cursor-wait font-medium transition-colors active:scale-95"
                  onClick={onMarkAllAsRead}
                  disabled={isMarkingAll}
                >
                  {isMarkingAll ? labels.working : labels.markAll}
                </button>
              )}
              <button
                className="text-xs text-zinc-400 hover:text-white transition-colors active:scale-95"
                onClick={onClose}
              >
                {labels.close}
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto p-3 no-scrollbar">
            {notifications.length === 0 ? (
              <div className="text-zinc-400 text-sm py-12 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-zinc-500" />
                </div>
                {labels.empty}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {notifications.map((n, index) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100, height: 0 }}
                    transition={{
                      layout: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
                      opacity: { duration: 0.15 },
                      y: { duration: 0.2 },
                      delay: index * 0.03, // Stagger effect
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors border border-transparent hover:border-white/5 ${
                      n.removing ? "removing" : ""
                    }`}
                    style={{
                      // GPU acceleration
                      transform: "translateZ(0)",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                  >
                    <NotificationCheckbox
                      notification={n}
                      isMarking={markingReadIds.has(n.id)}
                      onMarkAsRead={onMarkAsRead}
                    />
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <div className="text-sm text-zinc-200 leading-relaxed font-medium line-clamp-2">
                        {labels.text(n)}
                      </div>
                      <div className="text-xs text-zinc-400 font-medium">
                        {getTimeAgo(n.created_at)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

// Desktop: Popover anchored to trigger
function DesktopContent({
  notifications,
  markingReadIds,
  onMarkAsRead,
  onMarkAllAsRead,
  isMarkingAll,
  getTimeAgo,
  onClose,
  anchor,
}: ContentProps) {
  const labels = useNotificationLabels();
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!anchor || typeof window === "undefined") {
      setPos(null);
      return;
    }

    const width = 320;
    const padding = 12;
    const calcLeft = Math.min(
      anchor.x + 8,
      Math.max(8, window.innerWidth - width - padding),
    );
    const calcTop = Math.min(
      anchor.y + 8,
      Math.max(8, window.innerHeight - 80),
    );
    setPos({ top: calcTop, left: calcLeft });
  }, [anchor]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{
        duration: 0.2,
        ease: [0.32, 0.72, 0, 1],
      }}
      role="dialog"
      data-notification-dialog
      aria-label={labels.title}
      dir={labels.direction}
      className="z-100"
      style={{
        position: pos ? "fixed" : "absolute",
        top: pos ? `${pos.top}px` : "calc(100% + 8px)",
        left: pos ? `${pos.left}px` : undefined,
        right: pos ? undefined : 0,
        width: "320px",
        minWidth: "320px",
        transform: "translateZ(0)",
        WebkitBackfaceVisibility: "hidden",
        willChange: "transform, opacity",
      }}
    >
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="font-bold text-sm text-zinc-100">{labels.title}</div>
          <div className="flex gap-3 items-center">
            {notifications.length > 0 && (
              <button
                className="text-[10px] text-emerald-400 hover:text-emerald-300 disabled:text-zinc-600 disabled:cursor-wait font-medium transition-colors"
                onClick={onMarkAllAsRead}
                disabled={isMarkingAll}
              >
                {isMarkingAll ? labels.working : labels.markAll}
              </button>
            )}
            <button
              className="text-[10px] text-zinc-400 hover:text-white transition-colors"
              onClick={onClose}
            >
              {labels.close}
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto p-3 no-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-zinc-400 text-xs py-10 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-zinc-500" />
              </div>
              {labels.empty}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {notifications.map((n, index) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 50, height: 0 }}
                  transition={{
                    layout: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
                    opacity: { duration: 0.15 },
                    delay: index * 0.02,
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 ${
                    n.removing ? "removing" : ""
                  }`}
                  style={{
                    transform: "translateZ(0)",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                >
                  <NotificationCheckbox
                    notification={n}
                    isMarking={markingReadIds.has(n.id)}
                    onMarkAsRead={onMarkAsRead}
                  />
                  <div className="flex-1 flex flex-col gap-0.5 min-w-0 text-start">
                    <div className="text-xs text-zinc-200 leading-relaxed font-medium line-clamp-2">
                      {labels.text(n)}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-medium">
                      {getTimeAgo(n.created_at)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Shared checkbox component
function NotificationCheckbox({
  notification,
  isMarking,
  onMarkAsRead,
}: {
  notification: ApiNotification;
  isMarking: boolean;
  onMarkAsRead: (id: number) => void;
}) {
  const labels = useNotificationLabels();
  return (
    <button
      role="checkbox"
      aria-label={labels.markOne}
      aria-checked={notification.has_read}
      disabled={isMarking}
      onClick={() => onMarkAsRead(notification.id)}
      className={`flex items-center justify-center shrink-0 w-7 h-7 rounded-lg border-2 transition-all duration-200 ${
        notification.has_read || isMarking
          ? "border-emerald-500 bg-emerald-500"
          : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500 active:scale-95"
      }`}
      style={{
        transform: "translateZ(0)",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      {isMarking ? (
        <svg
          className="animate-spin h-3.5 w-3.5 text-black"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <motion.svg
          initial={false}
          animate={{
            opacity: notification.has_read ? 1 : 0,
            scale: notification.has_read ? 1 : 0.5,
          }}
          transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
          viewBox="0 0 24 24"
          className="w-4 h-4 text-black"
          fill="none"
        >
          <path
            d="M5 12.5l4 4L19 7"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      )}
    </button>
  );
}

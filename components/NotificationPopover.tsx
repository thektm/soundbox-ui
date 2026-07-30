import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useI18n } from "./I18nContext";
import type { ApiNotification } from "./NotificationContext";

const NotificationPanel = dynamic(() => import("./NotificationPanel"), {
  ssr: false,
  loading: () => null,
});

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

      {open && (
        <NotificationPanel
          notifications={notifications}
          markingReadIds={markingReadIds}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
          isMarkingAll={isMarkingAll}
          getTimeAgo={getTimeAgo}
          onClose={() => setOpen(false)}
          anchor={!isMobile ? (anchor ?? undefined) : undefined}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}


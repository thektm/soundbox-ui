"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { useI18n } from "./I18nContext";

const NETWORK_TOAST_ID = "sedabox-global-network-status";
const OFFLINE_MESSAGE =
  "در اتصال به سرور مشکلی پیش آمده است. لطفاً اتصال اینترنت خود را بررسی کنید.";

/**
 * App-wide connectivity feedback. This is mounted once above every screen so
 * connectivity loss is reported even when no player or API request is active.
 */
export default function NetworkStatusMonitor() {
  const { t } = useI18n();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncStatus = () => {
      if (navigator.onLine) {
        toast.dismiss(NETWORK_TOAST_ID);
        return;
      }

      toast.error(t(OFFLINE_MESSAGE), {
        id: NETWORK_TOAST_ID,
        duration: Infinity,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") syncStatus();
    };

    syncStatus();
    window.addEventListener("offline", syncStatus, { passive: true });
    window.addEventListener("online", syncStatus, { passive: true });
    window.addEventListener("focus", syncStatus, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("offline", syncStatus);
      window.removeEventListener("online", syncStatus);
      window.removeEventListener("focus", syncStatus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      toast.dismiss(NETWORK_TOAST_ID);
    };
  }, [t]);

  return null;
}

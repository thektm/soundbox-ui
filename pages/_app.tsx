import "@/styles/globals.css";
import type { AppProps } from "next/app";
import React from "react";
import dynamic from "next/dynamic";
import { AppRouter } from "@/components/AppRouter";
import ResponsiveAppShell from "../components/ResponsiveAppShell";
import toast, { Toaster, ToastBar, type Toast } from "react-hot-toast";
import { SEO } from "@/components/SEO";
import { I18nProvider, useI18n } from "@/components/I18nContext";
import { ImageCropperProvider } from "@/components/ImageCropperContext";
import {
  installClientFetchGuard,
  sanitizeUserFacingErrorText,
} from "@/lib/clientError";

const AppContainer = dynamic(() => import("../components/AppContainer"), {
  ssr: false,
});

// Install before React renders so even the earliest child effects never receive
// browser-specific messages such as "Failed to fetch" or Safari "Load failed".
if (typeof window !== "undefined") installClientFetchGuard();

// Shared toast style object (avoids re-creating on every render)
const toastStyle = {
  background: "var(--background)",
  color: "var(--foreground)",
  boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
  border: "1px solid rgba(255,255,255,0.04)",
  padding: "12px 16px",
  borderRadius: "12px",
  fontFamily: "'Vazir', Arial, Helvetica, sans-serif",
  cursor: "pointer",
} as const;

const toastOptions = {
  duration: 3000,
  style: toastStyle,
  className: "sb-toast",
  success: { className: "sb-toast sb-toast--success" },
  error: { className: "sb-toast sb-toast--error" },
} as const;

const containerStyle = {
  zIndex: 100000,
  bottom: "var(--sb-safe-bottom, env(safe-area-inset-bottom, 0px))",
} as const;

function LocalizedToastBar({ toastItem }: { toastItem: Toast }) {
  const { language } = useI18n();
  const message =
    typeof toastItem.message === "string"
      ? sanitizeUserFacingErrorText(toastItem.message, language, {
          fa: "خطایی رخ داد. لطفاً دوباره تلاش کنید.",
          en: "Something went wrong. Please try again.",
        })
      : toastItem.message;

  return <ToastBar toast={{ ...toastItem, message }} />;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <I18nProvider>
      <SEO />
      <AppContainer>
        <Toaster
          position="bottom-center"
          containerStyle={containerStyle}
          toastOptions={toastOptions}
        >
          {(toastItem) => (
            <div onClick={() => toast.dismiss(toastItem.id)}>
              <LocalizedToastBar toastItem={toastItem} />
            </div>
          )}
        </Toaster>
        <ImageCropperProvider>
          <ResponsiveAppShell>
            <AppRouter />
          </ResponsiveAppShell>
        </ImageCropperProvider>
      </AppContainer>
    </I18nProvider>
  );
}

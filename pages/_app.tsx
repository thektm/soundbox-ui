import "@/styles/globals.css";
import type { AppProps } from "next/app";
import React from "react";
import dynamic from "next/dynamic";
import { AppRouter } from "@/components/AppRouter";
import ResponsiveAppShell from "../components/ResponsiveAppShell";
import { Toaster } from "react-hot-toast";
import { SEO } from "@/components/SEO";

const AppContainer = dynamic(() => import("../components/AppContainer"), {
  ssr: false,
});

// Shared toast style object (avoids re-creating on every render)
const toastStyle = {
  background: "var(--background)",
  color: "var(--foreground)",
  boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
  border: "1px solid rgba(255,255,255,0.04)",
  padding: "12px 16px",
  borderRadius: "12px",
  fontFamily: "'Vazir', Arial, Helvetica, sans-serif",
} as const;

const toastOptions = {
  duration: 4000,
  style: toastStyle,
  className: "sb-toast",
  success: { className: "sb-toast sb-toast--success" },
  error: { className: "sb-toast sb-toast--error" },
} as const;

const containerStyle = { zIndex: 100000 } as const;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <SEO />
      <AppContainer>
        <Toaster
          position="bottom-center"
          containerStyle={containerStyle}
          toastOptions={toastOptions}
        />
        <ResponsiveAppShell>
          <AppRouter />
        </ResponsiveAppShell>
      </AppContainer>
    </>
  );
}

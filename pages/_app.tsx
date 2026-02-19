import "@/styles/globals.css";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { AppRouter } from "@/components/AppRouter";
import ResponsiveAppShell from "../components/ResponsiveAppShell";
import { Toaster } from "react-hot-toast";

const AppContainer = dynamic(() => import("../components/AppContainer"), {
  ssr: false,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppContainer>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "var(--background)",
            color: "var(--foreground)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.04)",
            padding: "12px 16px",
            borderRadius: "12px",
            fontFamily: "'Vazir', Arial, Helvetica, sans-serif",
          },
          className: "sb-toast",
          success: { className: "sb-toast sb-toast--success" },
          error: { className: "sb-toast sb-toast--error" },
        }}
      />
      <ResponsiveAppShell>
        <AppRouter />
      </ResponsiveAppShell>
    </AppContainer>
  );
}

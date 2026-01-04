import "@/styles/globals.css";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import AppRouter from "../components/AppRouter";
import ResponsiveAppShell from "../components/ResponsiveAppShell";
import { Toaster } from "sonner";

const AppContainer = dynamic(() => import("../components/AppContainer"), {
  ssr: false,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppContainer>
      <Toaster
        position="top-center"
        richColors
        closeButton
        theme="dark"
        dir="rtl"
      />
      <ResponsiveAppShell>
        <AppRouter />
      </ResponsiveAppShell>
    </AppContainer>
  );
}

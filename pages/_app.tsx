import "@/styles/globals.css";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import AppRouter from "../components/AppRouter";
import ResponsiveAppShell from "../components/ResponsiveAppShell";

const AppContainer = dynamic(() => import("../appcontainer"), { ssr: false });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AppContainer>
      <ResponsiveAppShell>
        <AppRouter />
      </ResponsiveAppShell>
    </AppContainer>
  );
}

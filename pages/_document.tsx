import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="fa" dir="rtl">
      <Head>
        {/* Preconnect to CDN / API origins to shave off DNS+TLS time */}
        <link
          rel="preconnect"
          href="https://cdn.sedabox.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://cdn.sedabox.com" />

        {/* Icons and favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Preload the primary font weight used on every page */}
        <link
          rel="preload"
          href="/vazir.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />

        {/* Theme colour for mobile browsers */}
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="color-scheme" content="dark" />

        {/* Critical inline CSS: dark background prevents white flash before CSS loads */}
        <style
          dangerouslySetInnerHTML={{
            __html: `html,body{background:#0a0a0a;color:#ededed;margin:0;scrollbar-gutter: stable;}`,
          }}
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
        <div id="music-player-root"></div>
      </body>
    </Html>
  );
}

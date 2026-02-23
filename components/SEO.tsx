import Head from "next/head";
import React from "react";

interface SEOProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  type?:
    | "website"
    | "music.song"
    | "music.album"
    | "profile"
    | "music.playlist";
  canonicalUrl?: string;
}

const DEFAULT_TITLE = "وب اپلیکیشن صداباکس";
const DEFAULT_DESC =
  "صداباکس، بزرگترین پلتفرم پخش آنلاین آهنگ و ویدیوهای موسیقی ایرانی. از شنیدن بهترین کارهای هنرمندان مورد علاقه خود لذت ببرید.";
const DEFAULT_URL = "https://sedabox.com"; // Adjust as needed
const DEFAULT_IMAGE = "/logo.png"; // use public/logo.png from the app's public folder

export const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESC,
  imageUrl = DEFAULT_IMAGE,
  type = "website",
  canonicalUrl,
}) => {
  const fullTitle = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;

  // Use default image if imageUrl is null or empty
  const imgUrl = imageUrl || DEFAULT_IMAGE;

  // Ensure image URLs are absolute (required by many crawlers/social cards)
  const resolvedImageUrl =
    typeof window === "undefined"
      ? // server: use canonical/default host
        imgUrl.startsWith("http")
        ? imgUrl
        : `${DEFAULT_URL}${imgUrl.startsWith("/") ? imgUrl : "/" + imgUrl}`
      : // client: can use origin when available
        imgUrl.startsWith("http")
        ? imgUrl
        : `${window.location.origin}${imgUrl.startsWith("/") ? imgUrl : "/" + imgUrl}`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, viewport-fit=cover"
      />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={resolvedImageUrl} />
      <meta property="og:url" content={canonicalUrl || DEFAULT_URL} />
      <meta property="og:site_name" content={DEFAULT_TITLE} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedImageUrl} />

      {/* Dynamic Canonical Link */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Mobile Meta (Standard SEO) */}
      <meta name="application-name" content={DEFAULT_TITLE} />
      <meta name="apple-mobile-web-app-title" content={DEFAULT_TITLE} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
    </Head>
  );
};

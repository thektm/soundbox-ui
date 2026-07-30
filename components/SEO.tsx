import Head from "next/head";
import React from "react";
import { useI18n } from "./I18nContext";

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

const META = {
  fa: {
    siteTitle: "وب اپلیکیشن صداباکس",
    description:
      "صداباکس، بزرگترین پلتفرم پخش آنلاین آهنگ و ویدیوهای موسیقی ایرانی. از شنیدن بهترین کارهای هنرمندان مورد علاقه خود لذت ببرید.",
  },
  en: {
    siteTitle: "SedaBox Web App",
    description:
      "SedaBox is an online platform for streaming Iranian music and music videos. Enjoy the best releases from the artists you love.",
  },
} as const;

const DEFAULT_URL = "https://sedabox.com";
const DEFAULT_IMAGE = "/logo.png";

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  imageUrl = DEFAULT_IMAGE,
  type = "website",
  canonicalUrl,
}) => {
  const { language, t } = useI18n();
  const defaults = META[language];
  const localizedTitle = title ? t(title) : "";
  const localizedDescription = description ? t(description) : defaults.description;
  const fullTitle = localizedTitle
    ? `${localizedTitle} | ${defaults.siteTitle}`
    : defaults.siteTitle;
  const imgUrl = imageUrl || DEFAULT_IMAGE;

  const resolvedImageUrl =
    typeof window === "undefined"
      ? imgUrl.startsWith("http")
        ? imgUrl
        : `${DEFAULT_URL}${imgUrl.startsWith("/") ? imgUrl : `/${imgUrl}`}`
      : imgUrl.startsWith("http")
        ? imgUrl
        : `${window.location.origin}${imgUrl.startsWith("/") ? imgUrl : `/${imgUrl}`}`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={localizedDescription} />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, viewport-fit=cover"
      />

      <meta property="og:locale" content={language === "fa" ? "fa_IR" : "en_US"} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={localizedDescription} />
      <meta property="og:image" content={resolvedImageUrl} />
      <meta property="og:url" content={canonicalUrl || DEFAULT_URL} />
      <meta property="og:site_name" content={defaults.siteTitle} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={localizedDescription} />
      <meta name="twitter:image" content={resolvedImageUrl} />

      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      <meta name="application-name" content={defaults.siteTitle} />
      <meta name="apple-mobile-web-app-title" content={defaults.siteTitle} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
    </Head>
  );
};

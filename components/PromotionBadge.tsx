"use client";

import React from "react";
import { useI18n } from "./I18nContext";

type PromotionBadgeProps = {
  className?: string;
};

const PromotionBadge: React.FC<PromotionBadgeProps> = ({ className = "" }) => {
  const { language } = useI18n();

  return (
    <span
      className={`pointer-events-none inline-flex select-none items-center rounded-full border border-white/15 bg-gradient-to-r from-violet-600/90 via-purple-600/90 to-fuchsia-600/90 px-2 py-0.5 text-[10px] font-bold leading-4 tracking-tight text-white shadow-[0_4px_14px_rgba(126,34,206,0.24)] backdrop-blur-sm ${className}`}
      aria-label={language === "en" ? "Promoted" : "پرومو"}
    >
      {language === "en" ? "Promo" : "پرومو"}
    </span>
  );
};

export default PromotionBadge;

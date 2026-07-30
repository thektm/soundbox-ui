"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Download, Loader2, X } from "lucide-react";
import { useI18n } from "./I18nContext";
import ImageWithPlaceholder from "./ImageWithPlaceholder";

export type DownloadQuality = "128" | "320";

export interface DownloadQualityOption {
  quality: DownloadQuality;
  label: string;
  available: boolean;
  requires_premium?: boolean;
  reason?: string | null;
}

export type DownloadFlowStatus =
  | "loading-options"
  | "ready"
  | "downloading"
  | "success"
  | "error";

interface DownloadFlowModalProps {
  isOpen: boolean;
  track: {
    title: string;
    artist: string;
    image?: string;
  } | null;
  options: DownloadQualityOption[];
  selectedQuality: DownloadQuality | null;
  status: DownloadFlowStatus;
  progress: number | null;
  loadedBytes: number;
  totalBytes: number | null;
  error: string | null;
  onSelect: (quality: DownloadQuality) => void;
  onStart: () => void;
  onClose: () => void;
}

function formatBytes(value: number, locale: string) {
  if (!Number.isFinite(value) || value <= 0) return "0 MB";
  const megabytes = value / (1024 * 1024);
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(megabytes)} MB`;
}

export default function DownloadFlowModal({
  isOpen,
  track,
  options,
  selectedQuality,
  status,
  progress,
  loadedBytes,
  totalBytes,
  error,
  onSelect,
  onStart,
  onClose,
}: DownloadFlowModalProps) {
  const { direction, locale, t } = useI18n();
  const isBusy = status === "loading-options" || status === "downloading";
  const selectedOption = options.find(
    (option) => option.quality === selectedQuality,
  );

  return (
    <AnimatePresence>
      {isOpen && track && (
        <div
          className="fixed inset-0 z-[100500] flex items-end justify-center p-3 sm:items-center sm:p-6"
          dir={direction}
        >
          <motion.button
            type="button"
            aria-label={t("بستن")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 cursor-default bg-black/80 backdrop-blur-md"
            onClick={() => !isBusy && onClose()}
          />

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#101213] shadow-2xl"
          >
            <div className="flex items-center gap-4 border-b border-white/8 px-5 py-5">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/5">
                <ImageWithPlaceholder
                  src={track.image || ""}
                  alt={track.title}
                  className="h-full w-full object-cover"
                  type="song"
                  sizes="64px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-black text-white">
                  {t("دانلود موسیقی")}
                </h2>
                <p className="mt-1 truncate text-sm font-semibold text-white/85">
                  {track.title}
                </p>
                <p className="truncate text-xs text-white/45">{track.artist}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isBusy}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              {status === "loading-options" ? (
                <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
                  <p className="text-sm font-semibold text-white/70">
                    {t("در حال دریافت کیفیت‌های دانلود...")}
                  </p>
                </div>
              ) : status === "success" ? (
                <div className="flex min-h-52 flex-col items-center justify-center text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/25">
                    <Check className="h-8 w-8" strokeWidth={3} />
                  </div>
                  <h3 className="text-xl font-black text-white">
                    {t("دانلود با موفقیت آماده شد")}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-white/50">
                    {t("فایل کامل به مرورگر تحویل داده شد.")}
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-7 w-full rounded-2xl bg-white px-4 py-3.5 text-sm font-black text-black transition hover:bg-white/90 active:scale-[0.99]"
                  >
                    {t("بستن")}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h3 className="text-sm font-black text-white">
                      {t("کیفیت دانلود را انتخاب کنید")}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-white/45">
                      {t("فایل ابتدا کامل دریافت می‌شود و سپس به مرورگر تحویل داده می‌شود.")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {options.map((option) => {
                      const active = selectedQuality === option.quality;
                      return (
                        <button
                          key={option.quality}
                          type="button"
                          disabled={!option.available || status === "downloading"}
                          onClick={() => onSelect(option.quality)}
                          className={`relative rounded-2xl border px-4 py-4 text-start transition ${
                            active
                              ? "border-emerald-400/60 bg-emerald-500/12 shadow-[0_0_0_1px_rgba(52,211,153,0.08)]"
                              : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]"
                          } ${
                            !option.available
                              ? "cursor-not-allowed opacity-40 grayscale"
                              : ""
                          }`}
                        >
                          <span
                            dir="ltr"
                            className={`block text-lg font-black ${active ? "text-emerald-300" : "text-white"}`}
                          >
                            {option.label}
                          </span>
                          <span className="mt-1 block text-[11px] text-white/45">
                            {option.available
                              ? option.quality === "320"
                                ? t("کیفیت بالا")
                                : t("حجم کمتر")
                              : option.reason === "PREMIUM_REQUIRED"
                                ? t("ویژه کاربران پریمیوم")
                                : t("برای این آهنگ موجود نیست")}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {(status === "downloading" || status === "error") && (
                    <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4">
                      {status === "downloading" ? (
                        <>
                          <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-white/60">
                            <span>{t("در حال دریافت فایل...")}</span>
                            <span dir="ltr" className="tabular-nums text-white/80">
                              {progress === null ? "…" : `${Math.round(progress)}%`}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              className={`h-full rounded-full bg-emerald-400 ${progress === null ? "w-1/3" : ""}`}
                              animate={
                                progress === null
                                  ? { x: ["-120%", "320%"] }
                                  : { width: `${Math.max(2, progress)}%` }
                              }
                              transition={
                                progress === null
                                  ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                                  : { duration: 0.18, ease: "linear" }
                              }
                              style={progress === null ? undefined : { width: `${Math.max(2, progress)}%` }}
                            />
                          </div>
                          <p dir="ltr" className="mt-2 text-start text-[11px] tabular-nums text-white/35">
                            {totalBytes
                              ? `${formatBytes(loadedBytes, locale)} / ${formatBytes(totalBytes, locale)}`
                              : formatBytes(loadedBytes, locale)}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm leading-6 text-red-300">
                          {error || t("دانلود انجام نشد. دوباره تلاش کنید.")}
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={onStart}
                    disabled={
                      !selectedOption?.available || status === "downloading"
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3.5 text-sm font-black text-black transition hover:bg-emerald-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {status === "downloading" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Download className="h-5 w-5" />
                    )}
                    {status === "downloading"
                      ? t("در حال دانلود")
                      : t("شروع دانلود")}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

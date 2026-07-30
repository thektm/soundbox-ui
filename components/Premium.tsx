import React, { useRef, useEffect, useCallback, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Check, ShieldCheck, X } from "lucide-react";
import { SEO } from "./SEO";
import { useI18n } from "./I18nContext";
import { useAuth } from "./AuthContext";
import { openAuthPrompt } from "./authPrompt";
import { getUserFacingErrorMessage } from "../lib/clientError";

type PaymentStage = "select" | "processing" | "success" | "error";

const Premium: React.FC = () => {
  const { direction, language, t } = useI18n();
  const {
    isLoggedIn,
    user,
    authenticatedFetch,
    fetchUserProfile,
    applyUserSnapshot,
  } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastScrollY = useRef<number>(0);
  const ticking = useRef<boolean>(false);
  const [price, setPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState<boolean>(true);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentStage, setPaymentStage] = useState<PaymentStage>("select");
  const [paymentCountdown, setPaymentCountdown] = useState(10);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [premiumCelebrationKey, setPremiumCelebrationKey] = useState(0);
  const isPremium = user?.plan === "premium";
  const paymentTimerRef = useRef<number | null>(null);
  const paymentAbortRef = useRef<AbortController | null>(null);
  const paymentFinishingRef = useRef(false);
  const expiryRefreshRef = useRef<string | null>(null);
  const [premiumNowMs, setPremiumNowMs] = useState<number | null>(null);

  const applyTransforms = useCallback((scrollY: number) => {
    if (!headerRef.current) return;

    const progress = Math.min(scrollY / 400, 1);

    // Accelerate certain visual changes so they complete ~3x faster
    const acceleratedProgress = Math.min(progress * 3, 1);

    const scale = 1 - progress * 0.3;
    const opacity = 1 - progress;
    // Use accelerated progress for overlay so it darkens sooner on scroll
    const overlayOpacity = Math.min(acceleratedProgress * 0.7, 0.85);

    // Transform and opacity
    headerRef.current.style.transform = `translate3d(0,0,0) scale3d(${scale},${scale},1)`;
    headerRef.current.style.opacity = `${opacity}`;

    // Gradually round the top corners as scroll progress increases (matches bottom curve ≈ 48px)
    // Accelerated progress is used (defined above) so rounding completes ~3x faster
    const maxTopRadiusPx = 48; // ~3rem
    const topRadiusPx = Math.round(acceleratedProgress * maxTopRadiusPx);
    headerRef.current.style.borderTopLeftRadius = `${topRadiusPx}px`;
    headerRef.current.style.borderTopRightRadius = `${topRadiusPx}px`;

    if (overlayRef.current) {
      overlayRef.current.style.opacity = `${overlayOpacity}`;
    }
  }, []);

  useEffect(() => {
    // Fetch premium plan price
    let mounted = true;
    const controller = new AbortController();
    const fetchPrice = async () => {
      try {
        setPriceLoading(true);
        const res = await fetch("/api/premium-price", {
          signal: controller.signal,
          cache: "no-store",
          headers: { Accept: "application/json", "Cache-Control": "no-cache" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mounted && data && typeof data.price === "number" && data.price > 0) {
          setPrice(data.price);
        } else if (mounted) {
          setPriceError("قیمت در حال حاضر در دسترس نیست");
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        if (mounted) setPriceError("قیمت در حال حاضر در دسترس نیست");
      } finally {
        if (mounted) setPriceLoading(false);
      }
    };

    fetchPrice();

    return () => {
      mounted = false;
      controller.abort();
    };
    // only run once on mount
  }, []);

  const clearPaymentTimer = useCallback(() => {
    if (paymentTimerRef.current !== null) {
      window.clearInterval(paymentTimerRef.current);
      paymentTimerRef.current = null;
    }
  }, []);

  const closePaymentModal = useCallback(() => {
    if (paymentStage === "processing") return;
    clearPaymentTimer();
    paymentAbortRef.current?.abort();
    paymentAbortRef.current = null;
    paymentFinishingRef.current = false;
    setPaymentOpen(false);
    setPaymentStage("select");
    setPaymentCountdown(10);
    setPaymentError(null);
  }, [clearPaymentTimer, paymentStage]);

  const completePayment = useCallback(async () => {
    if (paymentFinishingRef.current) return;
    paymentFinishingRef.current = true;
    clearPaymentTimer();
    const controller = new AbortController();
    paymentAbortRef.current = controller;
    try {
      const response = await authenticatedFetch(
        "https://api.sedabox.com/api/plans/premium/activate/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gateway: "zarinpal" }),
          signal: controller.signal,
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload?.error?.message || payload?.message || "پرداخت انجام نشد",
        );
      }

      if (payload?.user) applyUserSnapshot(payload.user);
      setPremiumCelebrationKey((value) => value + 1);
      await fetchUserProfile();
      setPaymentCountdown(0);
      setPaymentStage("success");
      toast.success(t("اشتراک پریمیوم شما با موفقیت فعال شد"));
      window.setTimeout(() => {
        setPaymentOpen(false);
        setPaymentStage("select");
        setPaymentCountdown(10);
        paymentFinishingRef.current = false;
      }, 1900);
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      paymentFinishingRef.current = false;
      setPaymentError(
        getUserFacingErrorMessage(error, language, {
          fa: "پرداخت انجام نشد. لطفاً دوباره تلاش کنید.",
          en: "Payment could not be completed. Please try again.",
        }),
      );
      setPaymentStage("error");
    } finally {
      paymentAbortRef.current = null;
    }
  }, [
    applyUserSnapshot,
    authenticatedFetch,
    clearPaymentTimer,
    fetchUserProfile,
    language,
    t,
  ]);

  const startPayment = useCallback(() => {
    if (isPremium) return;
    if (!isLoggedIn) {
      openAuthPrompt({
        title: "برای خرید اشتراک وارد شوید",
        description: "برای ادامه پرداخت و فعال‌سازی پریمیوم باید ابتدا وارد حساب خود شوید.",
      });
      return;
    }
    if (priceLoading || price === null || price <= 0 || priceError) return;

    clearPaymentTimer();
    setPaymentError(null);
    setPaymentCountdown(10);
    setPaymentStage("processing");
    paymentFinishingRef.current = false;
    const deadline = Date.now() + 10_000;
    paymentTimerRef.current = window.setInterval(() => {
      const remainingMs = Math.max(0, deadline - Date.now());
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      setPaymentCountdown(remainingSeconds);
      if (remainingMs <= 0) void completePayment();
    }, 200);
  }, [clearPaymentTimer, completePayment, isLoggedIn, isPremium, price, priceError, priceLoading]);

  const openPaymentModal = useCallback(() => {
    if (isPremium) return;
    if (!isLoggedIn) {
      openAuthPrompt({
        title: "برای خرید اشتراک وارد شوید",
        description: "برای ادامه پرداخت و فعال‌سازی پریمیوم باید ابتدا وارد حساب خود شوید.",
      });
      return;
    }
    setPaymentStage("select");
    setPaymentCountdown(10);
    setPaymentError(null);
    setPaymentOpen(true);
  }, [isLoggedIn, isPremium]);

  useEffect(() => {
    if (!paymentOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && paymentStage !== "processing") {
        closePaymentModal();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closePaymentModal, paymentOpen, paymentStage]);

  useEffect(() => () => {
    clearPaymentTimer();
    paymentAbortRef.current?.abort();
  }, [clearPaymentTimer]);

  useEffect(() => {
    const expiryValue = user?.premium_expires_at ?? null;
    if (user?.plan !== "premium" || !expiryValue) {
      setPremiumNowMs(null);
      expiryRefreshRef.current = null;
      return;
    }

    const expiryMs = Date.parse(expiryValue);
    if (!Number.isFinite(expiryMs)) {
      setPremiumNowMs(null);
      expiryRefreshRef.current = null;
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      setPremiumNowMs(now);

      if (now >= expiryMs && expiryRefreshRef.current !== expiryValue) {
        expiryRefreshRef.current = expiryValue;
        void fetchUserProfile();
      }
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1_000);
    return () => window.clearInterval(intervalId);
  }, [fetchUserProfile, user?.plan, user?.premium_expires_at]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      lastScrollY.current = container.scrollTop;

      if (!ticking.current) {
        ticking.current = true;
        rafRef.current = requestAnimationFrame(() => {
          applyTransforms(lastScrollY.current);
          ticking.current = false;
        });
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });

    // Initial apply
    applyTransforms(0);

    return () => {
      container.removeEventListener("scroll", onScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [applyTransforms]);

  const formattedPrice =
    price === null
      ? "—"
      : new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(price);

  const premiumExpiryValue = user?.premium_expires_at ?? null;
  const premiumExpiryMs = premiumExpiryValue
    ? Date.parse(premiumExpiryValue)
    : Number.NaN;
  const hasTimedPremium = Number.isFinite(premiumExpiryMs);
  const premiumRemainingMs = hasTimedPremium && premiumNowMs !== null
    ? Math.max(0, premiumExpiryMs - premiumNowMs)
    : null;

  const premiumRemainingContent = (() => {
    if (premiumRemainingMs === null) return null;
    if (premiumRemainingMs <= 0) {
      return direction === "rtl"
        ? "اشتراک شما منقضی شده است"
        : "Your subscription has expired";
    }

    const totalSeconds = Math.floor(premiumRemainingMs / 1000);
    const days = Math.floor(totalSeconds / 86_400);
    const hours = Math.floor((totalSeconds % 86_400) / 3_600);
    const minutes = Math.floor((totalSeconds % 3_600) / 60);
    const seconds = totalSeconds % 60;
    const numberFormatter = new Intl.NumberFormat(
      direction === "rtl" ? "fa-IR" : "en-US",
      { useGrouping: false },
    );

    if (direction === "rtl") {
      const parts = [
        days > 0 ? { value: days, unit: "روز" } : null,
        { value: hours, unit: "ساعت" },
        { value: minutes, unit: "دقیقه" },
        { value: seconds, unit: "ثانیه" },
      ].filter((part): part is { value: number; unit: string } => Boolean(part));

      return (
        <span
          dir="rtl"
          className="flex w-full flex-wrap items-baseline justify-start gap-x-1 gap-y-1 text-right"
          style={{ unicodeBidi: "isolate" }}
        >
          {parts.map((part, index) => (
            <React.Fragment key={part.unit}>
              <span
                dir="rtl"
                className="inline-flex items-baseline gap-1 whitespace-nowrap"
                style={{ unicodeBidi: "isolate" }}
              >
                <bdi dir="ltr" className="tabular-nums">
                  {numberFormatter.format(part.value)}
                </bdi>
                <span>{part.unit}</span>
              </span>
              {index < parts.length - 1 && (
                <span aria-hidden="true" className="select-none">
                  ،
                </span>
              )}
            </React.Fragment>
          ))}
          <span className="whitespace-nowrap">باقی‌مانده</span>
        </span>
      );
    }

    const parts = [
      days > 0 ? { value: days, unit: "d" } : null,
      { value: hours, unit: "h" },
      { value: minutes, unit: "m" },
      { value: seconds, unit: "s" },
    ].filter((part): part is { value: number; unit: string } => Boolean(part));

    return (
      <span
        dir="ltr"
        className="flex w-full flex-wrap items-baseline justify-start gap-x-2 gap-y-1 text-left"
        style={{ unicodeBidi: "isolate" }}
      >
        {parts.map((part) => (
          <span key={part.unit} className="inline-flex items-baseline gap-0.5 whitespace-nowrap">
            <bdi dir="ltr" className="tabular-nums">
              {numberFormatter.format(part.value)}
            </bdi>
            <span>{part.unit}</span>
          </span>
        ))}
        <span className="whitespace-nowrap">remaining</span>
      </span>
    );
  })();

  return (
    <>
    <div
      ref={containerRef}
      className="flex flex-col h-screen bg-[#121212] text-white overflow-y-auto overflow-x-hidden scroll-smooth"
    >
      <SEO
        title="خرید اشتراک پریمیوم"
        description="با خرید اشتراک پریمیوم صداباکس، از پخش آهنگ‌ها با بالاترین کیفیت، بدون تبلیغات و با امکانات ویژه لذت ببرید."
      />
      {/* Premium Header Image - GPU-accelerated */}
      <div
        ref={headerRef}
        className="sticky top-0 w-full h-[35vh] flex-shrink-0 z-0 origin-center overflow-hidden rounded-b-[3rem] relative"
        style={{
          willChange: "transform, opacity, border-radius",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          perspective: 1000,
          WebkitPerspective: 1000,
          contain: "layout style paint",
        }}
      >
        <Image
          src="/premium-bg.jpg"
          alt="Premium background"
          fill
          sizes="100vw"
          className="rounded-b-[3rem] object-cover"
          priority
        />
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent"
          style={{ opacity: 0, transition: "opacity 220ms linear" }}
        />
      </div>

      {/* Content Area */}
      <div className="px-6 -mt-32 relative z-10 pb-32 max-w-4xl mx-auto w-full">
        {/* Title above the cards */}
        <div className="mb-10 text-start">
          <h2 className="text-3xl md:text-4xl font-black mb-3 text-white drop-shadow-lg">
            پرمیوم
          </h2>
          <p className="text-zinc-300 text-lg md:text-xl font-medium drop-shadow-md">
            بهترین تجربه موسیقی را با صداباکس داشته باشید
          </p>
        </div>

        {isPremium && (
          <div
            key={`premium-current-${premiumCelebrationKey}`}
            className="premium-current-banner mb-7 overflow-hidden rounded-[26px] border border-emerald-400/25 bg-gradient-to-br from-emerald-500/18 via-zinc-900/95 to-cyan-500/10 p-5 shadow-[0_22px_60px_rgba(16,185,129,.12)] sm:p-6"
          >
            <div className="flex items-center gap-4">
              <span className="premium-current-icon grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-400 text-zinc-950 shadow-[0_12px_35px_rgba(52,211,153,.28)]">
                <Check className="h-7 w-7" strokeWidth={3} />
              </span>
              <div className="min-w-0 flex-1 text-start">
                <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-300">{t("پلن فعلی شما")}</p>
                <h3 className="mt-1 text-xl font-black text-white sm:text-2xl">{t("صداباکس پریمیوم فعال است")}</h3>
                <p
                  className="mt-1 text-sm tabular-nums text-zinc-300"
                  dir={direction === "rtl" ? "rtl" : "ltr"}
                >
                  {premiumRemainingContent ?? t("اشتراک پریمیوم شما فعال است")}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Free Plan */}
          <article
            className="bg-zinc-900/90 rounded-3xl p-8 border border-white/5 flex flex-col shadow-xl"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">پلن رایگان</h3>
              <p className="text-zinc-400 text-sm">مناسب برای شروع</p>
            </div>

            <ul
              className="flex-1 space-y-5 mb-10"
              aria-label="ویژگی‌های پلن رایگان"
            >
              <li className="flex items-center gap-3 text-zinc-300">
                <div
                  className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0"
                  aria-hidden="true"
                >
                  <svg
                    className="w-3 h-3 text-zinc-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 12h14"
                    />
                  </svg>
                </div>
                <span className="text-sm">
                  پخش آنلاین موسیقی با تبلیغ صوتی / بنری
                </span>
              </li>

              <li className="flex items-center gap-3 text-zinc-300">
                <div
                  className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"
                  aria-hidden="true"
                >
                  <svg
                    className="w-3 h-3 text-black"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm">کیفیت پخش متوسط (128kbps)</span>
              </li>

              <li className="flex items-center gap-3 text-zinc-300">
                <div
                  className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0"
                  aria-hidden="true"
                >
                  <svg
                    className="w-3 h-3 text-zinc-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <span className="text-sm">محدودیت در رد کردن آهنگ (Skip)</span>
              </li>

              <li className="flex items-center gap-3 text-zinc-300">
                <div
                  className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0"
                  aria-hidden="true"
                >
                  <svg
                    className="w-3 h-3 text-zinc-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </div>
                <span className="text-sm">پلی‌لیست محدود</span>
              </li>

              <li className="flex items-center gap-3 text-zinc-300">
                <div
                  className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0"
                  aria-hidden="true"
                >
                  <svg
                    className="w-3 h-3 text-zinc-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6l4 2"
                    />
                  </svg>
                </div>
                <span className="text-sm">الگوریتم محدود</span>
              </li>

              <li className="flex items-center gap-3 text-zinc-400">
                <div
                  className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0"
                  aria-hidden="true"
                >
                  <svg
                    className="w-3 h-3 text-zinc-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <span className="text-sm line-through">
                  عدم دسترسی به دانلود
                </span>
              </li>
            </ul>

            <button
              disabled
              className="w-full py-4 rounded-full bg-zinc-800 text-zinc-400 font-bold cursor-default transition-all"
              aria-label={isPremium ? t("پلن رایگان") : t("پلن فعلی شما پلن رایگان است")}
            >
              {isPremium ? t("پلن رایگان") : t("پلن فعلی")}
            </button>
          </article>

          {/* Premium Plan */}
          <article
            className={`relative rounded-3xl border p-8 flex flex-col shadow-2xl scale-105 z-10 ring-1 ${isPremium ? "premium-current-card border-emerald-300/55 bg-emerald-950/35 ring-emerald-400/35" : "border-emerald-500/30 bg-zinc-900/90 ring-emerald-500/20"}`}
          >
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg"
              aria-hidden="true"
            >
              {isPremium ? t("پلن فعلی") : t("پیشنهادی")}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-0">
                  پلن پریمیوم
                </h2>
                <div
                  className="inline-flex items-baseline gap-2 bg-gradient-to-r from-emerald-600 to-emerald-400 text-black font-extrabold px-3 py-1 rounded-full shadow-lg min-w-[124px] justify-center transition-all duration-300"
                  aria-label={`قیمت: ${price !== null ? price : ""} تومان`}
                >
                  {priceLoading ? (
                    <span
                      className="text-xl md:text-2xl animate-pulse"
                      aria-hidden="true"
                    >
                      ...
                    </span>
                  ) : priceError ? (
                    <span className="text-sm text-red-500">{priceError}</span>
                  ) : (
                    <span className="text-xl md:text-2xl">
                      {formattedPrice}
                    </span>
                  )}
                  <span
                    className="text-sm md:text-base font-semibold"
                    aria-hidden="true"
                  >
                    تومان
                  </span>
                </div>
              </div>
              <p className="text-zinc-400 text-sm mt-2">تجربه حرفه‌ای موسیقی</p>
            </div>

            <ul
              className="flex-1 space-y-5 mb-10"
              aria-label="ویژگی‌های پلن پریمیوم"
            >
              {[
                "پخش آنلاین موسیقی بدون محدودیت",
                "بدون تبلیغ",
                "کیفیت بالا (320kbps)",
                "نشان تایید ⭐️ یا Badge کنار نام کاربر",
                "Skip نامحدود",
                "دانلود آثار موسیقی",
                "الگوریتم کامل",
                "پلی‌لیست نامحدود",
                "دسترسی زودتر به ویژگی‌های جدید",
              ].map((text, idx) => (
                <li key={idx} className="flex items-center gap-3 text-white">
                  <div
                    className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"
                    aria-hidden="true"
                  >
                    <svg
                      className="w-3 h-3 text-black"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">{text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={openPaymentModal}
              disabled={isPremium || priceLoading || price === null || price <= 0 || Boolean(priceError)}
              className="w-full py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20 focus-visible:ring-4 focus-visible:ring-emerald-500/50 outline-none disabled:cursor-default disabled:opacity-80 disabled:hover:scale-100"
            >
              {isPremium ? t("پلن فعلی شما") : t("ارتقا به این پلن")}
            </button>
          </article>
        </div>
      </div>
    </div>

    {paymentOpen && (
      <div
        className="premium-payment-backdrop fixed inset-0 z-[140000] flex items-end justify-center bg-black/75 p-3 backdrop-blur-md sm:items-center sm:p-6"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) closePaymentModal();
        }}
      >
        <section
          dir={direction}
          role="dialog"
          aria-modal="true"
          aria-labelledby="premium-payment-title"
          className="premium-payment-card relative w-full max-w-[480px] overflow-hidden rounded-[26px] border border-white/10 bg-[#171717] text-white shadow-[0_35px_120px_rgba(0,0,0,.78)] sm:rounded-[30px]"
        >
          <div className="pointer-events-none absolute -top-28 end-[-5rem] h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 start-[-5rem] h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" />

          {paymentStage !== "processing" && paymentStage !== "success" && (
            <button
              type="button"
              onClick={closePaymentModal}
              className="absolute end-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/10 text-zinc-200 backdrop-blur transition hover:bg-white/15 active:scale-95"
              aria-label={t("بستن پنجره")}
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="relative p-5 sm:p-7">
            {paymentStage === "select" && (
              <>
                <div className="mb-6 pe-11">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[.08] px-3 py-1.5 text-xs font-bold text-emerald-300">
                    <ShieldCheck className="h-4 w-4" />
                    {t("پرداخت امن اشتراک")}
                  </div>
                  <h2 id="premium-payment-title" className="text-2xl font-black tracking-tight sm:text-3xl">
                    {t("انتخاب درگاه پرداخت")}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {t("برای ادامه پرداخت، درگاه موردنظر را انتخاب کنید")}
                  </p>
                </div>

                <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/[.08] bg-white/[.045] px-4 py-3.5 shadow-sm">
                  <span className="text-sm font-semibold text-zinc-400">{t("مبلغ قابل پرداخت")}</span>
                  <span className="flex items-baseline gap-2 font-black" dir="ltr" data-direction-fixed="ltr">
                    <span className="text-2xl tabular-nums tracking-tight">{formattedPrice}</span>
                    <span className="text-sm text-zinc-400">{t("تومان")}</span>
                  </span>
                </div>

                <button
                  type="button"
                  role="radio"
                  aria-checked="true"
                  aria-label={t("زرین پال")}
                  className="group relative h-24 w-full overflow-visible rounded-[18px] border border-amber-300/35 bg-center bg-no-repeat text-start shadow-[0_18px_44px_rgba(0,0,0,.28)] transition duration-200 hover:-translate-y-0.5 hover:border-amber-200/70 hover:shadow-[0_22px_55px_rgba(253,189,0,.16)] active:translate-y-0 sm:h-28"
                  style={{
                    backgroundColor: "#e3e2e8",
                    backgroundImage: 'url("/zarinpal.svg")',
                    backgroundSize: "50% auto",
                  }}
                >
                  <Image
                    src="/zarinpal-symbol.png"
                    alt=""
                    width={64}
                    height={64}
                    aria-hidden="true"
                    draggable={false}
                    className="pointer-events-none absolute right-3 top-1/2 h-14 w-14 -translate-y-1/2 object-contain sm:right-4 sm:h-16 sm:w-16"
                  />
                  <span className="absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-full border-2 border-zinc-950 bg-white shadow">
                    <span className="h-3.5 w-3.5 rounded-full bg-zinc-950" />
                  </span>
                </button>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={closePaymentModal}
                    className="h-12 rounded-2xl border border-white/10 bg-white/[.06] text-sm font-bold text-zinc-200 transition hover:bg-white/[.1] active:scale-[.98]"
                  >
                    {t("لغو")}
                  </button>
                  <button
                    type="button"
                    onClick={startPayment}
                    className="h-12 rounded-2xl bg-emerald-400 text-sm font-black text-zinc-950 shadow-lg shadow-emerald-500/15 transition hover:-translate-y-0.5 hover:bg-emerald-300 active:translate-y-0 active:scale-[.98]"
                  >
                    {t("پرداخت")}
                  </button>
                </div>
              </>
            )}

            {paymentStage === "processing" && (
              <div className="flex min-h-[390px] flex-col items-center justify-center text-center">
                <div className="premium-payment-loader relative mb-8 grid h-32 w-32 place-items-center">
                  <div className="premium-payment-pulse absolute inset-1 rounded-full bg-emerald-500/20 blur-xl" />
                  <div className="premium-payment-spinner absolute inset-0 rounded-full" />
                  <svg className="absolute inset-2 h-28 w-28 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                    <circle cx="60" cy="60" r="51" fill="none" stroke="rgba(24,24,27,.08)" strokeWidth="5" />
                    <circle
                      cx="60" cy="60" r="51" fill="none" stroke="#059669" strokeLinecap="round" strokeWidth="5"
                      pathLength="100"
                      strokeDasharray="100"
                      strokeDashoffset={Math.max(0, paymentCountdown * 10)}
                      className="transition-[stroke-dashoffset] duration-300 ease-linear"
                    />
                  </svg>
                  <span className="relative z-10 text-3xl font-black tabular-nums" dir="ltr" data-direction-fixed="ltr">
                    {paymentCountdown}
                  </span>
                </div>
                <h2 id="premium-payment-title" className="text-2xl font-black">{t("در حال انجام پرداخت")}</h2>
                <p className="mt-3 max-w-xs text-sm leading-6 text-zinc-400">
                  {t("در حال تایید پرداخت و فعال‌سازی اشتراک هستیم؛ لطفاً این پنجره را نبندید")}
                </p>
                <div className="mt-7 flex h-5 items-center justify-center gap-2" aria-hidden="true">
                  {[0, 1, 2, 3].map((index) => (
                    <span
                      key={index}
                      className="premium-payment-dot h-2 w-2 rounded-full bg-emerald-600"
                      style={{ animationDelay: `${index * 110}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {paymentStage === "success" && (
              <div className="flex min-h-[390px] flex-col items-center justify-center text-center">
                <div className="premium-payment-success mb-7 grid h-28 w-28 place-items-center rounded-full bg-emerald-600 text-white shadow-[0_20px_60px_rgba(5,150,105,.35)]">
                  <Check className="h-14 w-14" strokeWidth={2.8} />
                </div>
                <h2 id="premium-payment-title" className="text-2xl font-black">{t("پرداخت با موفقیت انجام شد")}</h2>
                <p className="mt-3 max-w-xs text-sm leading-6 text-zinc-400">
                  {t("اشتراک پریمیوم شما برای یک ماه فعال شد")}
                </p>
              </div>
            )}

            {paymentStage === "error" && (
              <div className="flex min-h-[340px] flex-col justify-center">
                <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-2xl font-black text-red-600">!</div>
                <h2 id="premium-payment-title" className="text-2xl font-black">{t("پرداخت انجام نشد")}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{t(paymentError || "لطفاً دوباره تلاش کنید")}</p>
                <div className="mt-7 grid grid-cols-2 gap-3">
                  <button type="button" onClick={closePaymentModal} className="h-12 rounded-2xl border border-black/10 bg-white text-sm font-bold text-zinc-700">
                    {t("لغو")}
                  </button>
                  <button type="button" onClick={startPayment} className="h-12 rounded-2xl bg-zinc-950 text-sm font-black text-white">
                    {t("تلاش مجدد")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    )}

    <style jsx global>{`
      @keyframes premium-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
      @keyframes premium-card-in { from { opacity: 0; transform: translate3d(0, 24px, 0) scale(.975); } to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); } }
      @keyframes premium-spinner { to { transform: rotate(360deg); } }
      @keyframes premium-pulse { 0%, 100% { opacity: .45; transform: scale(.82); } 50% { opacity: .9; transform: scale(1.08); } }
      @keyframes premium-dot { 0%, 100% { opacity: .25; transform: translate3d(-7px, 0, 0) scale(.75); } 50% { opacity: 1; transform: translate3d(7px, 0, 0) scale(1); } }
      @keyframes premium-success { 0% { opacity: 0; transform: scale(.68) rotate(-8deg); } 65% { opacity: 1; transform: scale(1.08) rotate(2deg); } 100% { transform: scale(1) rotate(0); } }
      @keyframes premium-current-in { 0% { opacity: 0; transform: translate3d(0, 12px, 0) scale(.98); } 65% { opacity: 1; transform: translate3d(0, -2px, 0) scale(1.01); } 100% { transform: translate3d(0, 0, 0) scale(1); } }
      @keyframes premium-current-icon { 0% { transform: scale(.55) rotate(-16deg); opacity: 0; } 70% { transform: scale(1.08) rotate(3deg); opacity: 1; } 100% { transform: scale(1) rotate(0); } }
      @keyframes premium-current-glow { 0%, 100% { box-shadow: 0 20px 55px rgba(16,185,129,.08); } 50% { box-shadow: 0 24px 70px rgba(16,185,129,.2); } }
      .premium-payment-backdrop { animation: premium-backdrop-in 180ms ease-out both; }
      .premium-payment-card { animation: premium-card-in 360ms cubic-bezier(.2,.9,.2,1) both; will-change: transform, opacity; }
      .premium-payment-spinner { background: conic-gradient(from 10deg, transparent 0 20%, rgba(5,150,105,.14) 38%, #059669 72%, transparent 82%); animation: premium-spinner 1.1s linear infinite; will-change: transform; }
      .premium-payment-pulse { animation: premium-pulse 1.8s ease-in-out infinite; will-change: transform, opacity; }
      .premium-payment-dot { animation: premium-dot 1.05s ease-in-out infinite; will-change: transform, opacity; }
      .premium-payment-success { animation: premium-success 520ms cubic-bezier(.17,.89,.32,1.28) both; will-change: transform, opacity; }
      .premium-current-banner { animation: premium-current-in 520ms cubic-bezier(.2,.9,.2,1) both; will-change: transform, opacity; }
      .premium-current-icon { animation: premium-current-icon 620ms cubic-bezier(.17,.89,.32,1.28) 80ms both; will-change: transform, opacity; }
      .premium-current-card { animation: premium-current-glow 2.8s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .premium-payment-backdrop, .premium-payment-card, .premium-payment-spinner,
        .premium-payment-pulse, .premium-payment-dot, .premium-payment-success {
          animation-duration: 1ms !important; animation-iteration-count: 1 !important;
        }
      }
    `}</style>
    </>
  );
};

export default Premium;

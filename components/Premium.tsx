import React, { useRef, useEffect, useCallback, useState } from "react";
import Image from "next/image";
import { useNavigation } from "./NavigationContext";
import toast from "react-hot-toast";

const Premium: React.FC = () => {
  const { navigateTo } = useNavigation();
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastScrollY = useRef<number>(0);
  const ticking = useRef<boolean>(false);
  const [price, setPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState<boolean>(true);
  const [priceError, setPriceError] = useState<string | null>(null);

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
        const res = await fetch(
          "https://api.sedabox.com/api/plans/premium/price/",
          {
            signal: controller.signal,
          },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mounted && data && typeof data.price === "number") {
          setPrice(data.price);
        } else if (mounted) {
          setPriceError("Invalid response");
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        if (mounted) setPriceError(err.message || "Failed to fetch price");
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

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen bg-[#121212] text-white overflow-y-auto overflow-x-hidden scroll-smooth"
    >
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
        <div className="mb-10 text-right">
          <h2 className="text-3xl md:text-4xl font-black mb-3 text-white drop-shadow-lg">
            پرمیوم
          </h2>
          <p className="text-zinc-300 text-lg md:text-xl font-medium drop-shadow-md">
            بهترین تجربه موسیقی را با صداباکس داشته باشید
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Free Plan */}
          <div
            className="bg-zinc-900/90 rounded-3xl p-8 border border-white/5 flex flex-col shadow-xl"
            dir="rtl"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">پلن رایگان</h3>
              <p className="text-zinc-400 text-sm">مناسب برای شروع</p>
            </div>

            <div className="flex-1 space-y-5 mb-10">
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
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
              </div>

              <div className="flex items-center gap-3 text-zinc-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
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
              </div>

              <div className="flex items-center gap-3 text-zinc-300">
                <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
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
              </div>

              <div className="flex items-center gap-3 text-zinc-300">
                <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
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
              </div>

              <div className="flex items-center gap-3 text-zinc-300">
                <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
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
              </div>

              <div className="flex items-center gap-3 text-zinc-500">
                <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
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
              </div>
            </div>

            <button className="w-full py-4 rounded-full bg-zinc-800 text-zinc-400 font-bold cursor-default transition-all">
              پلن فعلی
            </button>
          </div>

          {/* Premium Plan */}
          <div
            className="relative bg-zinc-900/90  rounded-3xl p-8 border border-emerald-500/30 flex flex-col shadow-2xl scale-105 z-10 ring-1 ring-emerald-500/20"
            dir="rtl"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">
              پیشنهادی
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-0">
                  پلن پریمیوم
                </h3>
                <div className="inline-flex items-baseline gap-2 bg-gradient-to-r from-emerald-600 to-emerald-400 text-black font-extrabold px-3 py-1 rounded-full shadow-lg">
                  {priceLoading ? (
                    <span className="text-xl md:text-2xl">...</span>
                  ) : priceError ? (
                    <span className="text-sm text-red-400">{priceError}</span>
                  ) : (
                    <span className="text-xl md:text-2xl">
                      {price !== null
                        ? new Intl.NumberFormat("fa-IR", {
                            maximumFractionDigits: 0,
                          }).format(price)
                        : "—"}
                    </span>
                  )}
                  <span className="text-sm md:text-base font-semibold">
                    تومان
                  </span>
                </div>
              </div>
              <p className="text-zinc-400 text-sm mt-2">تجربه حرفه‌ای موسیقی</p>
            </div>

            <div className="flex-1 space-y-5 mb-10">
              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
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
                <span className="text-sm font-medium">
                  پخش آنلاین موسیقی بدون محدودیت
                </span>
              </div>

              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
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
                <span className="text-sm font-medium">بدون تبلیغ</span>
              </div>

              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
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
                <span className="text-sm font-medium">
                  کیفیت بالا (320kbps)
                </span>
              </div>

              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
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
                      d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 20 12 16.77 7.82 20 9 12.91 4 9.27l5.91-.01L12 2z"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium">
                  نشان تایید ⭐️ یا Badge کنار نام کاربر
                </span>
              </div>

              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
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
                <span className="text-sm font-medium">Skip نامحدود</span>
              </div>

              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
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
                <span className="text-sm font-medium">دانلود آثار موسیقی</span>
              </div>

              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
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
                <span className="text-sm font-medium">الگوریتم کامل</span>
              </div>

              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
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
                <span className="text-sm font-medium">پلی‌لیست نامحدود</span>
              </div>

              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
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
                <span className="text-sm font-medium">
                  دسترسی زودتر به ویژگی‌های جدید
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                // Show a hot toast informing that payment API is required (Farsi, no emoji)
                toast.error("Payment Api key is needed");
              }}
              className="w-full py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20"
            >
              ارتقا به این پلن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Premium;

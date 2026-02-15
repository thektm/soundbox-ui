import React, { useRef, useEffect, useCallback } from "react";
import { useNavigation } from "./NavigationContext";

const Premium: React.FC = () => {
  const { navigateTo } = useNavigation();
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastScrollY = useRef<number>(0);
  const ticking = useRef<boolean>(false);

  const applyTransforms = useCallback((scrollY: number) => {
    if (!headerRef.current) return;

    const progress = Math.min(scrollY / 400, 1);

    const scale = 1 - progress * 0.3;
    const opacity = 1 - progress;
    const blurValue = progress * 10;

    headerRef.current.style.transform = `translate3d(0,0,0) scale3d(${scale},${scale},1)`;
    headerRef.current.style.opacity = `${opacity}`;
    headerRef.current.style.filter =
      blurValue > 0.5 ? `blur(${blurValue}px)` : "none";
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
      className="flex flex-col h-screen bg-[#121212] text-white overflow-y-auto overflow-x-hidden scroll-smooth no-scrollbar"
    >
      {/* Premium Header Image - GPU-accelerated */}
      <div
        ref={headerRef}
        className="sticky top-0 w-full h-[35vh] flex-shrink-0 z-0 origin-center overflow-hidden rounded-b-[3rem]"
        style={{
          willChange: "transform, opacity",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          perspective: 1000,
          WebkitPerspective: 1000,
          contain: "layout style paint",
        }}
      >
        <img
          src="/premium-bg.jpg"
          alt="Premium background"
          className="w-full h-full rounded-b-[3rem] object-cover"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
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
            className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-8 border border-white/5 flex flex-col shadow-xl"
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
                    fill="none"
                    viewBox="0 0 24 24"
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
                <span className="text-sm">همراه با آگهی‌های صوتی</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
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
                <span className="text-sm">کیفیت پخش 128kbps</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-500">
                <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-zinc-600"
                    fill="none"
                    viewBox="0 0 24 24"
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
                  دانلود و پخش آفلاین
                </span>
              </div>
              <div className="flex items-center gap-3 text-zinc-500">
                <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-zinc-600"
                    fill="none"
                    viewBox="0 0 24 24"
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
                  دسترسی به ویژگی‌های جدید
                </span>
              </div>
            </div>

            <button className="w-full py-4 rounded-full bg-zinc-800 text-zinc-400 font-bold cursor-default transition-all">
              پلن فعلی
            </button>
          </div>

          {/* Premium Plan */}
          <div
            className="relative bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-8 border border-emerald-500/30 flex flex-col shadow-2xl scale-105 z-10 ring-1 ring-emerald-500/20"
            dir="rtl"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">
              پیشنهادی
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                پلن پریمیوم
              </h3>
              <p className="text-zinc-400 text-sm">تجربه حرفه‌ای موسیقی</p>
            </div>

            <div className="flex-1 space-y-5 mb-10">
              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
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
                  پخش بدون آگهی‌های صوتی
                </span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
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
                  کیفیت پخش عالی 320kbps
                </span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
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
                <span className="text-sm font-medium">دانلود و پخش آفلاین</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-black"
                    fill="none"
                    viewBox="0 0 24 24"
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
                  دسترسی به ویژگی‌های جدید
                </span>
              </div>
            </div>

            <button
              onClick={() => navigateTo("upgrade-plans")}
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

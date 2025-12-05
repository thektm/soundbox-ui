import { useRouter } from "next/router";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";

// SVG Icons for UI polish
const MusicIcon = () => (
  <svg
    className="w-6 h-6 text-emerald-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
    />
  </svg>
);

const ArrowIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14 5l7 7m0 0l-7 7m7-7H3"
    />
  </svg>
);

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Refactored State: We keep the raw digits clean, simpler than the previous masking logic
  const [phoneDigits, setPhoneDigits] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added for UX feedback

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-digits
    const raw = e.target.value.replace(/\D/g, "");

    // Logic: If user pastes "0912...", strip the "09". If they type "9...", keep it.
    let clean = raw;
    if (raw.startsWith("09")) clean = raw.slice(2);
    else if (raw.startsWith("0") || raw.startsWith("9")) {
      // Edge case handling for user typing leading 0 or 9 mistakenly
      if (raw.startsWith("0")) clean = raw.slice(1);
    }

    // Limit to 9 digits
    setPhoneDigits(clean.slice(0, 9));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneDigits || phoneDigits.length < 9) return;

    setIsLoading(true);

    // Simulate a micro-delay for better UX feel (optional)
    await new Promise((resolve) => setTimeout(resolve, 600));

    const full = `09${phoneDigits}`;
    login(full);
    router.push("/verify");
  };

  return (
    <div className="relative w-full min-h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans flex flex-col lg:flex-row">
      {/* --- Ambient Background Effects --- */}
      {/* Noise Texture Overlay */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-50 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Glowing Orb Effect behind form */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* --- LEFT SECTION: Form --- */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center relative z-10 p-6 lg:p-12 order-2 lg:order-1">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-12 text-center lg:text-right" dir="rtl">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4 group cursor-default">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-emerald-500/50 transition-colors duration-300 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <MusicIcon />
              </div>
              <h1 className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
                SoundBox
              </h1>
            </div>
            <h2 className="text-4xl font-medium text-white mb-3 leading-tight">
              خوش آمدید
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              برای دسترسی به دنیای موسیقی، شماره همراه خود را وارد کنید.
              <br />
              <span className="text-xs text-gray-600">
                فقط یک بار ورود کافیست.
              </span>
            </p>
          </div>

          {/* Glass Form Card */}
          <form
            onSubmit={onSubmit}
            className="relative group rounded-2xl bg-white/[0.02] border border-white/10 p-1 backdrop-blur-md transition-all duration-500 hover:bg-white/[0.04] hover:border-white/20 hover:shadow-[0_20px_80px_-20px_rgba(0,0,0,0.5)]"
            dir="rtl"
          >
            <div className="p-6 lg:p-8">
              <label className="block relative mb-8">
                <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3 block px-1">
                  شماره موبایل
                </span>

                <div
                  className={`
                    flex items-center relative rounded-xl overflow-hidden border bg-black/20 transition-all duration-300
                    ${
                      isFocused
                        ? "border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                        : "border-white/10 hover:border-white/20"
                    }
                  `}
                  dir="ltr"
                >
                  {/* Fixed Prefix - Visual Anchor */}
                  <div className="flex items-center justify-center h-14 w-14 bg-white/5 border-r border-white/10 text-gray-400 font-mono text-lg select-none">
                    09
                  </div>

                  {/* Input Field */}
                  <input
                    value={phoneDigits}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full h-14 bg-transparent text-white text-xl font-mono tracking-[0.3em] px-4 focus:outline-none placeholder-white/10"
                    placeholder="_ _ _ _ _ _ _ _ _"
                    type="tel"
                    inputMode="numeric"
                    required
                  />

                  {/* Valid Indicator */}
                  <div
                    className={`absolute right-4 transition-all duration-500 ${
                      phoneDigits.length === 9
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-75"
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                  </div>
                </div>
              </label>

              <button
                type="submit"
                disabled={phoneDigits.length < 9 || isLoading}
                className={`
                  w-full h-14 rounded-xl font-medium text-lg relative overflow-hidden transition-all duration-300 group/btn
                  ${
                    phoneDigits.length < 9
                      ? "bg-white/5 text-gray-500 cursor-not-allowed"
                      : "bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                  }
                `}
              >
                <span
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                    isLoading ? "opacity-0" : "opacity-100"
                  }`}
                >
                  دریافت کد ورود
                  <span className="mr-2 rotate-180 transform group-hover/btn:-translate-x-1 transition-transform">
                    <ArrowIcon />
                  </span>
                </span>

                {/* Loading Spinner */}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                    isLoading ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                </div>
              </button>
            </div>
          </form>

          <div className="mt-8 text-center lg:text-right">
            <p className="text-xs text-gray-600">
              با ورود به سیستم،{" "}
              <a
                href="#"
                className="underline hover:text-emerald-400 transition-colors"
              >
                قوانین و مقررات
              </a>{" "}
              ساندباکس را می‌پذیرید.
            </p>
          </div>
        </div>
      </div>

      {/* --- RIGHT SECTION: Image Visual --- */}
      <div className="w-full lg:w-[55%] h-[40vh] lg:h-auto relative order-1 lg:order-2">
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/music-listen.webp"
            alt="Music Background"
            className="w-full h-full object-cover"
          />
          {/* Professional Blending Gradients */}
          {/* Main dark wash */}
          <div className="absolute inset-0 bg-black/30 mix-blend-multiply" />

          {/* Gradient from left (desktop) or bottom (mobile) to blend into the form area */}
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />

          {/* Color tint */}
          <div className="absolute inset-0 bg-emerald-900/20 mix-blend-overlay" />
        </div>

        {/* Floating Text on Image (Hidden on small mobile to save space) */}
        <div
          className="absolute bottom-10 right-10 hidden lg:block text-right"
          dir="rtl"
        >
          <div className="text-6xl font-bold text-white/10 tracking-tighter select-none">
            MUSIC
          </div>
          <div className="text-6xl font-bold text-white/10 tracking-tighter select-none mt-[-20px]">
            IS LIFE
          </div>
        </div>
      </div>
    </div>
  );
}

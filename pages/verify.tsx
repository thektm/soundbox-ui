import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

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

export default function VerifyPage() {
  const { pendingEmail, verifyOtp, resendOtp, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  // 4 digit inputs state
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Timer state for resend button
  const [timer, setTimer] = useState<number>(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      const otp = localStorage.getItem("otpForSoundBox");
      if (otp) setDevOtp(otp);
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!pendingEmail) return;
    // focus first input on mount
    inputsRef.current[0]?.focus();
    // Start timer on mount or when pendingEmail changes
    setTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pendingEmail]);

  const focusAt = (index: number) => {
    const safe = Math.max(0, Math.min(3, index));
    inputsRef.current[safe]?.focus();
    inputsRef.current[safe]?.select();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const raw = e.target.value.replace(/\D/g, "");
    const char = raw.slice(-1) || "";
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    if (char && idx < 3) {
      focusAt(idx + 1);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Backspace") {
      if (digits[idx] === "") {
        if (idx > 0) focusAt(idx - 1);
      } else {
        const next = [...digits];
        next[idx] = "";
        setDigits(next);
      }
    } else if (e.key === "ArrowLeft") {
      if (idx > 0) focusAt(idx - 1);
    } else if (e.key === "ArrowRight") {
      if (idx < 3) focusAt(idx + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4)
      .split("");
    if (pasted.length === 0) return;
    const next = ["", "", "", ""];
    for (let i = 0; i < 4; i++) next[i] = pasted[i] || "";
    setDigits(next);
    const firstEmpty = next.findIndex((d) => d === "");
    if (firstEmpty === -1) inputsRef.current[3]?.blur();
    else focusAt(firstEmpty);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = digits.join("");
    if (code.length < 4) return setError("کد ۴ رقمی را وارد کنید.");
    setIsLoading(true);
    const verifyPromise = verifyOtp(code);
    const timerPromise = new Promise((res) => setTimeout(res, 500));
    const [ok] = await Promise.all([verifyPromise, timerPromise]);
    setIsLoading(false);
    if (ok) router.replace("/");
    else setError("کد نامعتبر است. دوباره تلاش کنید.");
  };

  const onResend = () => {
    resendOtp();
    setTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    try {
      const otp = localStorage.getItem("otpForSoundBox");
      if (otp) setDevOtp(otp);
    } catch (e) {}
  };

  if (!pendingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-6 bg-white rounded shadow">
          <p>No pending login found. لطفاً ابتدا وارد شوید.</p>
          <div className="mt-4">
            <button
              onClick={() => router.push("/login")}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              رفتن به صفحه ورود
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans flex flex-col lg:flex-row">
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-50 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center relative z-10 p-4 lg:p-12 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="mb-2 text-center lg:text-right" dir="rtl">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2 group cursor-default">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-emerald-500/50 transition-colors duration-300 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <MusicIcon />
              </div>
              <h1 className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
                SoundBox
              </h1>
            </div>
            <h2 className="text-3xl font-medium text-white mb-3 leading-tight">
              ورود با کد
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              یک کد ۴ رقمی به شماره{" "}
              <strong className="text-white">{pendingEmail}</strong> ارسال شد.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="relative group rounded-2xl bg-white/[0.02] border border-white/10 p-1 backdrop-blur-md transition-all duration-500 hover:bg-white/[0.04] hover:border-white/20 hover:shadow-[0_20px_80px_-20px_rgba(0,0,0,0.5)]"
            dir="rtl"
          >
            <div className="p-6 lg:p-8">
              <div className="mb-6 text-sm text-gray-400">
                لطفاً کد ارسال شده را وارد کنید
              </div>

              <div
                className="flex items-center justify-center gap-3 mb-6"
                dir="ltr"
              >
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputsRef.current[i] = el;
                    }}
                    value={d}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    onPaste={handlePaste}
                    className="w-14 h-14 text-center text-xl font-mono bg-transparent border rounded-xl border-white/10 focus:border-emerald-500/60 focus:shadow-[0_0_20px_rgba(16,185,129,0.12)]"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    required
                  />
                ))}
              </div>

              {error && (
                <div className="text-sm text-red-500 mb-4">{error}</div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="submit"
                  disabled={digits.join("").length < 4 || isLoading}
                  className={`w-full h-14 rounded-xl font-medium text-lg relative overflow-hidden transition-all duration-300 ${
                    digits.join("").length < 4
                      ? "bg-white/5 text-gray-500 cursor-not-allowed"
                      : "bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                  }`}
                >
                  <span
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                      isLoading ? "opacity-0" : "opacity-100"
                    }`}
                  >
                    تایید و ورود
                  </span>
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                      isLoading ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  </div>
                </button>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={onResend}
                    disabled={timer > 0}
                    className={`px-3 py-3 rounded-xl bg-white/5 hover:bg-white/6 transition-all duration-300 ${
                      timer > 0 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    ارسال مجدد کد
                    {timer > 0 && (
                      <span className="ml-2 text-xs text-gray-400">
                        ({timer})
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="px-3 py-3 rounded-xl bg-white/5 hover:bg-white/6"
                  >
                    بازگشت
                  </button>
                </div>
              </div>

              {devOtp && (
                <div className="mt-4 text-sm text-gray-600">
                  Dev OTP: <strong>{devOtp}</strong>
                </div>
              )}
            </div>
          </form>

          <div dir="rtl" className="mt-8 text-center lg:text-right">
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

      <div className="w-full lg:w-[55%] h-[40vh] lg:h-auto relative order-1 lg:order-2">
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/music-listen2.webp"
            alt="Music Background"
            className="w-full h-full object-cover"
          />
          {/* reduced darkness: lighter black wash and softer tints */}
          <div className="absolute inset-0 bg-black/12 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
          <div className="hidden lg:block absolute inset-y-0 left-0 w-56 pointer-events-none bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
          <div className="lg:hidden absolute left-0 right-0 bottom-0 h-36 pointer-events-none bg-gradient-to-t from-[#0a0a0a] to-transparent" />
          <div className="absolute inset-0 bg-emerald-900/8 mix-blend-overlay" />
        </div>

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

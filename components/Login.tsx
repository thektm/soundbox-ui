import React, { useState } from "react";
import Image from "next/image";
import { useNavigation } from "./NavigationContext";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

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

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    {open ? (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    )}
  </svg>
);

const Login: React.FC = () => {
  const { setCurrentPage } = useNavigation();
  const {
    login,
    requestLoginOtp,
    setPhone,
    phone,
    setPassword,
    password,
    setVerificationContext,
    formatErrorMessage,
  } = useAuth();
  const [loginMethod, setLoginMethod] = useState<"otp" | "password">("otp");
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOtpLogin = () => {
    if (!phone) return;
    setError(null);
    setLoading(true);
    const promise = requestLoginOtp(phone);

    toast.promise(promise, {
      loading: "در حال ارسال کد تایید...",
      success: () => {
        setVerificationContext("login");
        setCurrentPage("verify");
        return "کد تایید با موفقیت ارسال شد";
      },
      error: (e) => {
        const msg = formatErrorMessage(e);
        setError(msg);
        return msg;
      },
    });

    promise.finally(() => setLoading(false));
  };

  const handlePasswordLogin = () => {
    if (!phone || !password) return;
    setError(null);
    setLoading(true);
    const promise = login(phone, password);

    toast.promise(promise, {
      loading: "در حال ورود به حساب کاربری...",
      success: () => {
        setCurrentPage("home");
        return "خوش آمدید!";
      },
      error: (e) => {
        const msg = formatErrorMessage(e);
        setError(msg);
        return msg;
      },
    });

    promise.finally(() => setLoading(false));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    let clean = raw;
    if (raw.startsWith("09")) clean = raw.slice(2);
    else if (raw.startsWith("0") || raw.startsWith("9")) {
      if (raw.startsWith("0")) clean = raw.slice(1);
    }
    setPhone(clean.slice(0, 9));
  };

  return (
    <div
      dir="ltr"
      className="relative w-full min-h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans flex flex-col lg:flex-row"
    >
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-50 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Overlapping logo */}
      <div
        className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-[40vh] md:top-[30vh] lg:left-[90%] lg:top-[40vh]"
        aria-hidden="true"
      >
        <div className="relative">
          <div className="w-35 h-35 lg:w-44 lg:h-44 rounded-full md:rounded-none lg:rounded-none flex items-center justify-center overflow-hidden md:overflow-visible lg:overflow-visible relative">
            <Image
              src="/logo-text.png"
              alt="SedaBox Logo"
              fill
              className="object-contain transform transition-transform duration-300"
            />
          </div>
          <div className="absolute inset-0 rounded-full md:rounded-none lg:rounded-none" />
        </div>
      </div>

      <div className="w-full mt-8 lg:w-[45%] flex flex-col justify-center items-center relative z-10 p-6 lg:p-12 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="mb-12 text-center lg:text-right" dir="rtl">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-4 group cursor-default"></div>
            <h2 className="text-4xl font-medium text-white mb-3 leading-tight">
              خوش آمدید{" "}
              <span className="text-sm text-emerald-400 mr-3">صداباکس</span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              برای دسترسی به صداباکس، شماره همراه خود را وارد کنید.
              <br />
              <span className="text-xs text-gray-600">
                فقط یک بار ورود کافیست.
              </span>
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (loginMethod === "otp") handleOtpLogin();
              else handlePasswordLogin();
            }}
            className="relative group rounded-2xl bg-white/2 border border-white/10 p-1 backdrop-blur-md transition-all duration-500 hover:bg-white/4 hover:border-white/20 hover:shadow-[0_20px_80px_-20px_rgba(0,0,0,0.5)]"
            dir="rtl"
          >
            <div className="p-6 lg:p-8">
              {/* Login Mode Toggle */}
              <div className="flex gap-2 mb-6 p-1 bg-black/30 rounded-lg">
                <button
                  type="button"
                  onClick={() => setLoginMethod("password")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                    loginMethod === "password"
                      ? "bg-white text-black shadow-lg"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  ورود با رمز عبور
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod("otp")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                    loginMethod === "otp"
                      ? "bg-white text-black shadow-lg"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  ورود با کد یکبار مصرف
                </button>
              </div>

              <label className="block relative mb-6">
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
                  <div className="flex items-center justify-center h-14 w-14 bg-white/5 border-r border-white/10 text-gray-400 font-mono text-lg select-none">
                    09
                  </div>

                  <input
                    value={phone}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full h-14 bg-transparent text-white text-xl font-mono tracking-[0.3em] px-4 focus:outline-none placeholder-white/10"
                    placeholder="_ _ _ _ _ _ _ _ _"
                    type="tel"
                    inputMode="numeric"
                    required
                  />

                  <div
                    className={`absolute right-4 transition-all duration-500 ${
                      phone.length === 9
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-75"
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                  </div>
                </div>
              </label>

              {loginMethod === "password" && (
                <label className="block relative mb-6">
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3 block px-1">
                    رمز عبور
                  </span>
                  <div className="relative flex items-center rounded-xl overflow-hidden border bg-black/20 border-white/10 hover:border-white/20 transition-all duration-300">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 bg-transparent text-white text-lg px-4 focus:outline-none placeholder-white/10"
                      placeholder="رمز عبور خود را وارد کنید"
                      required={loginMethod === "password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="h-14 px-4 text-gray-400 hover:text-white transition-colors"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </label>
              )}

              <button
                type="submit"
                disabled={phone.length < 9 || loading}
                className={`
                  w-full h-14 rounded-xl font-medium text-lg relative overflow-hidden transition-all duration-300 group/btn
                  ${
                    phone.length < 9 || loading
                      ? "bg-white/5 text-gray-500 cursor-not-allowed"
                      : "bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                  }
                `}
              >
                <span className="absolute inset-0 flex items-center justify-center">
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      {loginMethod === "otp" ? "دریافت کد ورود" : "ورود"}
                      <span className="mr-2 rotate-180 transform group-hover/btn:-translate-x-1 transition-transform">
                        <ArrowIcon />
                      </span>
                    </>
                  )}
                </span>
              </button>

              {error && (
                <div className="mt-3 text-center text-red-400 text-sm">
                  {error}
                </div>
              )}

              {loginMethod === "password" && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setCurrentPage("forgot-password")}
                    className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
                  >
                    رمز عبور خود را فراموش کرده‌اید؟
                  </button>
                </div>
              )}

              <div className="text-center pt-6 mt-6 border-t border-white/5">
                <p className="text-gray-400 text-sm">
                  حساب کاربری ندارید؟{" "}
                  <button
                    type="button"
                    onClick={() => setCurrentPage("register")}
                    className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                  >
                    ثبت نام
                  </button>
                </p>
              </div>
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

      <div className="w-full lg:w-[55%] h-[40vh] lg:h-auto relative order-1 lg:order-2">
        <div className="absolute inset-0 w-full h-full relative">
          <Image
            src="/music-listen.webp"
            alt="Music Background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30 mix-blend-multiply" />
          <div className="absolute inset-0 bg-linear-to-t lg:bg-linear-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
          <div className="absolute inset-0 bg-emerald-900/20 mix-blend-overlay" />
        </div>

        <div
          className="absolute bottom-10 right-10 hidden lg:block text-right"
          dir="rtl"
        >
          <div className="text-6xl font-bold text-white/10 tracking-tighter select-none">
            MUSIC
          </div>
          <div className="text-6xl font-bold text-white/10 tracking-tighter select-none -mt-5">
            IS LIFE
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

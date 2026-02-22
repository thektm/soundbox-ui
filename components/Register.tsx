import React, { useState } from "react";
import { useNavigation } from "./NavigationContext";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const Register: React.FC = () => {
  const { setCurrentPage } = useNavigation();
  const {
    register,
    setPhone,
    phone,
    setPassword,
    password,
    setVerificationContext,
    formatErrorMessage,
  } = useAuth();
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    let clean = raw;
    if (raw.startsWith("09")) clean = raw.slice(2);
    else if (raw.startsWith("0") || raw.startsWith("9")) {
      if (raw.startsWith("0")) clean = raw.slice(1);
    }
    setPhone(clean.slice(0, 9));
  };

  // Translate server / raw error messages to Persian-friendly text
  const translateError = (raw: string | null | undefined) => {
    const msg = String(raw || "").trim();
    if (!msg) return "خطایی رخ داد. لطفاً دوباره تلاش کنید.";
    const lower = msg.toLowerCase();

    // common phone already registered patterns
    if (
      lower.includes("phone") &&
      (lower.includes("registered") ||
        lower.includes("already") ||
        lower.includes("exists"))
    ) {
      return "این شماره قبلاً ثبت شده است. اگر شماره‌ی شماست، لطفاً وارد شوید یا بازیابی رمز عبور را انجام دهید.";
    }

    // invalid phone
    if (lower.includes("invalid") && lower.includes("phone")) {
      return "شماره همراه نامعتبر است.";
    }

    // password related
    if (
      lower.includes("password") &&
      (lower.includes("short") ||
        lower.includes("weak") ||
        lower.includes("too short"))
    ) {
      return "رمز عبور کوتاه یا ناامن است. یک رمز قوی‌تر انتخاب کنید.";
    }

    // network issues
    if (
      lower.includes("network") ||
      lower.includes("failed to fetch") ||
      lower.includes("timeout")
    ) {
      return "خطا در اتصال شبکه. اتصال اینترنت خود را بررسی کنید.";
    }

    // if the message already contains Persian, return it as-is
    if (/[آ-ی]/.test(msg)) return msg;

    // fallback generic Persian message
    console.debug("Server error (raw):", msg);
    return "خطایی رخ داد. لطفاً دوباره تلاش کنید.";
  };

  const handleRegister = () => {
    if (!phone || !password) return;
    setError(null);
    setLoading(true);
    const promise = register(phone, password);

    toast.promise(promise, {
      loading: "در حال ایجاد حساب کاربری...",
      success: () => {
        setVerificationContext("register");
        setCurrentPage("verify");
        return "کد تایید برای شما ارسال شد";
      },
      error: (e) => {
        const raw = formatErrorMessage(e);
        const tr = translateError(raw);
        setError(tr);
        return tr;
      },
    });

    promise.finally(() => setLoading(false));
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
          <div className="w-35 h-35 lg:w-44 lg:h-44 rounded-full md:rounded-none lg:rounded-none flex items-center justify-center overflow-hidden md:overflow-visible lg:overflow-visible">
            <img
              src="/logo-text.png"
              alt="SedaBox Logo"
              className="w-28 lg:w-44 object-contain transform transition-transform duration-300"
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
              ثبت نام{" "}
              <span className="text-sm text-emerald-400 mr-3">صداباکس</span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              برای دسترسی به صداباکس، شماره همراه و رمز عبور خود را وارد کنید.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRegister();
            }}
            className="relative group rounded-2xl bg-white/2 border border-white/10 p-1 backdrop-blur-md transition-all duration-500 hover:bg-white/4 hover:border-white/20 hover:shadow-[0_20px_80px_-20px_rgba(0,0,0,0.5)]"
            dir="rtl"
          >
            <div className="p-6 lg:p-8">
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

              <label className="block relative mb-6">
                <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3 block px-1">
                  رمز عبور
                </span>
                <div className="relative flex items-center rounded-xl overflow-hidden border bg-black/20 border-white/10 hover:border-white/20 transition-all duration-300">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value.replace(/\s/g, ""))
                    }
                    onPaste={(e) => {
                      e.preventDefault();
                      const paste = (
                        e.clipboardData?.getData("text") || ""
                      ).replace(/\s/g, "");
                      setPassword((prev) => (prev || "") + paste);
                    }}
                    className="w-full h-14 bg-transparent text-white text-lg px-4 focus:outline-none placeholder-white/10"
                    placeholder="رمز عبور خود را وارد کنید"
                    required
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={phone.length < 9 || !password || loading}
                className={`
                  w-full h-14 rounded-xl font-medium text-lg relative overflow-hidden transition-all duration-300 group/btn
                  ${
                    phone.length < 9 || !password || loading
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
                      ثبت نام
                      <span className="mr-2 rotate-180 transform group-hover/btn:-translate-x-1 transition-transform">
                        →
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

              <div className="text-center pt-6 mt-6 border-t border-white/5">
                <p className="text-gray-400 text-sm">
                  حساب کاربری دارید؟{" "}
                  <button
                    type="button"
                    onClick={() => setCurrentPage("login")}
                    className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                  >
                    ورود
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
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/music-listen.webp"
            alt="Music Background"
            className="w-full h-full object-cover"
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

export default Register;

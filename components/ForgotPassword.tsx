import React, { useState, useRef } from "react";
import { useNavigation } from "./NavigationContext";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ForgotPassword: React.FC = () => {
  const { setCurrentPage } = useNavigation();
  const {
    setPhone,
    phone,
    setOtp,
    otp,
    resetPassword,
    setPassword,
    password,
    requestPasswordReset,
    formatErrorMessage,
  } = useAuth();
  const [step, setStep] = useState<"phone" | "verify" | "reset">("phone");
  const [newPassword, setNewPassword] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    let clean = raw;
    if (raw.startsWith("09")) clean = raw.slice(2);
    else if (raw.startsWith("0") || raw.startsWith("9")) {
      if (raw.startsWith("0")) clean = raw.slice(1);
    }
    setPhone(clean.slice(0, 9));
  };

  const handleSendOtp = () => {
    if (!phone) return;
    setError(null);
    setLoading(true);
    const promise = requestPasswordReset(phone);

    toast.promise(promise, {
      loading: "در حال ارسال کد بازیابی...",
      success: () => {
        setStep("verify");
        return "کد بازیابی برای شما ارسال شد";
      },
      error: (e) => {
        const msg = formatErrorMessage(e?.error);
        setError(msg);
        return msg;
      },
    });

    promise.finally(() => setLoading(false));
  };

  const handleVerify = () => {
    const code = digits.join("");
    if (code.length === 4) {
      setOtp(code);
      setStep("reset");
      toast.success("کد تایید شد. رمز عبور جدید خود را وارد کنید");
    }
  };

  const handleReset = () => {
    if (!newPassword) return;
    if (newPassword !== password) {
      toast.error("رمز عبور و تکرار آن مطابقت ندارند");
      return;
    }
    setError(null);
    setLoading(true);
    const promise = resetPassword(newPassword);

    toast.promise(promise, {
      loading: "در حال تغییر رمز عبور...",
      success: () => {
        setCurrentPage("login");
        return "رمز عبور با موفقیت تغییر کرد. اکنون می‌توانید وارد شوید";
      },
      error: (e) => {
        const msg = formatErrorMessage(e?.error);
        setError(msg);
        return msg;
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

      <div className="w-full mt-8 lg:w-[45%] flex flex-col justify-center items-center relative z-10 p-4 lg:p-12 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <div className="mb-2 text-center lg:text-right" dir="rtl">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2 group cursor-default"></div>
            <h2 className="text-3xl font-medium text-white mb-3 leading-tight">
              بازیابی رمز عبور
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              شماره همراه خود را وارد کنید تا کد بازیابی ارسال شود.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step === "phone") handleSendOtp();
              else if (step === "verify") handleVerify();
              else handleReset();
            }}
            className="relative group rounded-2xl bg-white/2 border border-white/10 p-1 backdrop-blur-md transition-all duration-500 hover:bg-white/4 hover:border-white/20 hover:shadow-[0_20px_80px_-20px_rgba(0,0,0,0.5)]"
            dir="rtl"
          >
            <div className="p-6 lg:p-8">
              {step === "phone" && (
                <>
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
                          ارسال کد بازیابی
                          <span className="mr-2 rotate-180 transform group-hover/btn:-translate-x-1 transition-transform">
                            →
                          </span>
                        </>
                      )}
                    </span>
                  </button>
                </>
              )}

              {step === "verify" && (
                <>
                  <div className="mb-6 text-sm text-gray-400">
                    لطفاً کد ارسال شده به شماره {phone ? `09${phone}` : "شماره"}{" "}
                    را وارد کنید
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

                  <button
                    type="submit"
                    disabled={digits.join("").length < 4 || loading}
                    className={`
                      w-full h-14 rounded-xl font-medium text-lg relative overflow-hidden transition-all duration-300
                      ${
                        digits.join("").length < 4 || loading
                          ? "bg-white/5 text-gray-500 cursor-not-allowed"
                          : "bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                      }
                    `}
                  >
                    <span className="absolute inset-0 flex items-center justify-center">
                      {loading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        "تایید کد"
                      )}
                    </span>
                  </button>
                </>
              )}

              {step === "reset" && (
                <>
                  <label className="block relative mb-6">
                    <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3 block px-1">
                      رمز عبور جدید
                    </span>
                    <div className="relative flex items-center rounded-xl overflow-hidden border bg-black/20 border-white/10 hover:border-white/20 transition-all duration-300">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-14 bg-transparent text-white text-lg px-4 focus:outline-none placeholder-white/10"
                        placeholder="رمز عبور جدید"
                        required
                      />
                    </div>
                  </label>

                  <label className="block relative mb-6">
                    <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3 block px-1">
                      تایید رمز عبور
                    </span>
                    <div className="relative flex items-center rounded-xl overflow-hidden border bg-black/20 border-white/10 hover:border-white/20 transition-all duration-300">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-14 bg-transparent text-white text-lg px-4 focus:outline-none placeholder-white/10"
                        placeholder="تکرار رمز عبور"
                        required
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={!newPassword || !password || loading}
                    className={`
                      w-full h-14 rounded-xl font-medium text-lg relative overflow-hidden transition-all duration-300 group/btn
                      ${
                        !newPassword || !password || loading
                          ? "bg-white/5 text-gray-500 cursor-not-allowed"
                          : "bg-white text-black hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                      }
                    `}
                  >
                    <span className="absolute inset-0 flex items-center justify-center">
                      {loading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        "تغییر رمز عبور"
                      )}
                    </span>
                  </button>
                </>
              )}

              <div className="text-center pt-6 mt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setCurrentPage("login")}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                >
                  بازگشت به ورود
                </button>
              </div>
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

export default ForgotPassword;

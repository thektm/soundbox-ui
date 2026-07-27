"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";

type AuthReason = {
  title?: string;
  description?: string;
};

interface GuestAccessContextType {
  requestAuth: (reason?: string | AuthReason) => void;
  requireAuth: (reason?: string | AuthReason) => boolean;
  closeAuthPrompt: () => void;
}

const GuestAccessContext = createContext<GuestAccessContextType | null>(null);

const DEFAULT_REASON: Required<AuthReason> = {
  title: "برای ادامه وارد شوید",
  description:
    "برای ذخیره موسیقی، ساخت پلی‌لیست، دنبال‌کردن هنرمندان و پخش کامل به حساب خود وارد شوید.",
};

function normalizeReason(reason?: string | AuthReason): Required<AuthReason> {
  if (typeof reason === "string") {
    return { title: "ورود به صداباکس", description: reason };
  }
  return {
    title: reason?.title || DEFAULT_REASON.title,
    description: reason?.description || DEFAULT_REASON.description,
  };
}

export const GuestAccessProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isLoggedIn } = useAuth();
  const { currentPage, currentParams, navigateTo } = useNavigation();
  const [reason, setReason] = useState<Required<AuthReason> | null>(null);

  const requestAuth = useCallback((value?: string | AuthReason) => {
    setReason(normalizeReason(value));
  }, []);

  const requireAuth = useCallback(
    (value?: string | AuthReason) => {
      if (isLoggedIn) return true;
      requestAuth(value);
      return false;
    },
    [isLoggedIn, requestAuth],
  );

  const closeAuthPrompt = useCallback(() => setReason(null), []);

  const continueTo = useCallback(
    (page: "login" | "register") => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "sedabox:returnTo",
          JSON.stringify({ page: currentPage, params: currentParams || null }),
        );
      }
      setReason(null);
      navigateTo(page);
    },
    [currentPage, currentParams, navigateTo],
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent)?.detail;
      requestAuth(detail || undefined);
    };
    window.addEventListener("sedabox:auth-required", handler as EventListener);
    return () =>
      window.removeEventListener(
        "sedabox:auth-required",
        handler as EventListener,
      );
  }, [requestAuth]);

  useEffect(() => {
    if (!reason) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setReason(null);
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [reason]);

  useEffect(() => {
    if (!isLoggedIn || typeof window === "undefined") return;
    const raw = sessionStorage.getItem("sedabox:returnTo");
    if (raw) {
      sessionStorage.removeItem("sedabox:returnTo");
      try {
        const target = JSON.parse(raw);
        if (target?.page && !["login", "register", "verify"].includes(target.page)) {
          navigateTo(target.page, target.params || null, "replace");
          return;
        }
      } catch {
        // Ignore malformed session state.
      }
    }
    if (["login", "register", "verify", "forgot-password"].includes(currentPage)) {
      navigateTo("home", null, "replace");
    }
  }, [isLoggedIn, currentPage, navigateTo]);

  const value = useMemo(
    () => ({ requestAuth, requireAuth, closeAuthPrompt }),
    [requestAuth, requireAuth, closeAuthPrompt],
  );

  return (
    <GuestAccessContext.Provider value={value}>
      {children}
      {reason && !isLoggedIn && (
        <div
          className="fixed inset-0 z-[120000] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-auth-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setReason(null);
          }}
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-black/70 sm:p-7">
            <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-emerald-500/20 blur-3xl" />
            <button
              type="button"
              onClick={closeAuthPrompt}
              className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              aria-label="بستن"
            >
              ×
            </button>

            <div className="relative">
              <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-400 text-2xl font-black text-black shadow-lg shadow-emerald-500/20">
                S
              </div>
              <h2 id="guest-auth-title" className="text-2xl font-black text-white">
                {reason.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                {reason.description}
              </p>

              <div className="mt-7 grid gap-3">
                <button
                  type="button"
                  onClick={() => continueTo("login")}
                  className="h-12 rounded-full bg-emerald-400 px-6 font-black text-black transition hover:bg-emerald-300 active:scale-[0.99]"
                >
                  ورود به حساب
                </button>
                <button
                  type="button"
                  onClick={() => continueTo("register")}
                  className="h-12 rounded-full border border-white/15 bg-white/5 px-6 font-bold text-white transition hover:bg-white/10 active:scale-[0.99]"
                >
                  ساخت حساب رایگان
                </button>
                <button
                  type="button"
                  onClick={closeAuthPrompt}
                  className="h-10 text-sm font-medium text-zinc-500 transition hover:text-zinc-300"
                >
                  ادامه به‌صورت مهمان
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </GuestAccessContext.Provider>
  );
};

export function useGuestAccess() {
  const context = useContext(GuestAccessContext);
  if (!context) {
    throw new Error("useGuestAccess must be used within GuestAccessProvider");
  }
  return context;
}

export const GuestProtectedPage: React.FC<{
  title?: string;
  description?: string;
}> = ({
  title = "این بخش برای حساب شماست",
  description = "برای دسترسی به کتابخانه، پلی‌لیست‌های شخصی، دانلودها و تنظیمات وارد حساب شوید.",
}) => {
  const { currentPage, currentParams, navigateTo } = useNavigation();

  const go = (page: "login" | "register") => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "sedabox:returnTo",
        JSON.stringify({ page: currentPage, params: currentParams || null }),
      );
    }
    navigateTo(page);
  };

  return (
    <main
      className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-950 to-black px-5 py-20 text-white"
      dir="rtl"
    >
      <section className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] p-7 text-center shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="absolute inset-x-20 -top-20 h-40 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-emerald-400 text-3xl font-black text-black">
          S
        </div>
        <h1 className="relative text-3xl font-black">{title}</h1>
        <p className="relative mx-auto mt-4 max-w-md text-sm leading-7 text-zinc-400">
          {description}
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => go("login")}
            className="h-12 rounded-full bg-emerald-400 px-8 font-black text-black transition hover:bg-emerald-300"
          >
            ورود
          </button>
          <button
            type="button"
            onClick={() => go("register")}
            className="h-12 rounded-full border border-white/15 bg-white/5 px-8 font-bold transition hover:bg-white/10"
          >
            ثبت‌نام رایگان
          </button>
        </div>
      </section>
    </main>
  );
};

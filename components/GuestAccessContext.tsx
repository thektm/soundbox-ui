"use client";

import Image from "next/image";
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
import { X } from "lucide-react";
import { useI18n } from "./I18nContext";

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
  const { t, direction } = useI18n();
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
          role="dialog"
          dir={direction}
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
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                closeAuthPrompt();
              }}
              className="absolute left-4 sb-inline-end-position top-4 z-20 grid h-11 w-11 touch-manipulation place-items-center rounded-full border border-white/10 bg-black/45 text-white transition hover:bg-white/10 active:scale-95"
              aria-label={t("بستن پنجره")}
            >
              <X className="h-5 w-5" strokeWidth={2.4} />
            </button>

            <div className="relative">
              <div className="mb-5 h-14 w-14 overflow-hidden rounded-2xl shadow-lg shadow-emerald-500/20">
                <Image
                  src="/logo.png"
                  alt="Sedabox"
                  width={56}
                  height={56}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <h2 id="guest-auth-title" className="text-2xl font-black text-white">
                {t(reason.title)}
              </h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                {t(reason.description)}
              </p>

              <div className="mt-7 grid gap-3">
                <button
                  type="button"
                  onClick={() => continueTo("login")}
                  className="h-12 rounded-full bg-emerald-400 px-6 font-black text-black transition hover:bg-emerald-300 active:scale-[0.99]"
                >
                  {t("ورود به حساب")}
                </button>
                <button
                  type="button"
                  onClick={() => continueTo("register")}
                  className="h-12 rounded-full border border-white/15 bg-white/5 px-6 font-bold text-white transition hover:bg-white/10 active:scale-[0.99]"
                >
                  {t("ساخت حساب رایگان")}
                </button>
                <button
                  type="button"
                  onClick={closeAuthPrompt}
                  className="h-10 text-sm font-medium text-zinc-500 transition hover:text-zinc-300"
                >
                  {t("ادامه به‌صورت مهمان")}
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
  title = "برای دسترسی به این بخش باید ابتدا وارد شوید",
  description = "پس از ورود می‌توانید به امکانات شخصی این بخش دسترسی داشته باشید.",
}) => {
  const { currentPage, currentParams, navigateTo } = useNavigation();
  const { t, direction } = useI18n();

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
      dir={direction}
      className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-950 to-black px-5 py-20 text-white"
    >
      <section className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] p-7 text-center shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="absolute inset-x-20 -top-20 h-40 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative mx-auto mb-6 h-20 w-20 overflow-hidden rounded-3xl shadow-lg shadow-emerald-500/20">
          <Image
            src="/logo.png"
            alt="Sedabox"
            width={80}
            height={80}
            className="h-full w-full object-contain"
            priority
          />
        </div>
        <h1 className="relative text-3xl font-black">{t(title)}</h1>
        <p className="relative mx-auto mt-4 max-w-md text-sm leading-7 text-zinc-400">
          {t(description)}
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => go("login")}
            className="h-12 rounded-full bg-emerald-400 px-8 font-black text-black transition hover:bg-emerald-300"
          >
            {t("ورود")}
          </button>
          <button
            type="button"
            onClick={() => go("register")}
            className="h-12 rounded-full border border-white/15 bg-white/5 px-8 font-bold transition hover:bg-white/10"
          >
            {t("ثبت‌نام رایگان")}
          </button>
        </div>
      </section>
    </main>
  );
};

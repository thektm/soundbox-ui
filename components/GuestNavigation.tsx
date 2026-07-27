"use client";

import React from "react";
import { useNavigation } from "./NavigationContext";
import { useGuestAccess } from "./GuestAccessContext";

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.5 10.5V20h13v-9.5M9.5 20v-5h5v5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="7" />
    <path d="m16.5 16.5 4 4" strokeLinecap="round" />
  </svg>
);
const LibraryIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M5 4v16M10 4v16M15 6l4 13" strokeLinecap="round" />
  </svg>
);

export const GuestSidebar = () => {
  const { currentPage, navigateTo } = useNavigation();
  const { requestAuth } = useGuestAccess();
  const item = (page: string, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => navigateTo(page)}
      className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-right font-bold transition ${
        currentPage === page
          ? "bg-white/10 text-white"
          : "text-zinc-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-l border-white/5 bg-black p-3 md:flex" dir="rtl">
      <button type="button" onClick={() => navigateTo("home")} className="mb-5 flex items-center gap-3 px-3 py-4 text-white">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-400 text-xl font-black text-black">S</span>
        <span className="text-xl font-black">صداباکس</span>
      </button>
      <nav className="space-y-1">
        {item("home", "خانه", <HomeIcon />)}
        {item("search", "جستجو", <SearchIcon />)}
        <button
          type="button"
          onClick={() => requestAuth({ title: "کتابخانه شخصی", description: "برای ذخیره آهنگ‌ها و ساخت پلی‌لیست وارد حساب شوید." })}
          className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-right font-bold text-zinc-400 transition hover:bg-white/5 hover:text-white"
        >
          <LibraryIcon />
          <span>کتابخانه شما</span>
        </button>
      </nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-bold text-white">پخش کامل و ذخیره موسیقی</p>
        <p className="mt-2 text-xs leading-6 text-zinc-500">با یک حساب رایگان، پلی‌لیست بسازید و موسیقی‌ها را دنبال کنید.</p>
        <button
          type="button"
          onClick={() => navigateTo("register")}
          className="mt-4 h-10 w-full rounded-full bg-white font-black text-black transition hover:scale-[1.02]"
        >
          ثبت‌نام رایگان
        </button>
        <button type="button" onClick={() => navigateTo("login")} className="mt-2 h-9 w-full text-sm font-bold text-zinc-300 hover:text-white">
          ورود
        </button>
      </div>
    </aside>
  );
};

export const GuestBottomNav = () => {
  const { currentPage, navigateTo } = useNavigation();
  const { requestAuth } = useGuestAccess();
  const buttonClass = (active: boolean) =>
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-bold ${active ? "text-white" : "text-zinc-500"}`;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[80] flex h-16 border-t border-white/10 bg-black/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" dir="rtl">
      <button type="button" onClick={() => navigateTo("home")} className={buttonClass(currentPage === "home")}><HomeIcon /><span>خانه</span></button>
      <button type="button" onClick={() => navigateTo("search")} className={buttonClass(currentPage === "search")}><SearchIcon /><span>جستجو</span></button>
      <button type="button" onClick={() => requestAuth("برای دسترسی به کتابخانه و پلی‌لیست‌های شخصی وارد شوید.")} className={buttonClass(false)}><LibraryIcon /><span>کتابخانه</span></button>
      <button type="button" onClick={() => navigateTo("login")} className={buttonClass(["login", "register"].includes(currentPage))}>
        <span className="grid h-6 w-6 place-items-center rounded-full border border-current text-xs">●</span><span>ورود</span>
      </button>
    </nav>
  );
};

export const GuestTopActions = () => {
  const { currentPage, navigateTo } = useNavigation();
  if (["login", "register", "verify", "forgot-password"].includes(currentPage)) return null;
  return (
    <div className="fixed left-3 top-3 z-[70] flex items-center gap-2 rounded-full border border-white/10 bg-black/70 p-1.5 shadow-xl backdrop-blur-xl md:hidden" dir="rtl">
      <button type="button" onClick={() => navigateTo("register")} className="h-9 rounded-full bg-white px-4 text-xs font-black text-black">ثبت‌نام</button>
      <button type="button" onClick={() => navigateTo("login")} className="h-9 rounded-full px-3 text-xs font-bold text-white">ورود</button>
    </div>
  );
};

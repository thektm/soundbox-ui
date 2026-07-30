"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Home,
  Library,
  Music2,
  Search,
} from "lucide-react";
import { useGuestAccess } from "./GuestAccessContext";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import { useNavigation } from "./NavigationContext";
import { usePlayer } from "./PlayerContext";
import { useI18n } from "./I18nContext";
import { buildUserNavigationParams } from "../lib/userProfileRoute";

const navItems = [
  { page: "home", label: "خانه", Icon: Home },
  { page: "search", label: "جستجو", Icon: Search },
] as const;

type SedaboxPlaylist = {
  id: number;
  unique_id?: string;
  title: string;
  generated_by?: "system" | "admin" | "audience";
  creator_unique_id?: string | null;
  cover_image?: string | null;
  top_three_song_covers?: string[];
  songs_count?: number;
};

type SedaboxPreview = {
  first_name?: string;
  last_name?: string;
  followers_count?: number;
  image_profile?: { image?: string | null } | null;
  user_playlists?: {
    total?: number;
    results?: SedaboxPlaylist[];
  };
};

let sedaboxPreviewCache: { data: SedaboxPreview; expiresAt: number } | null = null;
let sedaboxPreviewRequest: Promise<SedaboxPreview | null> | null = null;

async function loadSedaboxPreview(): Promise<SedaboxPreview | null> {
  if (sedaboxPreviewCache && sedaboxPreviewCache.expiresAt > Date.now()) {
    return sedaboxPreviewCache.data;
  }
  if (sedaboxPreviewRequest) return sedaboxPreviewRequest;

  sedaboxPreviewRequest = fetch(
    "https://api.sedabox.com/api/profile/sedabox/?preview=true&page_size=10&sidebar_layout=v2",
  )
    .then(async (response) => {
      if (!response.ok) return null;
      const data = (await response.json()) as SedaboxPreview;
      sedaboxPreviewCache = { data, expiresAt: Date.now() + 5 * 60_000 };
      return data;
    })
    .catch(() => null)
    .finally(() => {
      sedaboxPreviewRequest = null;
    });

  return sedaboxPreviewRequest;
}

const SedaboxAccountWidget = () => {
  const { direction, t } = useI18n();
  const { navigateTo } = useNavigation();
  const [profile, setProfile] = useState<SedaboxPreview | null>(
    sedaboxPreviewCache?.data || null,
  );
  const [isLoading, setIsLoading] = useState(!sedaboxPreviewCache?.data);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void loadSedaboxPreview().then((data) => {
      if (!active) return;
      if (data) setProfile(data);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const openProfile = () =>
    navigateTo("user-detail", buildUserNavigationParams({ unique_id: "sedabox", is_official: true }));

  const openPlaylist = (playlist: SedaboxPlaylist) => {
    const id = playlist.unique_id || String(playlist.id);
    navigateTo("playlist-detail", {
      id,
      generatedBy: playlist.generated_by,
      creatorUniqueId: playlist.creator_unique_id || "sedabox",
      slug: playlist.title,
    });
  };

  const playlists = profile?.user_playlists?.results || [];
  const previewItems = playlists.slice(0, 6);

  return (
    <div
      ref={cardRef}
      onPointerMove={(event) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect || !cardRef.current) return;
        cardRef.current.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
        cardRef.current.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
      }}
      className="group relative h-[261px] overflow-hidden rounded-[24px] border border-emerald-300/15 bg-zinc-950/90 p-3 shadow-[0_18px_45px_-24px_rgba(16,185,129,.65)] transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:transform-none"
      style={{
        backgroundImage:
          "radial-gradient(220px circle at var(--spot-x, 80%) var(--spot-y, 0px), rgba(52,211,153,.16), transparent 55%), linear-gradient(145deg, rgba(24,24,27,.98), rgba(3,7,6,.98))",
      } as React.CSSProperties}
      dir={direction}
    >
      <Image
        src="/sedabox-account-grid.svg"
        alt=""
        fill
        sizes="256px"
        className="pointer-events-none object-cover opacity-30 transition-opacity duration-300 group-hover:opacity-45"
      />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />

      <div className="relative z-10">
        <div className="flex h-9 items-center justify-between gap-2">
          <button
            type="button"
            onClick={openProfile}
            className="inline-flex min-w-0 flex-1 items-center gap-2 rounded-xl py-1 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label={t("مشاهده پروفایل")}
            dir={direction}
          >
            <Image
              src="/logo.png"
              width={32}
              height={32}
              alt={t("صداباکس")}
              className="h-7 w-7 shrink-0 object-contain"
              priority
            />
            <span className="truncate text-[11px] font-black text-white">
              {t("صداباکس")}
            </span>
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-emerald-400 text-black" />
          </button>

          <button
            type="button"
            onClick={openProfile}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-zinc-500 transition hover:bg-white/5 hover:text-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label={t("مشاهده پروفایل")}
          >
            <ArrowLeft className="h-3.5 w-3.5 sb-forward-icon-left" />
          </button>
        </div>

        <div
          className="mt-1.5 grid h-[156px] grid-cols-[minmax(0,1fr)_minmax(0,1fr)] auto-rows-[48px] gap-2 overflow-hidden"
          aria-label={t("پلی‌لیست‌های صداباکس")}
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 0%, #000 69%, rgba(0,0,0,.78) 82%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, #000 0%, #000 69%, rgba(0,0,0,.78) 82%, transparent 100%)",
          }}
        >
          {(isLoading ? Array.from({ length: 6 }) : previewItems).map((item, index) => {
            const playlist = isLoading ? undefined : (item as SedaboxPlaylist);
            if (!playlist) {
              return (
                <div
                  key={`placeholder-${index}`}
                  aria-hidden="true"
                  className="flex h-12 min-w-0 items-center gap-1.5 overflow-hidden rounded-xl border border-white/[0.04] bg-white/[0.025] p-1"
                >
                  <div className="h-8 w-8 shrink-0 rounded-lg bg-white/[0.05]" />
                  <div className="h-2 flex-1 rounded bg-white/[0.05]" />
                </div>
              );
            }

            const cover =
              playlist.top_three_song_covers?.[0] || playlist.cover_image || "";
            return (
              <button
                key={`${playlist.unique_id || playlist.id}`}
                type="button"
                onClick={() => openPlaylist(playlist)}
                className="group/item flex h-12 w-full min-w-0 max-w-full items-center gap-1.5 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.035] p-1 text-start transition hover:border-emerald-300/20 hover:bg-emerald-300/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                title={playlist.title}
              >
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-zinc-900 shadow-lg">
                  <ImageWithPlaceholder
                    src={cover}
                    alt={playlist.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/item:scale-105 motion-reduce:transform-none"
                    type="song"
                    sizes="32px"
                  />
                </span>
                <span className="block min-w-0 max-w-full flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[9px] font-bold leading-4 text-zinc-300 group-hover/item:text-white">
                  {playlist.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 bg-gradient-to-b from-transparent via-zinc-950/82 to-zinc-950" />
      <div className="absolute inset-x-3 bottom-2.5 z-30">
        <button
          type="button"
          onClick={openProfile}
          className="flex h-9 w-full items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400 px-4 text-center text-[10px] font-black text-black shadow-[0_10px_30px_-14px_rgba(52,211,153,.9)] transition hover:bg-emerald-300 active:scale-[.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
        >
          <span>{t("پلی لیست ها")}</span>
        </button>
      </div>
    </div>
  );
};

export const GuestSidebar = () => {
  const { direction, t } = useI18n();
  const { currentPage, navigateTo } = useNavigation();
  const { requestAuth } = useGuestAccess();
  const { isVisible, isExpanded } = usePlayer();
  const playerOpen = isVisible && !isExpanded;

  return (
    <aside
      className="sb-inline-end-divider sticky top-0 hidden w-72 shrink-0 overflow-hidden border-l border-white/10 bg-zinc-950 transition-[height] duration-300 md:flex md:flex-col"
      style={{ height: playerOpen ? "calc(100dvh - 90px)" : "100dvh" }}
      dir={direction}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Image
          src="/guest-sidebar-bg.svg"
          alt=""
          fill
          priority
          sizes="288px"
          className="object-cover opacity-90"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-zinc-950/55 to-zinc-950" />

      <div className="no-scrollbar relative flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        <button
          type="button"
          onClick={() => navigateTo("home")}
          className="mb-4 flex items-center gap-3 rounded-2xl px-2 py-2 text-start text-white transition hover:bg-white/5"
        >
          <Image
            src="/logo.png"
            width={44}
            height={44}
            alt="صداباکس"
            className="object-contain"
            style={{ width: 44, height: 44 }}
          />
          <div>
            <div className="text-lg font-black">{t("صداباکس")}</div>
            <div className="text-[10px] font-medium tracking-wide text-emerald-300/80">
              {t("موسیقی برای هر لحظه")}
            </div>
          </div>
        </button>

        <nav className="space-y-1" aria-label="ناوبری مهمان">
          {navItems.map(({ page, label, Icon }) => {
            const active = currentPage === page;
            return (
              <button
                key={page}
                type="button"
                onClick={() => navigateTo(page)}
                aria-current={active ? "page" : undefined}
                className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-start text-sm font-bold transition ${
                  active
                    ? "bg-white text-black shadow-lg shadow-black/20"
                    : "text-zinc-300 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.9} />
                <span>{t(label)}</span>
                {active && <span className="mr-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() =>
              requestAuth({
                title: "کتابخانه شخصی",
                description: "برای ذخیره آهنگ‌ها و ساخت پلی‌لیست وارد حساب شوید.",
              })
            }
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-start text-sm font-bold text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Library className="h-5 w-5" strokeWidth={1.9} />
            <span>{t("کتابخانه شما")}</span>
          </button>
        </nav>

        <div className="mt-3">
          <SedaboxAccountWidget />
        </div>

        <div className="mt-auto rounded-[26px] border border-white/10 bg-black/35 p-4 shadow-2xl backdrop-blur-md">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,.9)]" />
            <p className="text-sm font-black text-white">{t("تجربه کامل صداباکس")}</p>
          </div>
          <p className="text-xs leading-6 text-zinc-400">
            {t("پخش کامل، لایک، دنبال‌کردن هنرمند و پلی‌لیست‌های شخصی.")}
          </p>
          <button
            type="button"
            onClick={() => navigateTo("register")}
            className="mt-4 h-11 w-full rounded-full bg-emerald-400 text-sm font-black text-black transition hover:bg-emerald-300 active:scale-[.98]"
          >
            {t("ساخت حساب رایگان")}
          </button>
          <button
            type="button"
            onClick={() => navigateTo("login")}
            className="mt-2 h-9 w-full rounded-full text-sm font-bold text-zinc-300 transition hover:bg-white/5 hover:text-white"
          >
            {t("ورود به حساب")}
          </button>
        </div>
      </div>
    </aside>
  );
};

export const GuestBottomNav = () => {
  const { direction } = useI18n();
  const { currentPage, navigateTo } = useNavigation();
  const { requestAuth } = useGuestAccess();
  const itemClass = (active: boolean) =>
    `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-bold transition ${active ? "text-white" : "text-zinc-500"}`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[80] flex h-16 border-t border-white/10 bg-black/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" dir={direction}>
      <button type="button" onClick={() => navigateTo("home")} className={itemClass(currentPage === "home")}>
        <Home className="h-6 w-6" strokeWidth={1.8} /><span>خانه</span>
      </button>
      <button type="button" onClick={() => navigateTo("search")} className={itemClass(currentPage === "search")}>
        <Search className="h-6 w-6" strokeWidth={1.8} /><span>جستجو</span>
      </button>
      <button type="button" onClick={() => requestAuth("برای دسترسی به کتابخانه و پلی‌لیست‌های شخصی وارد شوید.")} className={itemClass(false)}>
        <Library className="h-6 w-6" strokeWidth={1.8} /><span>کتابخانه</span>
      </button>
      <button type="button" onClick={() => navigateTo("login")} className={itemClass(["login", "register"].includes(currentPage))}>
        <Image
          src="/logo.png"
          width={24}
          height={24}
          alt="ورود به صداباکس"
          className="object-contain"
          style={{ width: 24, height: 24 }}
        />
        <span>ورود</span>
      </button>
    </nav>
  );
};

export const GuestTopActions = () => {
  const { direction } = useI18n();
  const { currentPage, navigateTo } = useNavigation();
  if (currentPage !== "home") return null;

  return (
    <div className="fixed left-3 sb-inline-end-position top-3 z-[70] flex items-center gap-1 rounded-full border border-white/10 bg-black/75 p-1.5 shadow-xl backdrop-blur-xl md:hidden" dir={direction}>
      <button type="button" onClick={() => navigateTo("register")} className="h-9 rounded-full bg-white px-4 text-xs font-black text-black">
        ثبت‌نام
      </button>
      <button type="button" onClick={() => navigateTo("login")} className="h-9 rounded-full px-3 text-xs font-bold text-white">
        ورود
      </button>
    </div>
  );
};

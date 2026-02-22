"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import Image from "next/image";
import toast from "react-hot-toast";
import { createSlug } from "./mockData";
import LikedSongs from "./LikedSongs";
import LikedAlbums from "./LikedAlbums";
import LikedPlaylists from "./LikedPlaylists";
import MyPlaylists from "./MyPlaylists";
import Settings from "./Settings";
import { ResponsiveSheet } from "./ResponsiveSheet";
import FollowingArtistsPage from "./FollowingArtistsPage";

// Reusable SVG Icon component
const Icon = ({
  d,
  className = "w-5 h-5",
}: {
  d: string;
  className?: string;
}) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

// Icon paths (same as Profile.tsx)
const ICONS = {
  music:
    "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  back: "M10 19l-7-7m0 0l7-7m-7 7h18",
  heart:
    "M4.318 6.318a4.5 4.5 0 000 6.364L12 21.682l7.682-8.999a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  playlist:
    "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z",
  users:
    "M17 20h5v-2a4 4 0 00-3-3.874M9 20H4v-2a4 4 0 013-3.874M12 12a4 4 0 100-8 4 4 0 000 8z",
  folder:
    "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  arrow: "M14 5l7 7-7 7M5 5l7 7-7 7",
  chevron: "M9 5l7 7-7 7",
  playlists:
    "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  followers:
    "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
  following:
    "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  close: "M6 18L18 6M6 6l12 12",
  crown: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  crownReal:
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976-2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  lightning: "M13 10V3L4 14h7v7l9-11h-7z",
  logout:
    "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1",
  settings:
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  profile:
    "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
};

type Section =
  | "overview"
  | "downloads-history"
  | "liked-songs"
  | "liked-albums"
  | "liked-playlists"
  | "followed-artists"
  | "my-playlists"
  | "settings";

export default function DesktopProfile() {
  const {
    logout,
    user: authUser,
    fetchUserProfile,
    updateProfile,
    formatErrorMessage,
  } = useAuth();
  const { navigateTo, currentParams } = useNavigation();

  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- USER PLAN LOGIC ---
  const [planStatus, setPlanStatus] = useState<"free" | "premium">(() => {
    if (
      (typeof window !== "undefined" &&
        (window as any)?.sedabox_user_plan === "premium") ||
      false
    )
      return "premium";
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sedabox_user_plan");
      return saved === "premium" ? "premium" : "free";
    }
    return "free";
  });
  const isPremium = planStatus === "premium";

  useEffect(() => {
    if (currentParams?.planUpgraded) {
      setPlanStatus("premium");
      localStorage.setItem("sedabox_user_plan", "premium");
    }
  }, [currentParams]);

  // Navigate when a menu item that points to an external page is selected
  useEffect(() => {
    if (activeSection === "downloads-history") {
      navigateTo("downloads-history");
      // return to overview to avoid staying in this temporary state
      setActiveSection("overview");
    }
  }, [activeSection, navigateTo]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    uniqueId: "",
  });

  const user = {
    name:
      authUser?.first_name || authUser?.last_name
        ? `${authUser.first_name} ${authUser.last_name}`.trim()
        : "کاربر صداباکس",
    phone: authUser?.phone_number || "09123456789",
    email: authUser?.email || "ایمیل ثبت نشده",
    uniqueId: authUser?.unique_id || "شناسه ثبت نشده",
    joinDate: authUser?.date_joined
      ? new Date(authUser.date_joined).toLocaleDateString("fa-IR", {
          year: "numeric",
          month: "long",
        })
      : "اردیبهشت ۱۴۰۲",
  };

  useEffect(() => {
    if (authUser) {
      setFormData({
        firstName: authUser.first_name ?? "",
        lastName: authUser.last_name ?? "",
        email: authUser.email ?? "",
        uniqueId: authUser.unique_id ?? "",
      });
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser?.plan) {
      setPlanStatus(authUser.plan === "premium" ? "premium" : "free");
    }
  }, [authUser]);

  useEffect(() => {
    const fetch = async () => {
      setIsFetching(true);
      await fetchUserProfile();
      setIsFetching(false);
    };
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));
  const handleSave = () => setIsSheetOpen(false);

  const saveProfile = async () => {
    setIsSaving(true);
    const toastId = toast.loading("در حال ذخیره تغییرات...");
    try {
      const body = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        unique_id: formData.uniqueId || null,
      };
      await updateProfile(body as any);
      toast.success("پروفایل با موفقیت بروزرسانی شد", { id: toastId });
      setIsSheetOpen(false);
    } catch (err: any) {
      const body = err?.body || err;
      const uniqueErr =
        body &&
        (body.unique_id ||
          body.uniqueId ||
          (body.error && body.error.unique_id));
      if (uniqueErr) {
        const msg = Array.isArray(uniqueErr) ? uniqueErr[0] : uniqueErr;
        const lc = String(msg).toLowerCase();
        if (
          lc.includes("unique id") ||
          lc.includes("unique_id") ||
          lc.includes("user with this unique id")
        ) {
          toast.error("شناسه منحصر به فرد قبلا استفاده شده است", {
            id: toastId,
          });
        } else {
          toast.error(formatErrorMessage(err), { id: toastId });
        }
      } else {
        toast.error(formatErrorMessage(err), { id: toastId });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigateTo("login");
  };

  const menuItems = [
    { key: "overview" as Section, label: "نمای کلی", icon: ICONS.profile },
    {
      key: "downloads-history" as Section,
      label: "تاریخچه دانلودها",
      icon: ICONS.playlists,
    },
    {
      key: "liked-songs" as Section,
      label: "آهنگ‌های لایک‌شده",
      icon: ICONS.heart,
    },
    {
      key: "liked-albums" as Section,
      label: "آلبوم‌های لایک‌شده",
      icon: ICONS.music,
    },
    {
      key: "liked-playlists" as Section,
      label: "پلی‌لیست‌های لایک‌شده",
      icon: ICONS.playlist,
    },
    {
      key: "followed-artists" as Section,
      label: "هنرمندان دنبال‌شده",
      icon: ICONS.users,
    },
    {
      key: "my-playlists" as Section,
      label: "پلی‌لیست‌های من",
      icon: ICONS.folder,
    },
    { key: "settings" as Section, label: "تنظیمات", icon: ICONS.settings },
  ];

  const renderLeftContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="p-8">
            <div className="transform scale-90 origin-top-right space-y-8">
              {/* Profile Header */}
              <header className="flex items-center gap-8">
                <div className="relative">
                  <div
                    className={`w-32 h-32 rounded-full p-1 ${
                      isPremium
                        ? "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500"
                        : "bg-gradient-to-br from-emerald-400 to-blue-500"
                    }`}
                  >
                    <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
                      <span className="text-4xl font-bold text-white">
                        {formData.firstName[0]}
                        {formData.lastName[0]}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`absolute -top-3 -left-3 px-3 py-1.5 rounded-xl border text-sm font-bold shadow-lg ${
                      isPremium
                        ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                        : "bg-white/10 border-white/20 text-gray-300"
                    }`}
                    role="status"
                    aria-label={isPremium ? "کاربر ویژه" : "کاربر رایگان"}
                  >
                    {isPremium ? "VIP" : "FREE"}
                  </div>
                  <button
                    onClick={() => setIsSheetOpen(true)}
                    aria-label="ویرایش مشخصات"
                    className="absolute -bottom-3 -right-3 p-3 bg-emerald-500 rounded-full hover:bg-emerald-600 transition-all duration-300 hover:scale-110 will-change-transform focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 outline-none"
                  >
                    <Icon d={ICONS.edit} className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-white mb-2">
                    {user.name}
                  </h2>
                  <p
                    className="text-gray-400 text-lg mb-1"
                    aria-label={`شماره همراه: ${user.phone}`}
                  >
                    {user.phone}
                  </p>
                  <p
                    className="text-gray-400 text-lg mb-1"
                    aria-label={`ایمیل: ${user.email}`}
                  >
                    {user.email}
                  </p>
                  <p className="text-gray-400 text-lg">
                    عضو از {user.joinDate}
                  </p>
                </div>
              </header>

              {/* Downloads History Card */}
              <section aria-label="تاریخچه دانلودها">
                <button
                  onClick={() => navigateTo("downloads-history")}
                  aria-label="مشاهده تاریخچه دانلودها"
                  className="w-full relative group overflow-hidden rounded-2xl p-4 bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all duration-300 active:scale-[0.98] text-right focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                        <Icon
                          d={ICONS.playlists}
                          className="w-6 h-6 text-emerald-400"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white leading-tight">
                          تاریخچه دانلودها
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          مشاهده تمام آهنگ‌های دریافت شده
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-all">
                      <Icon d={ICONS.chevron} className="w-5 h-5 rotate-180" />
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />
                </button>
              </section>

              {/* Stats */}
              <section
                className="grid grid-cols-3 gap-6"
                aria-label="آمار فعالیتی"
              >
                {[
                  {
                    label: "پلی لیست‌ها",
                    value: authUser?.user_playlists_count || 0,
                    type: "playlists",
                    action: "my-playlists",
                  },
                  {
                    label: "دنبال کنندگان",
                    value: authUser?.followers_count || 0,
                    type: "followers",
                    action: "followers-following",
                    tab: "followers",
                  },
                  {
                    label: "دنبال شده",
                    value: authUser?.following_count || 0,
                    type: "following",
                    action: "followers-following",
                    tab: "following",
                  },
                ].map((stat) => (
                  <button
                    key={stat.type}
                    onClick={() =>
                      navigateTo(
                        stat.action,
                        stat.tab ? { tab: stat.tab } : undefined,
                      )
                    }
                    aria-label={`${stat.label}: ${stat.value.toLocaleString("fa-IR")}`}
                    className="text-center py-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-white/8 active:scale-95 transition-all duration-300 will-change-transform focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                  >
                    <div className="flex items-center justify-center mb-3">
                      <Icon
                        d={ICONS[stat.type as keyof typeof ICONS]}
                        className="w-8 h-8 text-emerald-400"
                      />
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">
                      {(stat.value || 0).toLocaleString("fa-IR")}
                    </div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </button>
                ))}
              </section>

              {/* Plan Section */}
              <section
                aria-label="وضعیت اشتراک"
                className={`relative w-full rounded-3xl overflow-hidden border shadow-2xl ${
                  isPremium
                    ? "bg-gradient-to-br from-[#0d1f17] via-[#0a1a12] to-[#061210] border-emerald-500/30"
                    : "bg-[#070707] border-white/8"
                }`}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50"></div>
                {isPremium ? (
                  <div className="relative p-8">
                    <div className="absolute top-[-50%] right-[-30%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
                    <div className="absolute bottom-[-50%] left-[-30%] w-[350px] h-[350px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                            <svg
                              className="w-8 h-8 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d={ICONS.crownReal} />
                            </svg>
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-white">
                              کاربر پریمیوم
                            </h2>
                            <p className="text-lg text-emerald-400">
                              دسترسی کامل به همه امکانات
                            </p>
                          </div>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
                          <span className="text-lg font-bold text-yellow-400">
                            VIP
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {[
                          { label: "کیفیت پخش", value: "۳۲۰ kbps" },
                          { label: "تبلیغات", value: "بدون تبلیغات" },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl bg-white/5 border border-white/10"
                          >
                            <p className="text-sm text-gray-500 mb-2">
                              {item.label}
                            </p>
                            <p className="text-xl font-medium text-emerald-400">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-lg text-gray-300">
                            اعتبار تا
                          </span>
                          <span className="text-lg font-medium text-white">
                            {new Date(
                              Date.now() + 30 * 24 * 60 * 60 * 1000,
                            ).toLocaleDateString("fa-IR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row relative">
                    <div className="relative flex-1 p-8 z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                            <Icon
                              d={ICONS.users}
                              className="w-6 h-6 text-gray-400"
                            />
                          </div>
                          <span className="text-xl font-semibold text-gray-300">
                            پلن فعلی
                          </span>
                        </div>
                        <span className="text-lg px-3 py-1.5 rounded-lg bg-white/10 text-gray-400 border border-white/5">
                          رایگان
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h2 className="text-3xl font-bold text-white mb-2">
                            کاربر عادی
                          </h2>
                          <p className="text-lg text-gray-500">
                            دسترسی محدود به امکانات
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                    <button
                      className="relative flex-1 p-8 overflow-hidden group cursor-pointer text-right transition-all hover:bg-white/[0.02] focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                      onClick={() => navigateTo("upgrade-plans")}
                      aria-label="ارتقا به نسخه پرو"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/25 to-[#020202] group-hover:from-emerald-800/25 transition-all duration-500"></div>
                      <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-900/8 rounded-full blur-3xl group-hover:bg-emerald-800/8 transition-all"></div>
                      <div className="absolute -left-6 bottom-0 w-40 h-40 bg-blue-900/6 rounded-full blur-4xl"></div>
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-500">
                                اشتراک ویژه
                              </span>
                              <Icon
                                d={ICONS.crownReal}
                                className="w-6 h-6 text-yellow-400 animate-pulse"
                              />
                            </h2>
                            <p className="text-lg text-gray-400 mt-2">
                              بدون محدودیت گوش کنید
                            </p>
                          </div>
                        </div>
                        <ul className="space-y-3 mb-6">
                          <li className="flex items-center gap-3 text-base text-gray-300">
                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                            کیفیت پخش بالاتر
                          </li>
                          <li className="flex items-center gap-3 text-base text-gray-300">
                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                            بدون تبلیغات
                          </li>
                        </ul>
                        <div className="w-full py-4 relative overflow-hidden rounded-2xl group/btn">
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all group-hover/btn:scale-105 will-change-transform"></div>
                          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                          <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"></div>
                          <div className="relative z-20 flex items-center justify-center gap-3">
                            <span className="text-white font-bold text-lg">
                              ارتقا به نسخه پرو
                            </span>
                            <Icon
                              d={ICONS.lightning}
                              className="w-6 h-6 text-yellow-200"
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </section>

              {/* Recent Plays */}
              <section aria-label="آهنگ‌های اخیراً پخش شده">
                <h2 className="text-2xl font-semibold text-white mb-6">
                  اخیراً پخش شده
                </h2>
                <div className="grid grid-cols-2 gap-4" role="list">
                  {isFetching ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 animate-pulse"
                      >
                        <div className="w-16 h-16 rounded-lg bg-white/10" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-white/10 rounded w-3/4" />
                          <div className="h-3 bg-white/5 rounded w-1/2" />
                        </div>
                      </div>
                    ))
                  ) : authUser?.recently_played?.items?.length ? (
                    authUser.recently_played.items
                      .slice(0, 6)
                      .map((track: any) => (
                        <button
                          key={track.id}
                          role="listitem"
                          onClick={() =>
                            navigateTo("song-detail", {
                              id: track.id,
                              artistSlug:
                                track.artist_unique_id ||
                                createSlug(track.artist_name || "artist"),
                              songSlug: createSlug(track.title),
                            })
                          }
                          aria-label={`پخش ${track.title} اثر ${track.artist_name}`}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all duration-300 will-change-transform text-right focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                        >
                          <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-800">
                            <Image
                              src={
                                track.image ||
                                track.cover_image ||
                                "/music-listen.webp"
                              }
                              alt=""
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-white truncate">
                              {track.title}
                            </h3>
                            <p className="text-gray-400 text-sm truncate">
                              {track.artist_name}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              {track.played_at
                                ? new Date(track.played_at).toLocaleDateString(
                                    "fa-IR",
                                  )
                                : ""}{" "}
                              •{" "}
                              {track.duration_display || track.duration || "-"}
                            </p>
                          </div>
                        </button>
                      ))
                  ) : (
                    <div className="w-full text-center py-8 text-gray-500 text-sm">
                      هنوز آهنگی پخش نکرده‌اید
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        );
      case "liked-songs":
        return <LikedSongs />;
      case "liked-albums":
        return <LikedAlbums />;
      case "liked-playlists":
        return <LikedPlaylists />;
      case "followed-artists":
        return <FollowingArtistsPage />;
      case "my-playlists":
        return <MyPlaylists />;
      case "settings":
        return <Settings />;
      default:
        return <div>بخش انتخاب شده یافت نشد</div>;
    }
  };

  return (
    <div
      className="relative w-full min-h-screen bg-[#030303] text-white overflow-hidden font-sans"
      dir="rtl"
    >
      {/* Noise Texture */}
      <div
        className="fixed inset-0 opacity-[0.02] pointer-events-none z-40 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Glowing Orbs */}
      <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] bg-emerald-900/8 rounded-full blur-[200px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-15%] right-[15%] w-[500px] h-[500px] bg-blue-900/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-8 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12">
              <Image
                src="/logo.png"
                alt="SedaBox Logo"
                className="w-full h-full object-contain drop-shadow-lg"
                width={48}
                height={48}
              />
            </div>
            <h1 className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
              پروفایل
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateTo("settings")}
              aria-label="تنظیمات"
              className="w-14 h-14 rounded-2xl bg-black/50 hover:bg-black/70 flex items-center justify-center transition-all duration-300 hover:scale-105 will-change-transform focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
            >
              <Icon d={ICONS.settings} className="w-7 h-7 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 flex min-h-[calc(100vh-120px)]">
        {/* Left Side - Navigation Menu */}
        <nav
          className="flex-[0_0_30%] border-r border-white/5 p-6"
          aria-label="منوی حساب کاربری"
        >
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                aria-current={activeSection === item.key ? "page" : undefined}
                className={`relative w-full flex items-center gap-3 py-4 px-5 rounded-xl overflow-hidden transition-all duration-300 will-change-transform focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none ${
                  activeSection === item.key
                    ? "bg-emerald-500/10 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                    : "bg-white/5 border border-white/10 hover:bg-white/8 hover:border-emerald-500/20"
                }`}
              >
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Icon d={ICONS.arrow} className="w-4 h-4 rotate-180" />
                </div>
                <div className="w-full flex items-center justify-end relative">
                  <div className=" text-sm pr-6 w-fit font-medium text-white text-right flex-1 z-10">
                    {item.label}
                  </div>
                  <div className="-mr-3 absolute right-0 p-1 bg-white/5 rounded-lg z-0">
                    <Icon d={item.icon} className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </button>
            ))}
            {/* Logout Button */}
            <button
              className="relative w-full flex items-center gap-3 py-4 px-5 bg-gradient-to-r from-red-500/10 to-black/20 border border-red-500/30 rounded-xl overflow-hidden hover:from-red-500/20 transition-all duration-300 group will-change-transform focus-visible:ring-2 focus-visible:ring-red-500 outline-none"
              onClick={handleLogout}
              aria-label="خروج از حساب کاربری"
            >
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400"></div>
              <div className="w-full flex items-center justify-end relative">
                <div className="text-sm pr-6 w-fit font-medium text-red-400 text-right flex-1 z-10 group-hover:text-red-500 transition-colors">
                  خروج از حساب کاربری
                </div>
                <div className="-mr-3 absolute right-0 p-2 bg-red-500/10 rounded-lg z-0">
                  <Icon d={ICONS.logout} className="w-5 h-5 text-red-400" />
                </div>
              </div>
            </button>
          </div>
        </nav>

        {/* Right Side - Content */}
        <main
          className="flex-[0_0_70%] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
          aria-label="محتوای انتخاب شده"
        >
          {renderLeftContent()}
        </main>
      </div>

      {/* Edit Sheet */}
      <ResponsiveSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        desktopWidth="w-[500px]"
      >
        <div className="p-8 h-full flex flex-col" dir="rtl">
          <div className="flex items-center justify-between mb-8 flex-shrink-0">
            <h2 className="text-2xl font-bold text-white">ویرایش پروفایل</h2>
            <button
              onClick={() => setIsSheetOpen(false)}
              className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:border-red-500/50 transition hidden md:block"
            >
              <Icon d={ICONS.close} className="w-6 h-6 text-gray-400" />
            </button>
          </div>
          <div className="space-y-6 mb-8 flex-1 overflow-y-auto">
            {[
              {
                key: "firstName",
                label: "نام",
                placeholder: "نام خود را وارد کنید",
              },
              {
                key: "lastName",
                label: "نام خانوادگی",
                placeholder: "نام خانوادگی خود را وارد کنید",
              },
              {
                key: "email",
                label: "ایمیل",
                placeholder: "ایمیل خود را وارد کنید",
                type: "email",
              },
              {
                key: "uniqueId",
                label: "شناسه منحصر به فرد",
                placeholder: "شناسه منحصر به فرد خود را وارد کنید",
                info: true,
              },
            ].map((field) => (
              <div key={field.key}>
                <label
                  htmlFor={`desktop-profile-${field.key}`}
                  className="block text-lg font-medium text-gray-400 mb-3"
                >
                  {field.label}
                </label>
                <input
                  id={`desktop-profile-${field.key}`}
                  type={field.type || "text"}
                  value={formData[field.key as keyof typeof formData]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors text-lg"
                  dir="rtl"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-4 flex-shrink-0">
            <button
              onClick={saveProfile}
              disabled={isSaving}
              className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all will-change-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
            <button
              onClick={() => setIsSheetOpen(false)}
              disabled={isSaving}
              className="px-8 py-4 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-2xl hover:border-white/20 transition-colors disabled:opacity-50"
            >
              انصراف
            </button>
          </div>
        </div>
      </ResponsiveSheet>
    </div>
  );
}

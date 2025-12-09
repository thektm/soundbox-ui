"use client";

import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";

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

// Icon paths
const ICONS = {
  music:
    "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  back: "M10 19l-7-7m0 0l7-7m-7 7h18",
  heart:
    "M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.682l-7.682-8.999a4.5 4.5 0 010-6.365z",
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
  crown: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", // Using check circle for active, swapping for crown below
  crownReal:
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  lightning: "M13 10V3L4 14h7v7l9-11h-7z",
  logout:
    "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1",
};

export default function Profile() {
  const { logout } = useAuth();
  const { setCurrentPage } = useNavigation();

  const handleLogout = () => {
    logout();
    setCurrentPage("login");
  };

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // --- USER PLAN LOGIC ---
  // Change this value to 'premium' to see the paid state
  const planStatus = "free" as "free" | "premium";
  const isPremium = planStatus === "premium";
  // -----------------------

  const [formData, setFormData] = useState({
    firstName: "علی",
    lastName: "رضایی",
    email: "ali.rezaei@example.com",
  });

  const user = {
    name: `${formData.firstName} ${formData.lastName}`,
    phone: "09123456789",
    email: formData.email,
    joinDate: "اردیبهشت ۱۴۰۲",
  };

  const handleChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));
  const handleSave = () => setIsSheetOpen(false);

  return (
    <div
      className="relative w-full pb-20 min-h-screen bg-[#030303] text-white overflow-hidden font-sans"
      dir="rtl"
    >
      {/* Noise Texture */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-40 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-blue-900/6 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 lg:p-12">
        <div className="flex items-center px-6 pt-6 justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12">
              <img
                src="/logo.png"
                alt="SedaBox Logo"
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-white via-gray-200 to-gray-500">
              پروفایل
            </h1>
          </div>
          <button
            onClick={() => setCurrentPage("home")}
            className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-105"
          >
            <Icon d={ICONS.back} className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="max-w-2xl mx-auto">
          <div className="relative group rounded-2xl p-1 backdrop-blur-md transition-all duration-500 bg-[#050505]/30">
            <div className="p-6 lg:p-8">
              {/* Avatar Section */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div
                    className={`w-24 h-24 rounded-full p-1 ${
                      isPremium
                        ? "bg-linear-to-br from-yellow-400 via-orange-500 to-red-500"
                        : "bg-linear-to-br from-emerald-400 to-blue-500"
                    }`}
                  >
                    <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
                      {/* Avatar Image or Initials */}
                      <span className="text-2xl font-bold text-white relative z-10">
                        {formData.firstName[0]}
                        {formData.lastName[0]}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`absolute -top-2 -left-2 px-2 py-1 rounded-lg border text-[10px] font-bold shadow-lg backdrop-blur-sm ${
                      isPremium
                        ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                        : "bg-white/10 border-white/20 text-gray-300"
                    }`}
                  >
                    {isPremium ? "VIP" : "FREE"}
                  </div>

                  <button
                    onClick={() => setIsSheetOpen(true)}
                    className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 rounded-full hover:bg-emerald-600 transition-colors z-20"
                  >
                    <Icon d={ICONS.edit} />
                  </button>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {user.name}
                  </h2>
                  <p className="text-gray-400 text-sm mb-1">{user.phone}</p>
                  <p className="text-gray-400 text-sm mb-1">{user.email}</p>
                  <p className="text-gray-400 text-sm">
                    عضو از {user.joinDate}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8" dir="ltr">
                {[
                  { label: "پلی لیست‌ها", value: 24, type: "playlists" },
                  { label: "دنبال کنندگان", value: 156, type: "followers" },
                  { label: "دنبال شده", value: 89, type: "following" },
                ].map((stat) => (
                  <div
                    key={stat.type}
                    className="text-center py-2 rounded-xl bg-white/4 border border-white/8 hover:border-emerald-500/30 transition-colors"
                  >
                    <div
                      dir="rtl"
                      className="flex items-center justify-center mb-1"
                    >
                      <Icon
                        d={ICONS[stat.type as keyof typeof ICONS]}
                        className="w-5 h-5 text-emerald-400"
                      />
                      <div className="text-2xl p-1 font-bold text-white ml-2">
                        {stat.value.toLocaleString("fa-IR")}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* ---------------------------------------------------------- */}
              {/* User Plan Section */}
              {/* ---------------------------------------------------------- */}
              <div className="mb-8">
                <div className="relative w-full rounded-3xl overflow-hidden bg-[#070707] border border-white/8 shadow-2xl">
                  {/* Decorate Glows inside Plan Section */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-emerald-500/50 to-transparent opacity-50"></div>

                  <div className="flex flex-col md:flex-row relative">
                    {/* LEFT SIDE: CURRENT PLAN (FREE) */}
                    <div
                      className={`relative flex-1 p-6 ${
                        isPremium ? "opacity-50" : "z-10"
                      }`}
                    >
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-5 pattern-grid-lg pointer-events-none"></div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                            <Icon
                              d={ICONS.users}
                              className="w-4 h-4 text-gray-400"
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-300">
                            پلن فعلی
                          </span>
                        </div>
                        {!isPremium && (
                          <span className="text-xs px-2 py-1 rounded-md bg-white/10 text-gray-400 border border-white/5">
                            رایگان
                          </span>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            کاربر عادی
                          </h3>
                          <p className="text-xs text-gray-500">
                            دسترسی محدود به امکانات
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* DIVIDER (Visible on Desktop) */}
                    <div className="hidden md:block w-px bg-linear-to-b from-transparent via-white/10 to-transparent"></div>

                    {/* RIGHT SIDE: UPGRADE PROMO (PREMIUM) */}
                    <div className="relative flex-1 p-6 overflow-hidden group cursor-pointer">
                      {/* Gradient Background */}
                      <div className="absolute inset-0 bg-linear-to-br from-emerald-900/25 to-[#020202] group-hover:from-emerald-800/25 transition-all duration-500"></div>

                      {/* Decorative Shapes */}
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-900/8 rounded-full blur-2xl group-hover:bg-emerald-800/8 transition-all"></div>
                      <div className="absolute -left-4 bottom-0 w-32 h-32 bg-blue-900/6 rounded-full blur-3xl"></div>

                      <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <span className="bg-clip-text text-transparent bg-linear-to-r from-yellow-200 to-yellow-500">
                                اشتراک ویژه
                              </span>
                              <Icon
                                d={ICONS.crownReal}
                                className="w-4 h-4 text-yellow-400 animate-pulse"
                              />
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                              بدون محدودیت گوش کنید
                            </p>
                          </div>
                        </div>

                        <ul className="space-y-2 mb-4">
                          <li className="flex items-center gap-2 text-xs text-gray-300">
                            <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
                            کیفیت پخش بالاتر
                          </li>
                          <li className="flex items-center gap-2 text-xs text-gray-300">
                            <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
                            پخش نامحدود آفلاین
                          </li>
                        </ul>

                        <button className="w-full py-2.5 relative overflow-hidden rounded-xl group/btn">
                          <div className="absolute inset-0 bg-linear-to-r from-emerald-500 to-emerald-600 transition-all group-hover/btn:scale-[1.02]"></div>
                          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                          {/* Shimmer Effect */}
                          <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/20 to-transparent z-10"></div>

                          <div className="relative z-20 flex items-center justify-center gap-2">
                            <span className="text-white font-bold text-sm">
                              ارتقا به نسخه پرو
                            </span>
                            <Icon
                              d={ICONS.lightning}
                              className="w-4 h-4 text-yellow-200"
                            />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* ---------------------------------------------------------- */}
              {/* END OF PLANS SECTION */}
              {/* ---------------------------------------------------------- */}

              {/* Recent Plays */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-3">
                  اخیراً پخش شده
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 hide-scrollbar">
                  {Array.from({ length: 9 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="min-w-[140px] shrink-0 rounded-xl overflow-hidden bg-white/3 border border-white/7 hover:border-emerald-500/30 transition-colors cursor-pointer"
                    >
                      <div className="aspect-square bg-zinc-800 flex items-center justify-center">
                        <img
                          src="/music-listen.webp"
                          alt={`ترانه ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="font-semibold text-sm text-white truncate">
                          ترانه {idx + 1}
                        </h4>
                        <p className="text-xs text-gray-400 truncate">
                          هنرمند {idx + 1}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {idx % 2 === 0 ? "دیروز" : "2 روز پیش"}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="min-w-[140px] shrink-0 rounded-xl p-3 flex items-center justify-center bg-white/3 border border-dashed border-white/7">
                    <button className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <span className="text-white font-medium">مشاهده همه</span>
                      <Icon
                        d={ICONS.chevron}
                        className="w-5 h-5 text-gray-300 rotate-180"
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-3 mb-8">
                {[
                  {
                    key: "liked-songs",
                    label: "آهنگ‌های لایک‌شده",
                    icon: ICONS.heart,
                  },
                  {
                    key: "liked-playlists",
                    label: "پلی‌لیست‌های لایک‌شده",
                    icon: ICONS.playlist,
                  },
                  {
                    key: "followed-artists",
                    label: "هنرمندان دنبال‌شده",
                    icon: ICONS.users,
                  },
                  {
                    key: "my-playlists",
                    label: "پلی‌لیست‌های من",
                    icon: ICONS.folder,
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    className="relative w-full flex py-5 items-center gap-4 bg-linear-to-b from-white/1 to-black/20 border border-white/7 rounded-xl p-4 overflow-hidden hover:from-white/2 transition-colors"
                  >
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Icon d={ICONS.arrow} className="w-4 h-4 rotate-180" />
                    </div>
                    <div className="w-full flex items-center justify-end relative">
                      <div className="text-sm pr-10 w-fit font-medium text-white text-right flex-1 z-10">
                        {item.label}
                      </div>
                      <div className="absolute right-0 p-2 bg-white/3 rounded-md z-0">
                        <Icon
                          d={item.icon}
                          className="w-5 h-5 text-emerald-400"
                        />
                      </div>
                    </div>
                  </button>
                ))}
                {/* Logout Button */}
                <button
                  className="relative w-full flex py-5 items-center gap-4 bg-gradient-to-b from-red-500/10 to-black/20 border border-red-500/30 rounded-xl p-4 overflow-hidden hover:from-red-500/20 transition-colors group"
                  onClick={handleLogout}
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400"></div>
                  <div className="w-full flex items-center justify-end relative">
                    <div className="text-sm pr-10 w-fit font-medium text-red-400 text-right flex-1 z-10 group-hover:text-red-500 transition-colors">
                      خروج از حساب کاربری
                    </div>
                    <div className="absolute right-0 p-2 bg-red-500/10 rounded-md z-0">
                      <Icon d={ICONS.logout} className="w-5 h-5 text-red-400" />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isSheetOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsSheetOpen(false)}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-60 bg-linear-to-t from-[#0a0a0a] to-[#1a1a1a] rounded-t-3xl border-t border-white/10 transition-transform duration-300 ease-out ${
          isSheetOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="p-6" dir="rtl">
          {/* Handle */}
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">ویرایش پروفایل</h3>
            <button
              onClick={() => setIsSheetOpen(false)}
              className="p-2 bg-white/5 rounded-xl border border-white/10 hover:border-red-500/50 transition"
            >
              <Icon d={ICONS.close} className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 mb-6">
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
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {field.label}
                </label>
                <input
                  type={field.type || "text"}
                  value={formData[field.key as keyof typeof formData]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  dir="rtl"
                />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-linear-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all"
            >
              ذخیره تغییرات
            </button>
            <button
              onClick={() => setIsSheetOpen(false)}
              className="px-6 py-3 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-xl hover:border-white/20 transition-colors"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

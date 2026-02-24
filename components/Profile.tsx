"use client";

import UserIcon from "./UserIcon"; // Importing UserIcon

import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import Image from "next/image";
import { Drawer } from "vaul";
import { ResponsiveSheet } from "./ResponsiveSheet";
import toast from "react-hot-toast";
import { createSlug } from "./mockData";

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
  settings:
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  camera:
    "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z",
  profile:
    "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  trash:
    "M14.74 9l-.34 9m-4.72 0l-.34-9M4.5 7h15M10 3h4a1 1 0 011 1v1h-6V4a1 1 0 011-1zM18.37 7l-.64 12.42A2 2 0 0115.75 21H8.25a2 2 0 01-1.98-1.58L5.63 7h12.74z",
};

export default function Profile() {
  const {
    logout,
    user: authUser,
    fetchUserProfile,
    updateProfile,
    updateProfileImage,
    deleteProfileImage,
    formatErrorMessage,
  } = useAuth();
  const { navigateTo, currentParams, goBack } = useNavigation();
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = () => {
    logout();
    navigateTo("login");
  };

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (512 KB)
    if (file.size > 512 * 1024) {
      toast.error("حجم فایل نباید بیشتر از ۵۱۲ کلوبایت باشد");
      return;
    }

    setIsUploadingImage(true);
    const toastId = toast.loading("در حال آپلود تصویر...");
    try {
      await updateProfileImage(file);
      toast.success("تصویر پروفایل با موفقیت آپلود شد", { id: toastId });
    } catch (err: any) {
      toast.error(formatErrorMessage(err), { id: toastId });
    } finally {
      setIsUploadingImage(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm("آیا از حذف تصویر پروفایل خود مطمئن هستید؟")) return;

    setIsDeletingImage(true);
    const toastId = toast.loading("در حال حذف تصویر...");
    try {
      await deleteProfileImage();
      toast.success("تصویر پروفایل با موفقیت حذف شد", { id: toastId });
    } catch (err: any) {
      toast.error(formatErrorMessage(err), { id: toastId });
    } finally {
      setIsDeletingImage(false);
    }
  };

  // --- USER PLAN LOGIC ---
  // Plan status managed via state - persisted in localStorage for demo
  const [planStatus, setPlanStatus] = useState<"free" | "premium">(() => {
    if (authUser?.plan === "premium") return "premium";
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sedabox_user_plan");
      return saved === "premium" ? "premium" : "free";
    }
    return "free";
  });
  const isPremium = planStatus === "premium";

  // Check if we returned from successful payment
  useEffect(() => {
    if (currentParams?.planUpgraded) {
      setPlanStatus("premium");
      localStorage.setItem("sedabox_user_plan", "premium");
    }
  }, [currentParams]);

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
  }, []);
  // -----------------------

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    uniqueId: "",
  });

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

  const handleChange = (field: string, value: string) => {
    if (field === "uniqueId") {
      // Only allow a-z, 0-9, no spaces or special chars
      value = value.replace(/[^a-z0-9]/gi, "");
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading("در حال ذخیره تغییرات...");
    try {
      const endpoint = "https://api.sedabox.com/api/profile/";
      const body = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        unique_id: formData.uniqueId || null,
      };
      console.log("Updating profile - endpoint:", endpoint);
      console.log("Updating profile - body:", body);
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

  // Determine if save button should be disabled
  const allFieldsEmpty =
    !formData.firstName &&
    !formData.lastName &&
    !formData.email &&
    !formData.uniqueId;
  const bothNamesEmpty = !formData.firstName && !formData.lastName;
  const disableSave = allFieldsEmpty || bothNamesEmpty;

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
      <header className="relative z-80 lg:p-12 ">
        <div className="flex fixed top-0 z-60 w-full bg-black/90  items-center px-4 pt-4 pb-2 justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10" aria-hidden="true">
              <Image
                src="/logo.png"
                alt=""
                className="w-full h-full object-contain drop-shadow-lg"
                width={40}
                height={40}
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-white via-gray-200 to-gray-500">
              پروفایل
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo("settings")}
              className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70  flex items-center justify-center transition-all duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
              aria-label="تنظیمات"
            >
              <Icon d={ICONS.settings} className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={goBack}
              className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70  flex items-center justify-center transition-all duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
              aria-label="بازگشت"
            >
              <Icon d={ICONS.back} className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-2xl mx-auto mt-14" aria-label="مدیریت حساب کاربری">
        {/* Profile Card */}
        <div className="relative group rounded-2xl p-1  transition-all duration-500 bg-[#050505]/30">
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
                  aria-hidden="true"
                >
                  <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden text-center">
                    {/* Display user profile image if available */}
                    {authUser?.image_profile?.image ? (
                      <Image
                        src={authUser.image_profile.image}
                        alt={user.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center">
                        <UserIcon className="w-10 h-10 text-white/60" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  className={`absolute -top-2 -left-2 px-2 py-1 rounded-lg border text-[10px] font-bold shadow-lg  ${
                    isPremium
                      ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                      : "bg-white/10 border-white/20 text-gray-300"
                  }`}
                >
                  <span className="sr-only">نوع حساب:</span>
                  {isPremium ? "Premium" : "FREE"}
                </div>

                <button
                  onClick={() => setIsSheetOpen(true)}
                  className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 rounded-full hover:bg-emerald-600 transition-colors z-20 focus-visible:ring-2 focus-visible:ring-white outline-none"
                  aria-label="ویرایش اطلاعات پروفایل"
                >
                  <Icon d={ICONS.edit} />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {user.name}
                </h2>
                <p className="text-gray-400 text-sm mb-1">{user.phone}</p>
                {user.uniqueId && user.uniqueId !== "شناسه ثبت نشده" && (
                  <p className="text-gray-400 text-sm mb-1">{user.uniqueId}</p>
                )}

                <p className="text-gray-400 text-sm">عضو از {user.joinDate}</p>
              </div>
            </div>

            {/* Stats */}
            <div
              className="grid grid-cols-3 gap-4 mb-8"
              dir="ltr"
              role="group"
              aria-label="آمار و فعالیت‌ها"
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
                      stat.action as any,
                      (stat as any).tab
                        ? { tab: (stat as any).tab }
                        : undefined,
                    )
                  }
                  aria-label={`مشاهده ${stat.label}: ${stat.value}`}
                  className="text-center py-2 rounded-xl bg-white/4 border border-white/8 hover:border-emerald-500/30 hover:bg-white/6 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all duration-200 outline-none min-h-[72px]"
                >
                  {isFetching ? (
                    <div
                      className="animate-pulse flex flex-col items-center gap-2"
                      aria-hidden="true"
                    >
                      <div className="h-7 w-12 bg-white/10 rounded" />
                      <div className="h-3 w-16 bg-white/5 rounded" />
                    </div>
                  ) : (
                    <>
                      <div
                        dir="rtl"
                        className="flex items-center justify-center mb-1"
                        aria-hidden="true"
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
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Downloads History Card */}
            <button
              onClick={() => navigateTo("downloads-history")}
              aria-label="مشاهده تاریخچه دانلودها"
              className="w-full mb-2 relative group overflow-hidden rounded-2xl p-2 bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all duration-300 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
            >
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors"
                    aria-hidden="true"
                  >
                    <Icon
                      d={ICONS.playlists}
                      className="w-6 h-6 text-emerald-400"
                    />
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-bold text-white leading-tight">
                      تاریخچه دانلودها
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      مشاهده تمام آهنگ‌های دریافت شده
                    </p>
                  </div>
                </div>
                <div
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-all"
                  aria-hidden="true"
                >
                  <Icon d={ICONS.chevron} className="w-5 h-5 rotate-180" />
                </div>
              </div>
              {/* Decorative background glow */}
              <div
                className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"
                aria-hidden="true"
              />
            </button>

            {/* View Profile Card */}
            <button
              onClick={() =>
                navigateTo("user-detail", {
                  id: authUser?.unique_id || authUser?.id,
                })
              }
              aria-label={`مشاهده پروفایل کاربر ${authUser?.unique_id || ""}`}
              className="w-full mb-8 relative group overflow-hidden rounded-2xl p-2 bg-white/[0.03] border border-white/8 hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all duration-300 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
            >
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors"
                    aria-hidden="true"
                  >
                    <Icon
                      d={ICONS.profile}
                      className="w-6 h-6 text-emerald-400"
                    />
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-bold text-white leading-tight">
                      مشاهده پروفایل
                    </h3>
                  </div>
                </div>
                <div
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-all"
                  aria-hidden="true"
                >
                  <Icon d={ICONS.chevron} className="w-5 h-5 rotate-180" />
                </div>
              </div>
              <div
                className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"
                aria-hidden="true"
              />
            </button>
            {/* ---------------------------------------------------------- */}
            {/* User Plan Section */}
            {/* ---------------------------------------------------------- */}
            <article className="mb-8" aria-label="وضعیت اشتراک">
              <div
                className={`relative w-full rounded-3xl overflow-hidden border shadow-2xl ${
                  isPremium
                    ? "bg-gradient-to-br from-[#0d1f17] via-[#0a1a12] to-[#061210] border-emerald-500/30"
                    : "bg-[#070707] border-white/8"
                }`}
              >
                {/* Decorate Glows inside Plan Section */}
                <div
                  className={`absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent ${
                    isPremium ? "via-yellow-500/50" : "via-emerald-500/50"
                  } to-transparent opacity-50`}
                  aria-hidden="true"
                ></div>

                {isPremium ? (
                  /* PREMIUM USER VIEW */
                  <div className="relative p-6">
                    {/* Background Effects */}
                    <div
                      className="absolute top-[-30%] right-[-20%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"
                      aria-hidden="true"
                    />
                    <div
                      className="absolute bottom-[-30%] left-[-20%] w-[250px] h-[250px] bg-yellow-500/5 rounded-full blur-[80px] pointer-events-none"
                      aria-hidden="true"
                    />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20"
                            aria-hidden="true"
                          >
                            <svg
                              className="w-6 h-6 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d={ICONS.crownReal} />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">
                              کاربر پریمیوم
                            </h3>
                            <p className="text-xs text-emerald-400">
                              دسترسی کامل به همه امکانات
                            </p>
                          </div>
                        </div>
                        <div
                          className="px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30"
                          aria-hidden="true"
                        >
                          <span className="text-xs font-bold text-yellow-400">
                            VIP
                          </span>
                        </div>
                      </div>

                      <div
                        className="grid grid-cols-2 gap-3 mb-4"
                        aria-label="جزئیات اشتراک"
                      >
                        {[
                          { label: "کیفیت پخش", value: "۳۲۰ kbps" },
                          { label: "تبلیغات", value: "بدون تبلیغات" },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-white/5 border border-white/10"
                          >
                            <p className="text-xs text-gray-500 mb-1">
                              {item.label}
                            </p>
                            <p className="text-sm font-medium text-emerald-400">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* FREE USER VIEW */
                  <div className="flex flex-col md:flex-row relative">
                    {/* LEFT SIDE: CURRENT PLAN (FREE) */}
                    <div className="relative flex-1 p-6 z-10">
                      {/* Background Pattern */}
                      <div
                        className="absolute inset-0 opacity-5 pattern-grid-lg pointer-events-none"
                        aria-hidden="true"
                      ></div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="p-1.5 rounded-lg bg-white/5 border border-white/10"
                            aria-hidden="true"
                          >
                            <Icon
                              d={ICONS.users}
                              className="w-4 h-4 text-gray-400"
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-300">
                            پلن فعلی
                          </span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-md bg-white/10 text-gray-400 border border-white/5">
                          رایگان
                        </span>
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
                    <div
                      className="hidden md:block w-px bg-linear-to-b from-transparent via-white/10 to-transparent"
                      aria-hidden="true"
                    ></div>

                    {/* RIGHT SIDE: UPGRADE PROMO (PREMIUM) */}
                    <button
                      className="relative flex-1 p-6 overflow-hidden group cursor-pointer text-right outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      onClick={() => navigateTo("premium")}
                      aria-label="ارتقا به اشتراک ویژه"
                    >
                      {/* Gradient Background */}
                      <div className="absolute inset-0 bg-linear-to-br from-emerald-900/25 to-[#020202] group-hover:from-emerald-800/25 transition-all duration-500"></div>

                      {/* Decorative Shapes */}
                      <div
                        className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-900/8 rounded-full blur-2xl group-hover:bg-emerald-800/8 transition-all"
                        aria-hidden="true"
                      ></div>
                      <div
                        className="absolute -left-4 bottom-0 w-32 h-32 bg-blue-900/6 rounded-full blur-3xl"
                        aria-hidden="true"
                      ></div>

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
                            <div
                              className="w-1 h-1 rounded-full bg-emerald-400"
                              aria-hidden="true"
                            ></div>
                            کیفیت پخش بالاتر
                          </li>
                          <li className="flex items-center gap-2 text-xs text-gray-300">
                            <div
                              className="w-1 h-1 rounded-full bg-emerald-400"
                              aria-hidden="true"
                            ></div>
                            بدون تبلیغات
                          </li>
                        </ul>

                        <div className="w-full py-2.5 relative overflow-hidden rounded-xl group/btn bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2">
                          <span>ارتقا به نسخه پرو</span>
                          <Icon
                            d={ICONS.lightning}
                            className="w-4 h-4 text-yellow-200"
                          />
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </article>
            {/* ---------------------------------------------------------- */}
            {/* END OF PLANS SECTION */}
            {/* ---------------------------------------------------------- */}

            {/* Recent Plays (compact Spotify-like cards) */}
            <section className="mb-8" aria-label="تاریخچه پخش‌های اخیر">
              <h3 className="text-lg font-semibold text-white mb-3">
                اخیراً پخش شده
              </h3>

              <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 custom-scrollbar">
                {isFetching ? (
                  // Recently Played Skeletons
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="min-w-[260px] max-w-xs shrink-0 flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/7 animate-pulse"
                      aria-hidden="true"
                      role="status"
                    >
                      <div className="w-16 h-16 rounded-lg bg-white/10 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/10 rounded w-3/4" />
                        <div className="h-3 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                  ))
                ) : authUser?.recently_played?.items?.length ? (
                  authUser.recently_played.items.slice(0, 10).map((track) => (
                    <div
                      key={track.id}
                      className="min-w-[260px] max-w-xs shrink-0 flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/7 transition-all duration-200 overflow-hidden group"
                    >
                      <div
                        className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800 cursor-pointer"
                        onClick={() =>
                          navigateTo("song-detail", {
                            id: track.id,
                            artistSlug:
                              track.artist_unique_id ||
                              createSlug(track.artist_name || "artist"),
                            songSlug: createSlug(track.title),
                          })
                        }
                      >
                        <Image
                          src={track.cover_image || "/music-listen.webp"}
                          alt=""
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      <div className="flex-1 text-right overflow-hidden">
                        <h4
                          className="font-semibold text-sm text-white truncate cursor-pointer hover:text-emerald-400 transition-colors"
                          onClick={() =>
                            navigateTo("song-detail", {
                              id: track.id,
                              artistSlug:
                                track.artist_unique_id ||
                                createSlug(track.artist_name || "artist"),
                              songSlug: createSlug(track.title),
                            })
                          }
                        >
                          {track.title}
                        </h4>
                        <p
                          className="text-xs text-gray-400 truncate mt-1 cursor-pointer hover:text-emerald-400 transition-colors"
                          onClick={() =>
                            navigateTo("artist-detail", {
                              id: track.artist_unique_id || track.artist_id,
                              slug:
                                track.artist_unique_id ||
                                createSlug(track.artist_name || "artist"),
                            })
                          }
                        >
                          {track.artist_name}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          navigateTo("song-detail", {
                            id: track.id,
                            artistSlug:
                              track.artist_unique_id ||
                              createSlug(track.artist_name || "artist"),
                            songSlug: createSlug(track.title),
                          })
                        }
                        className="w-10 h-10 flex items-center justify-center rounded-md bg-white/6 active:scale-95 transition-all"
                        aria-label={`پخش مجدد ${track.title}`}
                      >
                        <Icon
                          d={ICONS.music}
                          className="w-5 h-5 text-emerald-400"
                        />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="w-full text-center py-8 text-gray-500 text-sm">
                    هنوز آهنگی پخش نکرده‌اید
                  </div>
                )}
              </div>
            </section>

            {/* Quick Links */}
            <nav className="space-y-3 mb-8" aria-label="لینک‌های سریع پروفایل">
              {[
                {
                  key: "settings",
                  label: "تنظیمات",
                  icon: ICONS.settings,
                  page: "settings",
                },
                {
                  key: "liked-songs",
                  label: "آهنگ‌های لایک‌شده",
                  icon: ICONS.heart,
                  page: "liked-songs",
                },
                {
                  key: "liked-albums",
                  label: "آلبوم‌های لایک‌شده",
                  icon: ICONS.music,
                  page: "liked-albums",
                },
                {
                  key: "liked-playlists",
                  label: "پلی‌لیست‌های لایک‌شده",
                  icon: ICONS.playlist,
                  page: "liked-playlists",
                },
                {
                  key: "followed-artists",
                  label: "هنرمندان دنبال‌شده",
                  icon: ICONS.users,
                  page: "followed-artists",
                },
                {
                  key: "my-playlists",
                  label: "پلی‌لیست‌های من",
                  icon: ICONS.folder,
                  page: "my-playlists",
                },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => navigateTo(item.page)}
                  className="relative w-full flex py-5 items-center gap-4 bg-linear-to-b from-white/1 to-black/20 border border-white/7 rounded-xl p-4 overflow-hidden hover:from-white/2 hover:border-emerald-500/20 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none transition-all duration-200"
                  aria-label={item.label}
                >
                  <div
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  >
                    <Icon d={ICONS.arrow} className="w-4 h-4 rotate-180" />
                  </div>
                  <div className="w-full flex items-center justify-end relative">
                    <div className="text-sm pr-10 w-fit font-medium text-white text-right flex-1 z-10">
                      {item.label}
                    </div>
                    <div
                      className="absolute right-0 p-2 bg-white/3 rounded-md z-0"
                      aria-hidden="true"
                    >
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
                className="relative w-full flex py-5 items-center gap-4 bg-gradient-to-b from-red-500/10 to-black/20 border border-red-500/30 rounded-xl p-4 overflow-hidden hover:from-red-500/20 focus-visible:ring-2 focus-visible:ring-red-500 outline-none transition-colors group"
                onClick={handleLogout}
                aria-label="خروج از حساب کاربری"
              >
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400"
                  aria-hidden="true"
                ></div>
                <div className="w-full flex items-center justify-end relative">
                  <div className="text-sm pr-10 w-fit font-medium text-red-400 text-right flex-1 z-10 group-hover:text-red-500 transition-colors">
                    خروج از حساب کاربری
                  </div>
                  <div
                    className="absolute right-0 p-2 bg-red-500/10 rounded-md z-0"
                    aria-hidden="true"
                  >
                    <Icon d={ICONS.logout} className="w-5 h-5 text-red-400" />
                  </div>
                </div>
              </button>
            </nav>
          </div>
        </div>
      </main>

      {/* Bottom Sheet */}
      <ResponsiveSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        desktopWidth="w-[480px]"
      >
        <div className="flex flex-col h-full overflow-hidden" dir="rtl">
          {/* Header - Sticky */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 flex-shrink-0 bg-black/40 backdrop-blur-md z-10">
            <h3 className="text-xl font-bold text-white">ویرایش پروفایل</h3>
            <button
              onClick={() => setIsSheetOpen(false)}
              className="p-2 bg-white/5 rounded-xl border border-white/10 hover:border-red-500/50 transition-colors"
            >
              <Icon d={ICONS.close} className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Form Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Image Management */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div
                  className={`w-28 h-28 rounded-full p-1 ${
                    isPremium
                      ? "bg-linear-to-br from-yellow-400 via-orange-500 to-red-500"
                      : "bg-linear-to-br from-emerald-400 to-blue-500"
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
                    {authUser?.image_profile?.image ? (
                      <Image
                        src={authUser.image_profile.image}
                        alt={user.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <UserIcon className="w-10 h-10 text-white/40" />
                    )}
                    {(isUploadingImage || isDeletingImage) && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
                <label
                  htmlFor="profile-image-upload"
                  className="absolute -bottom-1 -right-1 p-2 bg-emerald-500 hover:bg-emerald-600 rounded-full cursor-pointer transition-colors shadow-lg z-10"
                >
                  <Icon d={ICONS.camera} className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    id="profile-image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage || isDeletingImage}
                  />
                </label>
                {authUser?.image_profile?.image && (
                  <button
                    onClick={handleDeleteImage}
                    disabled={isUploadingImage || isDeletingImage}
                    className="absolute -bottom-1 -left-1 p-2 bg-red-500/80 hover:bg-red-600 rounded-full transition-colors shadow-lg z-10"
                    aria-label="حذف تصویر پروفایل"
                  >
                    <Icon d={ICONS.trash} className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500 mt-1">
                  حداکثر حجم مجاز: ۵۱۲ کیلوبایت
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
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
                <div key={field.key} className="relative">
                  <label
                    htmlFor={`profile-${field.key}`}
                    className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-1"
                  >
                    {field.label}
                    {field.info && (
                      <span className="relative group">
                        <button
                          type="button"
                          className="ml-1 w-4 h-4 flex items-center justify-center rounded-full border border-emerald-400 bg-[#101c1a] text-emerald-400 text-xs font-bold cursor-help transition hover:bg-emerald-500 hover:text-white focus:bg-emerald-500 focus:text-white outline-none"
                          aria-label="اطلاعات بیشتر"
                        >
                          i
                        </button>
                        <span
                          className="absolute z-50 right-0 top-7 w-56 text-xs text-right bg-[#181f1c] text-white rounded-xl shadow-lg border border-emerald-400 px-4 py-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-opacity duration-200"
                          style={{ fontFamily: "inherit" }}
                          role="tooltip"
                        >
                          برای پیدا کردن پروفایل شما در جستجو استفاده می‌شود
                        </span>
                      </span>
                    )}
                  </label>
                  <input
                    id={`profile-${field.key}`}
                    type={field.type || "text"}
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-500/50 transition-colors"
                    dir="rtl"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions - Sticky Footer */}
          <div className="flex gap-3 p-6 border-t border-white/5 flex-shrink-0 bg-black/40 backdrop-blur-md z-10">
            <button
              onClick={handleSave}
              disabled={isSaving || disableSave}
              className="flex-1 py-3 bg-linear-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
            <button
              onClick={() => setIsSheetOpen(false)}
              disabled={isSaving}
              className="px-6 py-3 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-xl hover:border-white/20 transition-colors disabled:opacity-50"
            >
              انصراف
            </button>
          </div>
        </div>
      </ResponsiveSheet>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Drawer } from "vaul";
import { useNavigation } from "./NavigationContext";
import { ResponsiveSheet } from "./ResponsiveSheet";
import { useAuth, User } from "./AuthContext";
import toast from "react-hot-toast";
import UserIcon from "./UserIcon";

// Reusable Icon Component
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

const ICONS = {
  back: "M10 19l-7-7m0 0l7-7m-7 7h18",
  chevron: "M9 5l7 7-7 7",
  bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  music:
    "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
  shield:
    "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  devices:
    "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
  settings:
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  moon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
  close: "M6 18L18 6M6 6l12 12",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  check: "M5 13l4 4L19 7",
};

// --- MODAL COMPONENTS ---

// Profile Edit Modal
const ProfileEditSheet = ({
  isOpen,
  onClose,
  formData,
  onChange,
  onSave,
  isSaving = false,
  disableSave = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    uniqueId: string;
  };
  onChange: (field: string, value: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  disableSave?: boolean;
}) => {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const content = (
    <div className="p-6 h-full flex flex-col" dir="rtl">
      {!isDesktop && (
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 flex-shrink-0 cursor-grab active:cursor-grabbing" />
      )}

      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h3 className="text-xl font-bold text-white">ویرایش پروفایل</h3>
        <button
          onClick={onClose}
          className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors"
        >
          <Icon d={ICONS.close} className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      <div className="space-y-4 mb-8 flex-1 overflow-visible hide-scrollbar">
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
            <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
              {field.label}
              {field.info && (
                <span className="relative group">
                  <span
                    tabIndex={0}
                    className="ml-1 w-4 h-4 flex items-center justify-center rounded-full border border-emerald-400 bg-[#101c1a] text-emerald-400 text-xs font-bold cursor-pointer transition hover:bg-emerald-500 hover:text-white focus:bg-emerald-500 focus:text-white"
                    aria-label="اطلاعات بیشتر"
                  >
                    i
                  </span>
                  <span
                    className="absolute z-50 right-0 top-7 w-56 text-xs text-right bg-[#181f1c] text-white rounded-xl shadow-lg border border-emerald-400 px-4 py-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-opacity duration-200"
                    style={{ fontFamily: "inherit" }}
                  >
                    برای پیدا کردن پروفایل شما در جستجو استفاده می‌شود
                  </span>
                </span>
              )}
            </label>
            <input
              type={field.type || "text"}
              value={formData[field.key as keyof typeof formData]}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.02] transition-colors"
              dir="rtl"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3 flex-shrink-0">
        <button
          onClick={onSave}
          disabled={isSaving || disableSave}
          className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:shadow-emerald-900/20 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
        <button
          onClick={onClose}
          disabled={isSaving}
          className="px-6 py-3 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          انصراف
        </button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <>
        <div
          className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-all duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={onClose}
        />
        <div
          className={`fixed z-[60] bg-gradient-to-t from-[#0a0a0a] to-[#1a1a1a] border border-white/10 transition-all duration-300 ease-out
          top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] rounded-2xl shadow-2xl shadow-black/60
          ${
            isOpen
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }
          `}
        >
          {content}
        </div>
      </>
    );
  }

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      shouldScaleBackground
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-[70] backdrop-blur-[2px]" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-[70] flex flex-col bg-gradient-to-t from-[#0a0a0a] to-[#1a1a1a] rounded-t-3xl border-t border-white/10 outline-none max-h-[96%] overflow-visible">
          {content}
          <div className="h-safe-area-inset-bottom" />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

// Quality Selector Modal
const QualitySheet = ({
  isOpen,
  onClose,
  currentQuality,
  onSelect,
  isPremium = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentQuality: string;
  onSelect: (quality: string) => void;
  isPremium?: boolean;
}) => {
  const qualities = [
    { value: "medium", label: "متوسط", description: "160 kbps - توصیه شده" },
    {
      value: "high",
      label: "بالا",
      description: "320 kbps - کیفیت عالی (مخصوص پریمیوم)",
    },
  ];

  return (
    <ResponsiveSheet
      keyboardDismiss={true}
      desktopWidth="w-[450px]"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="p-6 h-full flex flex-col" dir="rtl">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h3 className="text-xl font-bold text-white">کیفیت پخش</h3>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hidden md:block"
          >
            <Icon d={ICONS.close} className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-2 mb-6 flex-1 overflow-y-auto">
          {qualities.map((q) => {
            const locked = q.value === "high" && !isPremium;
            return (
              <div key={q.value} className="relative">
                <button
                  onClick={() => {
                    if (locked) return;
                    onSelect(q.value);
                    onClose();
                  }}
                  aria-disabled={locked}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all group ${
                    currentQuality === q.value
                      ? "bg-emerald-500/10 border-emerald-500/50 shadow-inner shadow-emerald-500/5"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  } ${locked ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="text-right flex-1">
                    <div
                      className={`font-medium transition-colors ${
                        currentQuality === q.value
                          ? "text-emerald-400"
                          : "text-white"
                      }`}
                    >
                      {q.label}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {q.description}
                    </div>
                  </div>
                  {currentQuality === q.value && (
                    <Icon
                      d={ICONS.check}
                      className="w-5 h-5 text-emerald-400"
                    />
                  )}
                </button>
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none">
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-md border border-yellow-500/30 font-medium">
                     Premium
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-xl hover:bg-white/10 transition-colors md:hidden"
        >
          بستن
        </button>
      </div>
    </ResponsiveSheet>
  );
};

// Notification Modal
const NotificationSheet = ({
  isOpen,
  onClose,
  preferences,
  onToggle,
}: {
  isOpen: boolean;
  onClose: () => void;
  preferences: Record<string, boolean>;
  onToggle: (key: string) => void;
}) => {
  const notifTypes = [
    { key: "new_song_followed_artists", label: "آهنگ جدید هنرمندان دنبال شده" },
    {
      key: "new_album_followed_artists",
      label: "آلبوم جدید هنرمندان دنبال شده",
    },
    { key: "new_likes", label: "لایک‌ها " },
    { key: "new_follower", label: "دنبال کننده جدید" },
  ];

  return (
    <ResponsiveSheet desktopWidth="w-[500px]" isOpen={isOpen} onClose={onClose}>
      <div className="p-6 h-full flex flex-col" dir="rtl">
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <h3 className="text-xl font-bold text-white">تنظیمات اعلان‌ها</h3>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hidden md:block"
          >
            <Icon d={ICONS.close} className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-6 flex-shrink-0">
          انتخاب کنید از چه رویدادهایی مطلع شوید
        </p>
        <div className="space-y-3 mb-6 flex-1 overflow-y-auto">
          {notifTypes.map((item) => (
            <div
              key={item.key}
              onClick={() => onToggle(item.key)}
              className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.07] cursor-pointer transition-colors"
            >
              <span className="text-white font-medium text-sm">
                {item.label}
              </span>
              <div
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  preferences[item.key] ? "bg-emerald-500" : "bg-white/20"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${
                    preferences[item.key] ? "left-1" : "right-1"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-900/20 flex-shrink-0"
        >
          تایید
        </button>
      </div>
    </ResponsiveSheet>
  );
};

// Devices UI removed: feature deprecated and code omitted

// Sessions Modal
const SessionsSheet = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { accessToken, formatErrorMessage, authenticatedFetch } = useAuth();
  const [sessions, setSessions] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const parsePlatform = (
    osInfo: string | null,
    ua: string | null,
    deviceType: string | null,
  ) => {
    if (osInfo) {
      // take first token like 'iOS' or 'Android' or 'Windows'
      const t = osInfo.split(/\s+/)[0];
      return t;
    }
    const u = (ua || "").toLowerCase();
    if (u.includes("android")) return "Android";
    if (u.includes("iphone") || u.includes("ipad") || u.includes("ios"))
      return "iOS";
    if (u.includes("windows")) return "Windows";
    if (u.includes("mac os") || u.includes("macintosh") || u.includes("macos"))
      return "macOS";
    if (deviceType) return deviceType;
    return "ناشناخته";
  };

  useEffect(() => {
    let mounted = true;
    const fetchSessions = async () => {
      if (!isOpen) return;
      // read refresh token from localStorage as required by the API
      if (typeof window === "undefined") return;
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        toast.error("توکن رفرش پیدا نشد؛ لطفا دوباره وارد شوید");
        return;
      }

      setLoading(true);
      try {
        const url = `https://api.sedabox.com/api/auth/sessions/?refreshToken=${encodeURIComponent(
          refreshToken,
        )}`;

        const res = await authenticatedFetch(url, { method: "GET" });
        const text = await res.text();
        const body = text ? JSON.parse(text) : null;
        if (!res.ok) {
          toast.error(formatErrorMessage(body) || "خطا در دریافت نشست‌ها");
          return;
        }
        if (mounted) setSessions(body || []);
      } catch (err: any) {
        toast.error(formatErrorMessage(err) || "خطا در دریافت نشست‌ها");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSessions();
    return () => {
      mounted = false;
    };
  }, [isOpen, accessToken]);

  const revokeSession = async (sessionId: string) => {
    if (!accessToken) {
      toast.error("برای این عمل باید وارد شوید");
      return;
    }

    setRevokingId(sessionId);
    try {
      const url = `https://api.sedabox.com/api/auth/sessions/${encodeURIComponent(
        sessionId,
      )}/revoke/`;
      const res = await authenticatedFetch(url, {
        method: "POST",
      });
      const text = await res.text();
      const body = text ? JSON.parse(text) : null;
      if (!res.ok) {
        toast.error(formatErrorMessage(body) || "خطا در لغو نشست");
        return;
      }
      toast.success("نشست با موفقیت لغو شد");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: any) {
      toast.error(formatErrorMessage(err) || "خطا در لغو نشست");
    } finally {
      setRevokingId(null);
    }
  };

  const revokeOtherSessions = async () => {
    if (!accessToken) {
      toast.error("برای این عمل باید وارد شوید");
      return;
    }

    if (typeof window === "undefined") return;
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      toast.error("توکن رفرش پیدا نشد؛ لطفا دوباره وارد شوید");
      return;
    }

    setRevokingOthers(true);
    try {
      const url = `https://api.sedabox.com/api/auth/sessions/revoke-others/`;
      const res = await authenticatedFetch(url, {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
      const text = await res.text();
      let body: any = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch (e) {
        body = text;
      }

      if (!res.ok) {
        toast.error(formatErrorMessage(body) || "خطا در لغو سایر نشست‌ها");
        return;
      }

      const revokedCount = body?.revoked_count ?? 0;
      toast.success(`تعداد ${revokedCount} نشست لغو شد`);
      // Keep only current session(s)
      setSessions((prev) => prev.filter((s) => s.is_current));
    } catch (err: any) {
      toast.error(formatErrorMessage(err) || "خطا در لغو سایر نشست‌ها");
    } finally {
      setRevokingOthers(false);
    }
  };

  const hasOtherSessions = sessions.filter((s) => !s.is_current).length > 0;

  return (
    <ResponsiveSheet desktopWidth="w-[640px]" isOpen={isOpen} onClose={onClose}>
      <div className="p-6 h-full flex flex-col" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">دستگاه‌های فعال</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={revokeOtherSessions}
              disabled={revokingOthers || !hasOtherSessions}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:bg-gray-500/10 disabled:text-gray-400 disabled:hover:bg-gray-500/10 disabled:cursor-not-allowed"
            >
              {revokingOthers ? "در حال لغو..." : "خروج از سایر دستگاه‌ها"}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hidden md:block"
            >
              <Icon d={ICONS.close} className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {loading && (
            <div className="text-sm text-gray-400">در حال بارگذاری...</div>
          )}
          {!loading && sessions.length === 0 && (
            <div className="text-sm text-gray-400">نشستی یافت نشد</div>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={`p-4 rounded-xl border transition-colors ${
                s.is_current
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : "bg-white/5 border-white/10 hover:bg-white/[0.07]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-white">
                      {s.device_name || s.user_agent || "دستگاه ناشناس"}
                    </div>
                    {s.is_current && (
                      <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30 font-medium">
                        دستگاه شما
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {parsePlatform(
                      s.os_info || null,
                      s.user_agent || null,
                      s.device_type || null,
                    )}{" "}
                    • {s.device_type || "-"}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">IP: {s.ip}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {s.created_at
                      ? new Date(s.created_at).toLocaleString("fa-IR")
                      : "-"}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-2 flex items-center">
                  {!s.is_current ? (
                    <button
                      onClick={() => revokeSession(s.id)}
                      disabled={!!revokingId}
                      className="px-3 py-1.5 text-sm rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      {revokingId === s.id ? "در حال لغو..." : "لغو دستگاه"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-xl hover:bg-white/10 transition-colors md:hidden flex-shrink-0"
        >
          بستن
        </button>
      </div>
    </ResponsiveSheet>
  );
};

// Password Change Modal
const SecuritySheet = ({
  isOpen,
  onClose,
  onChangePassword,
}: {
  isOpen: boolean;
  onClose: () => void;
  onChangePassword: (current: string, next: string) => Promise<void>;
}) => {
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error("لطفاً همه فیلدها را پر کنید");
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast.error("رمز عبور جدید و تکرار آن یکسان نیستند");
      return;
    }

    if (passwords.current === passwords.new) {
      toast.error("رمز جدید نباید با رمز فعلی یکسان باشد");
      return;
    }
    setIsSubmitting(true);
    try {
      await onChangePassword(passwords.current, passwords.new);
      setPasswords({ current: "", new: "", confirm: "" });
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "خطایی رخ داد");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveSheet desktopWidth="w-[480px]" isOpen={isOpen} onClose={onClose}>
      <div className="p-6 h-full flex flex-col" dir="rtl">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h3 className="text-xl font-bold text-white">تغییر رمز عبور</h3>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hidden md:block"
          >
            <Icon d={ICONS.close} className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4 mb-8 flex-1 overflow-y-auto">
          {[
            { key: "current", label: "رمز عبور فعلی" },
            { key: "new", label: "رمز عبور جدید" },
            { key: "confirm", label: "تکرار رمز عبور جدید" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {field.label}
              </label>
              <input
                type="password"
                value={passwords[field.key as keyof typeof passwords]}
                onChange={(e) =>
                  setPasswords((prev) => ({
                    ...prev,
                    [field.key]: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 bg-[#050505] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.02] transition-colors"
                dir="rtl"
              />
            </div>
          ))}
        </div>
        {/* artist password option removed */}
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg hover:shadow-emerald-900/20 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isSubmitting ? "در حال تغییر..." : "تغییر رمز عبور"}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-3 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            انصراف
          </button>
        </div>
      </div>
    </ResponsiveSheet>
  );
};

export default function Settings() {
  const { navigateTo, goBack } = useNavigation();
  const {
    user: authUser,
    updateProfile,
    updateStreamQuality,
    formatErrorMessage,
    accessToken,
    authenticatedFetch,
  } = useAuth();
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // User profile data
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    uniqueId: "",
  });

  const displayName =
    profileData.firstName || profileData.lastName
      ? `${profileData.firstName} ${profileData.lastName}`.trim()
      : "کاربر صداباکس";

  // Settings state
  const [audioQuality, setAudioQuality] = useState("medium");
  const [notificationPreferences, setNotificationPreferences] = useState({
    new_song_followed_artists: true,
    new_album_followed_artists: true,
    new_likes: true,
    new_follower: true,
    system_notifications: true,
  });

  useEffect(() => {
    if (authUser) {
      setProfileData({
        firstName: authUser.first_name || "",
        lastName: authUser.last_name || "",
        email: authUser.email || "",
        uniqueId: authUser.unique_id || "",
      });
      setAudioQuality(authUser.stream_quality || "medium");
      if (authUser.notification_setting) {
        setNotificationPreferences(authUser.notification_setting);
      }
    }
  }, [authUser]);

  // When opening the profile edit sheet ensure the form is initialized
  // with the latest `authUser` values so the sheet always matches profile
  useEffect(() => {
    if (activeSheet === "profile" && authUser) {
      setProfileData({
        firstName: authUser.first_name || "",
        lastName: authUser.last_name || "",
        email: authUser.email || "",
        uniqueId: authUser.unique_id || "",
      });
    }
  }, [activeSheet, authUser]);

  // Devices feature removed: related state and handlers deleted

  const handleProfileChange = (field: string, value: string) => {
    if (field === "uniqueId") {
      value = value.replace(/[^a-z0-9]/gi, "");
    }
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  // Determine if save button should be disabled (same logic as Profile)
  const allFieldsEmpty =
    !profileData.firstName &&
    !profileData.lastName &&
    !profileData.email &&
    !profileData.uniqueId;
  const bothNamesEmpty = !profileData.firstName && !profileData.lastName;
  const disableSave = allFieldsEmpty || bothNamesEmpty;

  const handleProfileSave = async () => {
    setIsSaving(true);
    const tid = toast.loading("در حال بروزرسانی پروفایل...");
    try {
      const endpoint = "https://api.sedabox.com/api/profile/";
      const body = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        unique_id: profileData.uniqueId || null,
      };
      console.log("Updating profile - endpoint:", endpoint);
      console.log("Updating profile - body:", body);
      const res: any = await updateProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        unique_id: profileData.uniqueId || null,
      } as any);
      // If updateProfile returns the updated user object, sync local state
      if (res) {
        const u = (res.user || res) as any;
        if (u) {
          setProfileData({
            firstName: u.first_name || profileData.firstName,
            lastName: u.last_name || profileData.lastName,
            email: u.email || profileData.email,
            uniqueId: u.unique_id ?? profileData.uniqueId,
          });
        }
      }
      toast.success("پروفایل با موفقیت بروزرسانی شد", { id: tid });
      setActiveSheet(null);
    } catch (err: any) {
      // Handle server validation for unique_id specially
      const body = err?.body || err;
      const uniqueErr =
        body &&
        (body.unique_id ||
          body.uniqueId ||
          (body.error && body.error.unique_id));
      if (uniqueErr) {
        // uniqueErr may be an array
        const msg = Array.isArray(uniqueErr) ? uniqueErr[0] : uniqueErr;
        const lc = String(msg).toLowerCase();
        if (
          lc.includes("unique id") ||
          lc.includes("unique_id") ||
          lc.includes("user with this unique id")
        ) {
          toast.error("شناسه منحصر به فرد قبلا استفاده شده است", { id: tid });
        } else {
          toast.error(formatErrorMessage(err), { id: tid });
        }
      } else {
        toast.error(formatErrorMessage(err), { id: tid });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleQualitySelect = async (quality: string) => {
    // Prevent non-premium users from selecting high quality
    if (quality === "high" && authUser?.plan !== "premium") {
      toast.error("کیفیت ۳۲۰ فقط برای کاربران Premium فعال است.");
      return;
    }

    const tid = toast.loading("در حال تغییر کیفیت پخش...");
    try {
      await updateStreamQuality(quality as "medium" | "high");
      toast.success("کیفیت پخش تغییر یافت", { id: tid });
      setAudioQuality(quality);
    } catch (err: any) {
      toast.error(formatErrorMessage(err), { id: tid });
    }
  };

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    if (!accessToken) {
      const msg = "برای تغییر رمز لطفا وارد شوید";
      toast.error(msg);
      throw new Error(msg);
    }

    const tid = toast.loading("در حال تغییر رمز عبور...");
    try {
      const url = `https://api.sedabox.com/api/auth/password/change/`;
      const res = await authenticatedFetch(url, {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const text = await res.text();
      let body: any = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch (e) {
        body = text;
      }

      if (res.ok) {
        // Always show Persian success text regardless of server language
        toast.success("رمز با موفقیت تغییر یافت", { id: tid });
        return;
      }

      // Prefer server-provided error codes, then use formatErrorMessage to
      // generate a Persian-friendly message.
      let errMsg = "خطا در تغییر رمز";
      if (body?.error?.code === "INVALID_PASSWORD") {
        errMsg = "رمز فعلی اشتباه است";
      } else if (body?.error || body) {
        try {
          errMsg = formatErrorMessage(body.error || body) || errMsg;
        } catch (e) {
          errMsg = body?.error?.message || body?.message || errMsg;
        }
      }
      toast.error(errMsg, { id: tid });
      throw new Error(errMsg);
    } catch (err) {
      throw err;
    }
  };

  const handleNotificationToggle = async (key: string) => {
    const newPrefs = {
      ...notificationPreferences,
      [key]:
        !notificationPreferences[key as keyof typeof notificationPreferences],
    };

    const tid = toast.loading("در حال بروزرسانی تنظیمات...");
    try {
      await updateProfile({
        notification_setting: newPrefs,
      } as any);
      toast.success("تنظیمات با موفقیت ذخیره شد", { id: tid });
      setNotificationPreferences(newPrefs);
    } catch (err: any) {
      toast.error(formatErrorMessage(err), { id: tid });
    }
  };

  const settingSections = [
    {
      id: "notifications",
      title: "اعلان‌ها",
      icon: ICONS.bell,
      description: `${
        Object.values(notificationPreferences).filter(Boolean).length
      } مورد فعال`,
      color: "from-pink-500 to-rose-500",
      onClick: () => setActiveSheet("notifications"),
    },
    {
      id: "playback",
      title: "کیفیت پخش",
      icon: ICONS.music,
      description: audioQuality === "high" ? "320 kbps" : "160 kbps",
      color: "from-emerald-500 to-teal-500",
      onClick: () => setActiveSheet("quality"),
    },
    {
      id: "security",
      title: "امنیت و رمز عبور",
      icon: ICONS.shield,
      description: "تغییر رمز عبور",
      color: "from-blue-500 to-indigo-500",
      onClick: () => setActiveSheet("security"),
    },
    {
      id: "sessions",
      title: "مدیریت دستگاه‌ها",
      icon: ICONS.devices,
      description: "مشاهده دستگاه‌های فعال",
      color: "from-yellow-500 to-orange-500",
      onClick: () => setActiveSheet("sessions"),
    },
  ];

  return (
    <div
      className="relative w-full min-h-screen bg-[#030303] text-white overflow-hidden font-sans pb-24"
      dir="rtl"
    >
      {/* Background Effects */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="fixed w-full top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto flex flex-row-reverse items-center justify-between px-4 py-4">
          <button
            onClick={() => goBack()}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-95 border border-white/5"
          >
            <Icon d={ICONS.back} className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            تنظیمات
          </h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mt-16 -mb-10 mx-auto px-4 py-8 space-y-6 relative z-10">
        {/* Account Overview Card */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/5 p-6 group hover:border-white/10 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex-shrink-0 w-16 h-16 min-w-[64px] min-h-[64px] rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 p-[2px] shadow-lg shadow-emerald-900/20">
              <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                <UserIcon className="w-8 h-8 text-white/90" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2
                className="text-lg font-bold text-white truncate overflow-hidden whitespace-nowrap"
                title={displayName}
              >
                {displayName}
              </h2>
              <p
                className="text-sm text-gray-400 truncate overflow-hidden whitespace-nowrap"
                title={profileData.email}
              >
                {profileData.email}
              </p>
              <div
                className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  authUser?.plan === "premium"
                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
              >
                {authUser?.plan === "premium" ? "حساب Premium " : "حساب رایگان"}
              </div>
            </div>
            <button
              onClick={() => setActiveSheet("profile")}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors border border-white/5 text-gray-200"
            >
              ویرایش
            </button>
          </div>
        </div>

        {/* Settings Groups */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500 px-2">عمومی</h3>
          <div className="rounded-3xl bg-[#0a0a0a] border border-white/5 overflow-hidden divide-y divide-white/5">
            {settingSections.map((section) => (
              <button
                key={section.id}
                onClick={section.onClick}
                className="w-full flex items-center gap-4 p-5 hover:bg-white/[0.03] transition-colors group relative overflow-hidden"
              >
                <div
                  className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${section.color} p-[1px] shadow-lg shadow-black/50 group-hover:scale-105 transition-transform`}
                >
                  <div className="w-full h-full rounded-2xl bg-[#111] flex items-center justify-center">
                    <Icon d={section.icon} className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="flex-1 text-right">
                  <h4 className="text-base font-medium text-white group-hover:text-emerald-400 transition-colors">
                    {section.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    {section.description}
                  </p>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <Icon
                    d={ICONS.chevron}
                    className="w-4 h-4 text-gray-400 rotate-180"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* App Info */}
        <div className="text-center pt-8 ">
          <div className="w-12 h-12 mx-auto mb-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholder for Logo */}
            <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center">
              <Icon d={ICONS.music} className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-xs text-gray-600 font-medium font-mono">
            Ver 1.0.0
          </p>
        </div>
      </div>

      {/* Modals / Sheets */}
      <ProfileEditSheet
        isOpen={activeSheet === "profile"}
        onClose={() => setActiveSheet(null)}
        formData={profileData}
        onChange={handleProfileChange}
        onSave={handleProfileSave}
        isSaving={isSaving}
        disableSave={disableSave}
      />
      <QualitySheet
        isOpen={activeSheet === "quality"}
        onClose={() => setActiveSheet(null)}
        currentQuality={audioQuality}
        onSelect={handleQualitySelect}
        isPremium={authUser?.plan === "premium"}
      />
      <NotificationSheet
        isOpen={activeSheet === "notifications"}
        onClose={() => setActiveSheet(null)}
        preferences={notificationPreferences}
        onToggle={handleNotificationToggle}
      />

      <SessionsSheet
        isOpen={activeSheet === "sessions"}
        onClose={() => setActiveSheet(null)}
      />
      <SecuritySheet
        isOpen={activeSheet === "security"}
        onClose={() => setActiveSheet(null)}
        onChangePassword={handleChangePassword}
      />
    </div>
  );
}

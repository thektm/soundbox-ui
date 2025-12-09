"use client";

import React, { useState } from "react";
import { useNavigation } from "./NavigationContext";

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

// Bottom Sheet for Profile Edit
const ProfileEditSheet = ({
  isOpen,
  onClose,
  formData,
  onChange,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  formData: { firstName: string; lastName: string; email: string };
  onChange: (field: string, value: string) => void;
  onSave: () => void;
}) => (
  <>
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    />
    <div
      className={`fixed bottom-0 left-0 right-0 z-[60] bg-gradient-to-t from-[#0a0a0a] to-[#1a1a1a] rounded-t-3xl border-t border-white/10 transition-transform duration-300 ease-out ${
        isOpen ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="p-6" dir="rtl">
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">ویرایش پروفایل</h3>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 rounded-xl border border-white/10 hover:border-red-500/50 transition-colors"
          >
            <Icon d={ICONS.close} className="w-5 h-5 text-gray-400" />
          </button>
        </div>
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
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                dir="rtl"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onSave}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all"
          >
            ذخیره تغییرات
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-xl hover:border-white/20 transition-colors"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  </>
);

// Quality Selector Sheet
const QualitySheet = ({
  isOpen,
  onClose,
  currentQuality,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentQuality: string;
  onSelect: (quality: string) => void;
}) => {
  const qualities = [
    { value: "96", label: "پایین", description: "96 kbps - مصرف داده کم" },
    { value: "160", label: "متوسط", description: "160 kbps - توصیه شده" },
    { value: "320", label: "بالا", description: "320 kbps - کیفیت بالا" },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-[60] bg-gradient-to-t from-[#0a0a0a] to-[#1a1a1a] rounded-t-3xl border-t border-white/10 transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="p-6" dir="rtl">
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-4">کیفیت پخش</h3>
          <div className="space-y-2 mb-4">
            {qualities.map((q) => (
              <button
                key={q.value}
                onClick={() => {
                  onSelect(q.value);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  currentQuality === q.value
                    ? "bg-emerald-500/10 border-emerald-500/50"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="text-right flex-1">
                  <div className="font-medium text-white">{q.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {q.description}
                  </div>
                </div>
                {currentQuality === q.value && (
                  <Icon d={ICONS.check} className="w-5 h-5 text-emerald-400" />
                )}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-xl hover:border-white/20 transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </>
  );
};

// Notification Preferences Sheet
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
    { key: "newSong", label: "آهنگ جدید هنرمندان دنبال شده" },
    { key: "newAlbum", label: "آلبوم جدید هنرمندان دنبال شده" },
    { key: "newPlaylist", label: "پلی لیست جدید" },
    { key: "likes", label: "لایک‌ها و نظرات" },
    { key: "followers", label: "دنبال کننده جدید" },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-[60] bg-gradient-to-t from-[#0a0a0a] to-[#1a1a1a] rounded-t-3xl border-t border-white/10 transition-transform duration-300 ease-out max-h-[80vh] overflow-y-auto ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="p-6" dir="rtl">
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">
            تنظیمات اعلان‌ها
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            انتخاب کنید از چه رویدادهایی مطلع شوید
          </p>
          <div className="space-y-3 mb-4">
            {notifTypes.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <span className="text-white font-medium">{item.label}</span>
                <button
                  onClick={() => onToggle(item.key)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences[item.key] ? "bg-emerald-500" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                      preferences[item.key] ? "left-0.5" : "right-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors"
          >
            تایید
          </button>
        </div>
      </div>
    </>
  );
};

// Device Management Sheet
const DevicesSheet = ({
  isOpen,
  onClose,
  devices,
  currentDeviceId,
  onLogout,
}: {
  isOpen: boolean;
  onClose: () => void;
  devices: Array<{ id: string; name: string; lastActive: string }>;
  currentDeviceId: string;
  onLogout: (deviceId: string) => void;
}) => (
  <>
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    />
    <div
      className={`fixed bottom-0 left-0 right-0 z-[60] bg-gradient-to-t from-[#0a0a0a] to-[#1a1a1a] rounded-t-3xl border-t border-white/10 transition-transform duration-300 ease-out max-h-[80vh] overflow-y-auto ${
        isOpen ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="p-6" dir="rtl">
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
        <h3 className="text-xl font-bold text-white mb-2">دستگاه‌های متصل</h3>
        <p className="text-sm text-gray-400 mb-6">
          شناسه دستگاه فعلی:{" "}
          <span className="font-mono text-emerald-400">{currentDeviceId}</span>
        </p>
        <div className="space-y-3 mb-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className={`p-4 rounded-xl border ${
                device.id === currentDeviceId
                  ? "bg-emerald-500/10 border-emerald-500/50"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-white">{device.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {device.lastActive}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono mt-1">
                    ID: {device.id}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {device.id === currentDeviceId && (
                    <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">
                      فعلی
                    </span>
                  )}
                  <button
                    onClick={() => onLogout(device.id)}
                    disabled={device.id === currentDeviceId}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      device.id === currentDeviceId
                        ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                        : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                    }`}
                  >
                    خروج
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-xl hover:border-white/20 transition-colors"
        >
          بستن
        </button>
      </div>
    </div>
  </>
);

// Password Change Sheet
const SecuritySheet = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleSave = () => {
    if (passwords.new !== passwords.confirm) {
      alert("رمز عبور جدید و تکرار آن یکسان نیستند");
      return;
    }
    alert("رمز عبور با موفقیت تغییر کرد");
    setPasswords({ current: "", new: "", confirm: "" });
    onClose();
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-[60] bg-gradient-to-t from-[#0a0a0a] to-[#1a1a1a] rounded-t-3xl border-t border-white/10 transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="p-6" dir="rtl">
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-4">تغییر رمز عبور</h3>
          <div className="space-y-4 mb-6">
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                  dir="rtl"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all"
            >
              تغییر رمز عبور
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-xl hover:border-white/20 transition-colors"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default function Settings() {
  const { navigateTo, goBack } = useNavigation();
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  // User profile data
  const [profileData, setProfileData] = useState({
    firstName: "علی",
    lastName: "رضایی",
    email: "ali.rezaei@example.com",
  });

  // Settings state
  const [audioQuality, setAudioQuality] = useState("160");
  const [notificationPreferences, setNotificationPreferences] = useState({
    newSong: true,
    newAlbum: true,
    newPlaylist: false,
    likes: true,
    followers: true,
  });

  // Mock device data
  const currentDeviceId = "DEV-7A8B9C0D-4E5F";
  const [devices, setDevices] = useState([
    {
      id: currentDeviceId,
      name: "گوشی شخصی (اندروید)",
      lastActive: "اکنون",
    },
    {
      id: "DEV-1A2B3C4D-5E6F",
      name: "لپ‌تاپ شخصی",
      lastActive: "2 روز پیش",
    },
    {
      id: "DEV-9G8H7I6J-5K4L",
      name: "تبلت",
      lastActive: "1 هفته پیش",
    },
  ]);

  const removeDevice = (deviceId: string) => {
    if (deviceId === currentDeviceId) {
      alert("نمی‌توان از دستگاه فعلی خارج شد");
      return;
    }
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    alert("دستگاه با موفقیت خارج شد");
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileSave = () => {
    alert("پروفایل با موفقیت بروزرسانی شد");
    setActiveSheet(null);
  };

  const handleNotificationToggle = (key: string) => {
    setNotificationPreferences((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
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
      description: `${audioQuality} kbps`,
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
      id: "devices",
      title: "مدیریت دستگاه‌ها",
      icon: ICONS.devices,
      description: `${devices.length} دستگاه متصل`,
      color: "from-purple-500 to-violet-500",
      onClick: () => setActiveSheet("devices"),
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
        <div className="flex flex-row-reverse items-center justify-between px-4 py-4">
          <button
            onClick={() => goBack()}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-95"
          >
            <Icon d={ICONS.back} className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            تنظیمات
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mt-16 -mb-10 mx-auto px-4 py-8 space-y-6 relative z-10">
        {/* Account Overview Card */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/5 p-6 group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex-shrink-0 w-16 h-16 min-w-[64px] min-h-[64px] rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                <span className="text-lg sm:text-xl font-bold leading-none select-none">
                  {profileData.firstName[0]}
                  {profileData.lastName[0]}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2
                className="text-lg font-bold text-white truncate overflow-hidden whitespace-nowrap max-w-[180px] sm:max-w-[260px]"
                title={`${profileData.firstName} ${profileData.lastName}`}
              >
                {profileData.firstName} {profileData.lastName}
              </h2>
              <p
                className="text-sm text-gray-400 truncate overflow-hidden whitespace-nowrap max-w-[220px] sm:max-w-[320px]"
                title={profileData.email}
              >
                {profileData.email}
              </p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                حساب رایگان
              </div>
            </div>
            <button
              onClick={() => setActiveSheet("profile")}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors border border-white/5"
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
                className="w-full flex items-center gap-4 p-5 hover:bg-white/[0.02] transition-colors group relative overflow-hidden"
              >
                <div
                  className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${section.color} p-[1px] shadow-lg shadow-black/50`}
                >
                  <div className="w-full h-full rounded-2xl bg-[#111] flex items-center justify-center">
                    <Icon d={section.icon} className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="flex-1 text-right">
                  <h4 className="text-base font-medium text-white group-hover:text-emerald-400 transition-colors">
                    {section.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
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
            <img
              src="/logo.png"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-xs text-gray-600 font-medium">نسخه 1.0.0</p>
        </div>
      </div>

      {/* Bottom Sheets */}
      <ProfileEditSheet
        isOpen={activeSheet === "profile"}
        onClose={() => setActiveSheet(null)}
        formData={profileData}
        onChange={handleProfileChange}
        onSave={handleProfileSave}
      />
      <QualitySheet
        isOpen={activeSheet === "quality"}
        onClose={() => setActiveSheet(null)}
        currentQuality={audioQuality}
        onSelect={setAudioQuality}
      />
      <NotificationSheet
        isOpen={activeSheet === "notifications"}
        onClose={() => setActiveSheet(null)}
        preferences={notificationPreferences}
        onToggle={handleNotificationToggle}
      />
      <DevicesSheet
        isOpen={activeSheet === "devices"}
        onClose={() => setActiveSheet(null)}
        devices={devices}
        currentDeviceId={currentDeviceId}
        onLogout={removeDevice}
      />
      <SecuritySheet
        isOpen={activeSheet === "security"}
        onClose={() => setActiveSheet(null)}
      />
    </div>
  );
}

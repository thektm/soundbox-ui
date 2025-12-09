"use client";

import React, { useState, useEffect } from "react";
import { useNavigation } from "./NavigationContext";

// Reusable SVG Icon component
const Icon = ({
  d,
  className = "w-5 h-5",
  fill = "none",
}: {
  d: string;
  className?: string;
  fill?: string;
}) => (
  <svg
    className={className}
    fill={fill}
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

// Icon paths
const ICONS = {
  back: "M10 19l-7-7m0 0l7-7m-7 7h18",
  check: "M5 13l4 4L19 7",
  close: "M6 18L18 6M6 6l12 12",
  crown:
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  lightning: "M13 10V3L4 14h7v7l9-11h-7z",
  music:
    "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
  download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  noAds:
    "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
  headphones:
    "M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z",
  sparkles:
    "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  infinity:
    "M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.356-8-5.096 0-5.096 8 0 8 5.223 0 7.261-8 12.356-8z",
  users:
    "M17 20h5v-2a4 4 0 00-3-3.874M9 20H4v-2a4 4 0 013-3.874M12 12a4 4 0 100-8 4 4 0 000 8z",
  shuffle: "M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5",
  repeat:
    "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
};

// Feature type
interface Feature {
  icon: string;
  label: string;
  free: boolean | string;
  premium: boolean | string;
}

// Features comparison data
const FEATURES: Feature[] = [
  { icon: ICONS.music, label: "پخش آنلاین موسیقی", free: true, premium: true },
  {
    icon: ICONS.headphones,
    label: "کیفیت پخش",
    free: "128 kbps",
    premium: "320 kbps",
  },
  { icon: ICONS.noAds, label: "بدون تبلیغات", free: false, premium: true },
  {
    icon: ICONS.sparkles,
    label: "امکانات انحصاری",
    free: false,
    premium: true,
  },
];

// Plan card props
interface PlanCardProps {
  title: string;
  subtitle: string;
  price: string;
  period: string;
  features: { icon: string; label: string; value: boolean | string }[];
  isPremium: boolean;
  isCurrentPlan: boolean;
  onSelect: () => void;
  popular?: boolean;
}

// Plan Card Component
const PlanCard: React.FC<PlanCardProps> = ({
  title,
  subtitle,
  price,
  period,
  features,
  isPremium,
  isCurrentPlan,
  onSelect,
  popular,
}) => {
  return (
    <div
      className={`relative flex flex-col h-full rounded-3xl overflow-hidden transition-all duration-500 ${
        isPremium
          ? "bg-gradient-to-br from-[#0d1f17] via-[#0a1a12] to-[#061210] border-2 border-emerald-500/30 shadow-[0_0_60px_-15px_rgba(16,185,129,0.3)]"
          : "bg-gradient-to-br from-[#111111] via-[#0a0a0a] to-[#050505] border border-white/10"
      }`}
    >
      {/* Popular Badge */}
      {popular && (
        <div className="absolute top-0 left-0 right-0 flex justify-center">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-b-xl shadow-lg">
            <span className="flex items-center gap-1.5">
              <Icon d={ICONS.sparkles} className="w-3.5 h-3.5" />
              محبوب‌ترین
            </span>
          </div>
        </div>
      )}

      {/* Decorative Elements */}
      {isPremium && (
        <>
          <div className="absolute top-[-50%] right-[-30%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-30%] left-[-20%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
        </>
      )}

      {/* Header */}
      <div className={`relative z-10 p-6 lg:p-8 ${popular ? "pt-10" : ""}`}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`p-2.5 rounded-xl ${
              isPremium
                ? "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30"
                : "bg-white/5 border border-white/10"
            }`}
          >
            <Icon
              d={isPremium ? ICONS.crown : ICONS.users}
              className={`w-5 h-5 ${
                isPremium ? "text-emerald-400" : "text-gray-400"
              }`}
              fill={isPremium ? "currentColor" : "none"}
            />
          </div>
          <div>
            <h3
              className={`text-xl font-bold ${
                isPremium ? "text-white" : "text-gray-200"
              }`}
            >
              {title}
            </h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-4xl lg:text-5xl font-black tracking-tight ${
                isPremium
                  ? "bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 bg-clip-text text-transparent"
                  : "text-gray-300"
              }`}
            >
              {price}
            </span>
            <span className="text-sm text-gray-500">{period}</span>
          </div>
          {isPremium && (
            <p className="text-xs text-emerald-400/70 mt-2 flex items-center gap-1">
              <Icon d={ICONS.sparkles} className="w-3 h-3" />7 روز رایگان برای
              شروع
            </p>
          )}
        </div>

        {/* CTA Button */}
        <button
          onClick={onSelect}
          disabled={isCurrentPlan}
          className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 relative overflow-hidden group ${
            isCurrentPlan
              ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/10"
              : isPremium
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.98]"
              : "bg-white/10 text-white border border-white/20 hover:bg-white/15 hover:border-white/30 active:scale-[0.98]"
          }`}
        >
          {!isCurrentPlan && isPremium && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
            </>
          )}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isCurrentPlan ? (
              "پلن فعلی شما"
            ) : isPremium ? (
              <>
                ارتقا به پریمیوم
                <Icon d={ICONS.lightning} className="w-4 h-4" />
              </>
            ) : (
              "انتخاب پلن رایگان"
            )}
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="mx-6 lg:mx-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Features List */}
      <div className="relative z-10 p-6 lg:p-8 flex-1">
        <p className="text-xs text-gray-500 mb-4 font-medium">
          امکانات این پلن:
        </p>
        <ul className="space-y-3.5">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  feature.value === false
                    ? "bg-red-500/10 border border-red-500/20"
                    : isPremium
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                {feature.value === false ? (
                  <Icon d={ICONS.close} className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Icon
                    d={feature.icon}
                    className={`w-3.5 h-3.5 ${
                      isPremium ? "text-emerald-400" : "text-gray-400"
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span
                  className={`text-sm ${
                    feature.value === false ? "text-gray-500" : "text-gray-300"
                  }`}
                >
                  {feature.label}
                </span>
                {typeof feature.value === "string" && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md ${
                      isPremium
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-white/10 text-gray-400 border border-white/10"
                    }`}
                  >
                    {feature.value}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Main Component
interface UpgradePlansProps {
  currentPlan?: "free" | "premium";
  onUpgrade?: () => void;
}

export default function UpgradePlans({
  currentPlan = "free",
  onUpgrade,
}: UpgradePlansProps) {
  const { navigateTo, goBack } = useNavigation();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectPremium = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigateTo("payment-processing");
    }
  };

  const handleSelectFree = () => {
    goBack();
  };

  // Prepare features for each plan
  const freeFeatures = FEATURES.map((f) => ({
    icon: f.icon,
    label: f.label,
    value: f.free,
  }));

  const premiumFeatures = FEATURES.map((f) => ({
    icon: f.icon,
    label: f.label,
    value: f.premium,
  }));

  return (
    <div
      className="relative w-full h-fit bg-[#030303] text-white overflow-visible font-sans"
      dir="rtl"
    >
      {/* Noise Texture */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-40 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] bg-purple-900/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#030303]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10">
              <img
                src="/logo.png"
                alt="SedaBox Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">انتخاب پلن</h1>
              <p className="text-xs text-gray-500">
                بهترین تجربه موسیقی را انتخاب کنید
              </p>
            </div>
          </div>
          <button
            onClick={goBack}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-105 border border-white/10"
          >
            <Icon d={ICONS.back} className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-16 overflow-visible">
        {/* Hero Section */}
        <div
          className={`text-center mb-12 lg:mb-16 transition-all duration-700 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Icon d={ICONS.sparkles} className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">
              7 روز رایگان پریمیوم
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
            موسیقی بدون مرز
          </h2>
          <p className="text-gray-400 text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            با ارتقا به پلن پریمیوم، تجربه‌ای بی‌نظیر از گوش دادن به موسیقی را
            با کیفیت عالی و بدون هیچ محدودیتی داشته باشید
          </p>
        </div>

        {/* Plans Grid */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto transition-all duration-700 delay-200 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Free Plan */}
          <PlanCard
            title="رایگان"
            subtitle="برای شروع"
            price="رایگان"
            period=""
            features={freeFeatures}
            isPremium={false}
            isCurrentPlan={currentPlan === "free"}
            onSelect={handleSelectFree}
          />

          {/* Premium Plan */}
          <PlanCard
            title="پریمیوم"
            subtitle="تجربه کامل"
            price="۴۹,۰۰۰"
            period="تومان / ماه"
            features={premiumFeatures}
            isPremium={true}
            isCurrentPlan={currentPlan === "premium"}
            onSelect={handleSelectPremium}
            popular={true}
          />
        </div>

        {/* Trust Badges */}
        <div
          className={`mt-12 lg:mt-16 flex flex-wrap items-center justify-center gap-6 lg:gap-10 transition-all duration-700 delay-400 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {[
            { label: "پرداخت امن", icon: "🔒" },
            { label: "پشتیبانی ۲۴/۷", icon: "💬" },
          ].map((badge, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-gray-500 text-sm"
            >
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Safe Area */}
      <div className="h-24" />
    </div>
  );
}

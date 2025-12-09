"use client";

import React, { useState, useEffect } from "react";
import { useNavigation } from "./NavigationContext";

// Confetti particle
interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotationSpeed: number;
}

// Confetti component
const Confetti = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors = [
      "#10b981", // emerald
      "#34d399",
      "#6ee7b7",
      "#fbbf24", // amber
      "#f59e0b",
      "#3b82f6", // blue
      "#8b5cf6", // violet
      "#ec4899", // pink
    ];

    const newParticles: Particle[] = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 4 + Math.random() * 8,
      speedX: -2 + Math.random() * 4,
      speedY: 2 + Math.random() * 4,
      rotationSpeed: -10 + Math.random() * 20,
    }));

    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-[fall_3s_ease-out_forwards]"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size * 0.6,
            backgroundColor: particle.color,
            borderRadius: "2px",
            transform: `rotate(${particle.rotation}deg)`,
            animationDelay: `${Math.random() * 0.5}s`,
            ["--speed-x" as any]: `${particle.speedX}vw`,
            ["--speed-y" as any]: `${particle.speedY}vh`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(var(--speed-x, 0))
              rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Success checkmark animation
const SuccessCheckmark = () => {
  return (
    <div className="relative w-32 h-32">
      {/* Outer glow rings */}
      <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
      <div
        className="absolute inset-2 rounded-full bg-emerald-500/15 animate-ping"
        style={{ animationDelay: "0.2s" }}
      />

      {/* Main circle */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 shadow-[0_0_60px_rgba(16,185,129,0.5)] flex items-center justify-center">
        {/* Checkmark */}
        <svg
          className="w-16 h-16 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
            className="animate-[draw_0.5s_ease-out_0.3s_forwards]"
            style={{
              strokeDasharray: 30,
              strokeDashoffset: 30,
            }}
          />
        </svg>
      </div>

      {/* Sparkles around */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <div
          key={angle}
          className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-[sparkle_1s_ease-out_forwards]"
          style={{
            top: "50%",
            left: "50%",
            transformOrigin: "center",
            animationDelay: `${0.5 + i * 0.05}s`,
            ["--angle" as any]: `${angle}deg`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes sparkle {
          0% {
            transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0)
              scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--angle))
              translateY(-80px) scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Countdown ring
const CountdownRing = ({ seconds }: { seconds: number }) => {
  const circumference = 2 * Math.PI * 18;

  return (
    <div className="relative w-10 h-10">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - seconds / 3)}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
        {seconds}
      </span>
    </div>
  );
};

// Icon component
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
  crown:
    "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  music:
    "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
  headphones:
    "M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z",
  download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  noAds:
    "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
};

interface PaymentSuccessProps {
  onComplete?: () => void;
}

export default function PaymentSuccess({ onComplete }: PaymentSuccessProps) {
  const { navigateTo } = useNavigation();
  const [countdown, setCountdown] = useState(3);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content after a brief delay for dramatic effect
    const contentTimer = setTimeout(() => setShowContent(true), 100);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Navigate to profile with premium status
          if (onComplete) {
            onComplete();
          } else {
            navigateTo("profile", { planUpgraded: true });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(contentTimer);
      clearInterval(countdownInterval);
    };
  }, [navigateTo, onComplete]);

  return (
    <div
      className="relative w-full min-h-screen bg-[#030303] text-white overflow-hidden font-sans flex flex-col items-center justify-center"
      dir="rtl"
    >
      {/* Confetti */}
      <Confetti />

      {/* Noise Texture */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-40 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Animated Background */}
      <div className="absolute top-[-40%] left-[-20%] w-[800px] h-[800px] bg-emerald-900/15 rounded-full blur-[200px] pointer-events-none animate-pulse" />
      <div
        className="absolute bottom-[-40%] right-[-20%] w-[600px] h-[600px] bg-emerald-800/10 rounded-full blur-[150px] pointer-events-none animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />

      {/* Main Content */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto transition-all duration-700 ${
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Success Icon */}
        <div className="mb-10">
          <SuccessCheckmark />
        </div>

        {/* Success Text */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            پرداخت موفق!
          </h1>
          <p className="text-gray-400 text-base leading-relaxed">
            تبریک! حساب شما با موفقیت به پلن پریمیوم ارتقا یافت
          </p>
        </div>

        {/* Premium Badge */}
        <div className="mb-8 px-6 py-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/15 to-emerald-700/10 border border-emerald-500/30 shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <svg
                className="w-7 h-7 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d={ICONS.crown} />
              </svg>
            </div>
            <div>
              <p className="text-xs text-emerald-400/70 mb-0.5">وضعیت جدید</p>
              <h3 className="text-xl font-bold text-white">کاربر پریمیوم</h3>
            </div>
          </div>
        </div>

        {/* Features Unlocked */}
        <div className="w-full mb-8">
          <p className="text-xs text-gray-500 mb-4 text-center">
            امکانات فعال شده:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: ICONS.headphones, label: "کیفیت ۳۲۰ kbps" },
              { icon: ICONS.download, label: "دانلود نامحدود" },
              { icon: ICONS.noAds, label: "بدون تبلیغات" },
              { icon: ICONS.music, label: "پخش آفلاین" },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Icon d={feature.icon} className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-xs text-gray-300">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Receipt Summary */}
        <div className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 mb-8">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
            <span className="text-gray-400 text-sm">شماره تراکنش</span>
            <span className="text-white font-mono text-sm">
              SB-2024-{Math.random().toString(36).substr(2, 8).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">پلن خریداری شده</span>
            <span className="text-emerald-400 font-medium text-sm">
              پریمیوم ماهانه
            </span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">مبلغ پرداختی</span>
            <span className="text-white font-bold">۴۹,۰۰۰ تومان</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">تاریخ انقضا</span>
            <span className="text-gray-300 text-sm">
              {new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toLocaleDateString("fa-IR")}
            </span>
          </div>
        </div>

        {/* Auto Redirect */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <CountdownRing seconds={countdown} />
          <div>
            <p className="text-white text-sm font-medium">
              بازگشت خودکار به پروفایل
            </p>
            <p className="text-emerald-400/70 text-xs">در حال انتقال...</p>
          </div>
        </div>

        {/* Manual Navigate Button */}
        <button
          onClick={() => navigateTo("profile", { planUpgraded: true })}
          className="mt-6 text-emerald-400 hover:text-emerald-300 text-sm underline underline-offset-4 transition-colors"
        >
          رفتن به پروفایل
        </button>
      </div>
    </div>
  );
}

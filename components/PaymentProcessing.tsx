"use client";

import React, { useState, useEffect } from "react";
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

const ICONS = {
  lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  shield:
    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  creditCard:
    "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  loading:
    "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
};

// Animated dots for loading
const LoadingDots = () => {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
};

// Animated ring loader
const RingLoader = ({ progress }: { progress: number }) => {
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-36 h-36">
      {/* Background ring */}
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        {/* Progress ring */}
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

// Processing steps
const STEPS = [
  { id: 1, label: "اتصال به درگاه پرداخت", duration: 2000 },
  { id: 2, label: "تأیید اطلاعات کارت", duration: 3000 },
  { id: 3, label: "پردازش تراکنش", duration: 3000 },
  { id: 4, label: "نهایی‌سازی پرداخت", duration: 2000 },
];

export default function PaymentProcessing() {
  const { navigateTo } = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Total duration: 10 seconds
    const totalDuration = 10000;
    const startTime = Date.now();

    // Progress timer
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(progressInterval);
        setIsComplete(true);
        // Navigate to success page after completion
        setTimeout(() => {
          navigateTo("payment-success");
        }, 500);
      }
    }, 50);

    // Step transitions
    let stepTime = 0;
    STEPS.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index);
      }, stepTime);
      stepTime += step.duration;
    });

    return () => {
      clearInterval(progressInterval);
    };
  }, [navigateTo]);

  return (
    <div
      className="relative w-full min-h-screen bg-[#030303] text-white overflow-hidden font-sans flex flex-col items-center justify-center"
      dir="rtl"
    >
      {/* Noise Texture */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-40 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Animated Background Orbs */}
      <div className="absolute top-[-30%] left-[-20%] w-[600px] h-[600px] bg-emerald-900/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div
        className="absolute bottom-[-30%] right-[-20%] w-[500px] h-[500px] bg-blue-900/8 rounded-full blur-[120px] pointer-events-none animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-[20%] right-[30%] w-[300px] h-[300px] bg-purple-900/5 rounded-full blur-[100px] pointer-events-none animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto">
        {/* Loader */}
        <div className="mb-6">
          <RingLoader progress={progress} />
        </div>

        {/* Status Text */}
        <div className="text-center">
          <p className="text-white text-lg font-medium">
            بر فرض پرداخت در شاپرک
          </p>
        </div>
      </div>
    </div>
  );
}

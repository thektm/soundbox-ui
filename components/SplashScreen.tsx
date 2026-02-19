import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";

const SplashScreen: React.FC = () => {
  const { isInitializing } = useAuth();
  const { isResolving } = useNavigation();
  const isActive = isInitializing || isResolving;

  const [visible, setVisible] = useState<boolean>(isActive);
  const [fading, setFading] = useState<boolean>(false);

  useEffect(() => {
    if (isActive) {
      // show immediately when app needs resolving/auth
      setFading(false);
      setVisible(true);
    } else if (visible) {
      // start fade-out then hide
      setFading(true);
      const t = setTimeout(() => setVisible(false), 220);
      return () => clearTimeout(t);
    }
  }, [isActive]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-60 flex items-center justify-center transition-opacity duration-400 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ background: "#060606" }}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="w-[260px] h-auto select-none">
          <Image
            src="/logo-text.png"
            alt="logo"
            width={260}
            height={64}
            priority
            className="w-full h-auto object-contain"
          />
        </div>

        <div className="flex items-center gap-2 mt-1 dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>

        <style jsx>{`
          .dots .dot {
            width: 10px;
            height: 10px;
            background: #9ca3af; /* gray-400 */
            border-radius: 9999px;
            display: inline-block;
            animation: splash-dot 900ms infinite ease-in-out;
          }

          /* ensure each dot animates with a small stagger */
          .dots .dot:nth-child(1) {
            animation-delay: 0ms;
          }
          .dots .dot:nth-child(2) {
            animation-delay: 160ms;
          }
          .dots .dot:nth-child(3) {
            animation-delay: 320ms;
          }

          @keyframes splash-dot {
            0% {
              transform: translateY(0);
              opacity: 0.8;
            }
            30% {
              transform: translateY(-8px);
              opacity: 1;
            }
            60% {
              transform: translateY(0);
              opacity: 0.85;
            }
            100% {
              transform: translateY(0);
              opacity: 0.8;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default SplashScreen;

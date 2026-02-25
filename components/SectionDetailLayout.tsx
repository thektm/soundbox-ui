"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigation } from "./NavigationContext";
import Image from "next/image";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  showLogo?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  backgroundImage,
  showLogo = true,
}) => {
  return (
    <div className="relative h-[338px] sm:h-[405px] w-full overflow-hidden">
      {/* Background Image with Overlay */}
      {backgroundImage ? (
        <div className="absolute inset-0">
          <Image
            src={backgroundImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-[#0a0a0a]" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-[#0a0a0a]" />
      )}

      {/* Content */}
      <div
        className="absolute inset-0 flex flex-col p-6 pt-12 sm:p-10 justify-end"
        style={{ direction: "rtl" }}
      >
        {/* Text */}
        <div className="space-y-1">
          {subtitle && (
            <p className="text-emerald-400 font-bold text-sm sm:text-base uppercase tracking-widest animate-fade-in">
              {subtitle}
            </p>
          )}
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight drop-shadow-2xl">
            {title}
          </h1>
        </div>
      </div>
    </div>
  );
};

interface SectionDetailLayoutProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  children: React.ReactNode;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  hideScrollbar?: boolean;
}

const SectionDetailLayout: React.FC<SectionDetailLayoutProps> = ({
  title,
  subtitle,
  backgroundImage,
  children,
  onLoadMore,
  hasMore,
  isLoading,
  hideScrollbar = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { registerScrollContainer, restoreScroll, goBack } = useNavigation();

  useEffect(() => {
    if (containerRef.current) {
      registerScrollContainer(containerRef.current);
      // Ensure we restore scroll position for this page/overlay
      restoreScroll();
    }
    return () => registerScrollContainer(null);
  }, [registerScrollContainer, restoreScroll]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !onLoadMore || !hasMore || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Load more when 200px from bottom
    if (scrollHeight - scrollTop - clientHeight < 200) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoading]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`fixed inset-0 overflow-y-auto bg-[#0a0a0a] text-white ${hideScrollbar ? "no-scrollbar" : "custom-scrollbar"}`}
      style={{ zIndex: 40 }}
    >
      {/* Top Bar (overlays header image) */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-md border-b border-white/10">
        <div
          className="flex justify-between items-center px-6 py-3"
          style={{ direction: "rtl" }}
        >
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-black tracking-tighter text-white">
              صداباکس
            </span>
          </div>

          <button
            onClick={goBack}
            className="p-2 rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      <PageHeader
        title={title}
        subtitle={subtitle}
        backgroundImage={backgroundImage}
      />

      <div className="px-4 py-8 pt-16 sm:px-10 max-w-7xl mx-auto">
        {children}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Spacer for player */}
      <div className="h-32" />
    </div>
  );
};

export default SectionDetailLayout;

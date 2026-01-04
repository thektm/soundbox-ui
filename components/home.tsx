import Image from "next/image";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useNavigation } from "./NavigationContext";
import { usePlayer } from "./PlayerContext";
import {
  MOCK_ARTISTS,
  MOCK_SONGS,
  MOCK_ALBUMS,
  createSlug,
  Song,
} from "./mockData";
import type { Track } from "./PlayerContext";

// Utility function to convert Song to Track
const songToTrack = (song: Song): Track => ({
  id: song.id,
  title: song.title,
  artist: song.artist,
  image: song.image,
  duration: song.duration,
  src: song.src || "/music.mp3",
});

// Inline SVG icons
const Bell = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Play = ({ className, fill }: { className?: string; fill?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill={fill || "none"}
    stroke="currentColor"
    strokeWidth={2}
  >
    <polygon
      points="5 3 19 12 5 21 5 3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MoreHorizontal = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

type ItemType = {
  id: number | string;
  title: string;
  subtitle: string;
  img: string;
  duration?: string;
  isNew: boolean;
};

const generateItems = (
  count: number,
  type: "square" | "artist" = "square",
  withNewBadge: boolean = false,
  seedPrefix: string = ""
): ItemType[] =>
  Array.from({ length: count }).map((_, i) => ({
    id: i,
    title: type === "artist" ? `هنرمند ${i + 1}` : `عنوان ${i + 1}`,
    subtitle: type === "artist" ? "هنرمند" : `توضیحات برای آیتم ${i + 1}`,
    img: `https://picsum.photos/seed/${seedPrefix}-${type}-${i}/300/300`,
    isNew: withNewBadge ? i % 2 === 0 : false,
  }));

const createMockTrack = (item: ItemType) => ({
  id: String(item.id),
  title: item.title,
  artist: item.subtitle,
  image: item.img,
  duration: item.duration || "3:45",
  src: "/music.mp3",
});

const createTracksFromItems = (items: ItemType[]) =>
  items.map((item) => createMockTrack(item));


export default function Home() {
  const { logout } = useAuth();
  const { setCurrentPage, navigateTo } = useNavigation();
  const { playTrack, setQueue } = usePlayer();

  const [showBrandText, setShowBrandText] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      text: "شما یک دنبال‌کننده جدید دارید",
      time: "2 دقیقه پیش",
      checked: false,
      removing: false,
    },
    {
      id: 2,
      text: "پخش تازه‌ای منتشر شد",
      time: "10 دقیقه پیش",
      checked: false,
      removing: false,
    },
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const isInitialMount = useRef(true);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const navRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const sectionTitles = [
    "برای شما",
    "جدیدترین ریلیز ها ",
    "هنرمندان محبوب",
    "آلبوم‌های محبوب",
    "10 برتر هفته",
    "اکتشافات جدید",
    "10 برتر هیپ‌هاپ",
    "لیست‌های پخش جدید برای شما",
  ];

  const handleLogout = () => {
    logout();
    setCurrentPage("login");
  };

  const handlePlaySong = (song: Song, allSongs: Song[]) => {
    const tracks = allSongs.map(songToTrack);
    const startIndex = allSongs.findIndex((s) => s.id === song.id);
    setQueue(tracks, startIndex >= 0 ? startIndex : 0);
  };

  // Simplified data for sections
  const sectionData = {
    forYou: MOCK_SONGS.slice(0, 6).map((song) => ({
      id: song.id,
      title: song.title,
      subtitle: song.artist,
      img: song.image,
      duration: song.duration,
      isNew: false,
    })),
    hottestDrops: MOCK_SONGS.slice(6, 11).map((song) => ({
      id: song.id,
      title: song.title,
      subtitle: song.artist,
      img: song.image,
      duration: song.duration,
      isNew: true,
    })),
    popularArtists: MOCK_ARTISTS.map((artist) => ({
      id: artist.id,
      title: artist.name,
      subtitle: "Artist",
      img: artist.image,
      isNew: false,
    })),
    popularAlbums: MOCK_ALBUMS.slice(0, 6).map((album) => ({
      id: album.id,
      title: album.title,
      subtitle: album.artist,
      img: album.image,
      isNew: false,
    })),
    top10Week: MOCK_SONGS.slice(12, 22).map((song, index) => ({
      id: song.id,
      title: song.title,
      subtitle: song.artist,
      img: song.image,
      duration: song.duration,
      isNew: index < 3,
    })),
    newDiscoveries: MOCK_SONGS.slice(0, 6).map((song) => ({
      id: song.id,
      title: song.title,
      subtitle: song.artist,
      img: song.image,
      duration: song.duration,
      isNew: false,
    })),
    top10HipHop: MOCK_SONGS.slice(6, 16).map((song, index) => ({
      id: song.id,
      title: song.title,
      subtitle: song.artist,
      img: song.image,
      duration: song.duration,
      isNew: index < 3,
    })),
    newPlaylists: generateItems(6, "square", false, "section7"),
  };

  useEffect(() => {
    const delay = isInitialMount.current ? 2700 : 700;
    const timer = setTimeout(() => {
      setShowBrandText(false);
      isInitialMount.current = false;
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"));
            setActiveIndex(idx);
          }
        });
      },
      { rootMargin: "-100px 0px -40% 0px", threshold: 0.4 }
    );
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (nav) {
      const activeBtn = nav.querySelector(
        `[data-index="${activeIndex}"]`
      ) as HTMLElement;
      activeBtn?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        showNotifications &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showNotifications]);

  return (
    <div
      dir="rtl"
      className="relative bg-transparent text-white font-sans pb-24 md:pb-4 md:min-h-screen selection:bg-green-500 selection:text-black"
      style={{ minHeight: "calc(var(--vh, 1vh) * 100)" }}
    >
      {/* Background gradients - adjusted for responsive */}
      <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-900/40 to-transparent pointer-events-none z-0 md:rounded-t-lg" />
      <div className="absolute top-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

      {/* Mobile Header - only visible on mobile */}
      <header className="md:hidden sticky top-0 z-50 px-4 pt-4 pb-2 bg-black/90  transition-all duration-300">
        <div className="flex flex-row-reverse items-center justify-between mb-4">
          <div className="flex flex-row-reverse items-center gap-2 fade-in">
            <div className="w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center ring-emerald-500 ring-3 font-bold text-lg">
              ع
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center shrink-0">
              <div className="h-10 w-10">
                <Image
                  src="/logo.png"
                  width={40}
                  height={40}
                  alt="SedaBox Logo"
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </div>
              <div
                className={`brand-text ${
                  showBrandText ? "brand-text-visible" : "brand-text-hidden"
                }`}
                aria-hidden={!showBrandText}
              >
                صداباکس
              </div>
            </div>
            <div className="relative" ref={bellRef}>
              <button
                aria-label="اعلان‌ها"
                aria-expanded={showNotifications}
                className="text-white/90 p-2 rounded-md hover:bg-white/5 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifications(!showNotifications);
                }}
              >
                <Bell className="w-6 h-6" />
              </button>
              {showNotifications && (
                <div
                  role="dialog"
                  aria-label="اعلان‌ها"
                  className="absolute top-full right-0 mt-2 w-80 max-w-[90vw] bg-zinc-900/95  rounded-lg p-3 shadow-lg z-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-sm">اعلان‌ها</div>
                    <button
                      className="text-xs text-zinc-400 hover:text-white"
                      onClick={() => setShowNotifications(false)}
                    >
                      بستن
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {notifications.length === 0 ? (
                      <div className="text-zinc-400 text-sm p-2 text-center">
                        اعلان جدیدی وجود ندارد
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`notif-item flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800 transition ${
                            n.removing ? "removing" : ""
                          }`}
                        >
                          <button
                            role="checkbox"
                            aria-checked={n.checked}
                            onClick={() => {
                              setNotifications((prev) =>
                                prev.map((p) =>
                                  p.id === n.id ? { ...p, checked: true } : p
                                )
                              );
                              setTimeout(
                                () =>
                                  setNotifications((prev) =>
                                    prev.map((p) =>
                                      p.id === n.id
                                        ? { ...p, removing: true }
                                        : p
                                    )
                                  ),
                                220
                              );
                              setTimeout(
                                () =>
                                  setNotifications((prev) =>
                                    prev.filter((p) => p.id !== n.id)
                                  ),
                                560
                              );
                            }}
                            className={`notif-checkbox flex items-center justify-center shrink-0 w-7 h-7 rounded-md border-2 transition-all duration-200 ${
                              n.checked
                                ? "border-green-500 bg-green-500"
                                : "border-zinc-600 bg-transparent"
                            }`}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className={`w-4 h-4 text-black transition-transform duration-200 ${
                                n.checked
                                  ? "opacity-100 scale-100"
                                  : "opacity-0 scale-75"
                              }`}
                              fill="none"
                              stroke="none"
                            >
                              <path
                                d="M5 12.5l4 4L19 7"
                                stroke="white"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <div className="flex-1 text-sm text-zinc-200">
                            {n.text}
                          </div>
                          <div className="text-zinc-500 text-xs">{n.time}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => navigateTo("profile")}
              className="text-emerald-500 px-4 py-1.5 rounded-full font-semibold shadow-md hover:brightness-95 transition-transform transform hover:scale-105"
            >
              ارتقا پلن +
            </button>
          </div>
        </div>

        <div
          ref={navRef}
          className="flex gap-3 overflow-x-auto no-scrollbar pb-2 items-center will-change-transform"
          aria-label="بخش‌های خانه"
        >
          {sectionTitles.map((t, i) => (
            <button
              key={t}
              data-index={i}
              onClick={() => {
                const el = sectionRefs.current[i];
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                  setActiveIndex(i);
                }
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                i === activeIndex
                  ? "bg-green-500 text-black"
                  : "bg-zinc-800 text-white hover:bg-zinc-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-50 px-6 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              aria-label="برگشت"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <button
              onClick={() => window.history.forward()}
              className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              aria-label="جلو"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          {/* Center: Section navigation pills */}
          <div className="flex-1 flex justify-center">
            <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-2xl">
              {sectionTitles.slice(0, 5).map((t, i) => (
                <button
                  key={t}
                  onClick={() => {
                    const el = sectionRefs.current[i];
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                      setActiveIndex(i);
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    i === activeIndex
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            <button className="text-emerald-500 px-4 py-1.5 rounded-full font-semibold text-sm hover:text-emerald-400 transition-colors">
              ارتقا پلن +
            </button>
            <div className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center ring-2 ring-emerald-500 font-bold text-sm cursor-pointer hover:scale-105 transition-transform">
              ع
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-col gap-8 pt-2 md:gap-10 md:pt-4">
        <Section
          title="برای شما , برای علی رضایی"
          subtitle="بر اساس فعالیت های اخیر شما"
          sectionRef={(el) => (sectionRefs.current[0] = el)}
          dataIndex={0}
        >
          <HorizontalList
            items={sectionData.forYou}
            onPlay={(item) => {
              const song = MOCK_SONGS.find((s) => s.id === item.id);
              if (song) handlePlaySong(song, MOCK_SONGS.slice(0, 6));
            }}
          />
        </Section>

        <Section
          title="جدیدترین ریلیز ها "
          sectionRef={(el) => (sectionRefs.current[1] = el)}
          dataIndex={1}
        >
          <div className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory no-scrollbar pb-4">
            {sectionData.hottestDrops.map((item) => (
              <div
                key={item.id}
                className="snap-center shrink-0 w-[85vw] sm:w-80 relative group cursor-pointer"
              >
                <div className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/60  px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                    انتشار جدید
                  </div>
                </div>
                <h3 className="mt-2 font-bold text-lg truncate">
                  {item.title}
                </h3>
                <p className="text-zinc-400 text-sm truncate">
                  {item.subtitle}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="هنرمندان محبوب"
          sectionRef={(el) => (sectionRefs.current[2] = el)}
          dataIndex={2}
        >
          <HorizontalList
            items={sectionData.popularArtists}
            variant="circle"
            onItemClick={(item) =>
              navigateTo("artist-detail", { slug: item.id })
            }
          />
        </Section>

        <Section
          title="آلبوم‌های محبوب"
          sectionRef={(el) => (sectionRefs.current[3] = el)}
          dataIndex={3}
        >
          <HorizontalList
            items={sectionData.popularAlbums}
            variant="layered"
            onItemClick={(item) =>
              navigateTo("album-detail", { slug: createSlug(item.title) })
            }
          />
        </Section>

        <Section
          title="10 عنوان برتر هفته"
          subtitle="50 برتر جهانی"
          sectionRef={(el) => (sectionRefs.current[4] = el)}
          dataIndex={4}
        >
          <ChartList
            items={sectionData.top10Week}
            onPlay={(item) => {
              const song = MOCK_SONGS.find((s) => s.id === item.id);
              if (song) handlePlaySong(song, MOCK_SONGS.slice(12, 22));
            }}
          />
        </Section>

        <Section
          title="اکتشافات جدید"
          sectionRef={(el) => (sectionRefs.current[5] = el)}
          dataIndex={5}
        >
          <HorizontalList
            items={sectionData.newDiscoveries}
            onPlay={(item) => {
              const song = MOCK_SONGS.find((s) => s.id === item.id);
              if (song) handlePlaySong(song, MOCK_SONGS.slice(0, 6));
            }}
          />
        </Section>

        <Section
          title="10 عنوان برتر پاپ"
          subtitle="جدول ماهانه"
          sectionRef={(el) => (sectionRefs.current[6] = el)}
          dataIndex={6}
        >
          <ChartList
            items={sectionData.top10HipHop}
            color="text-orange-500"
            onPlay={(item) => {
              const song = MOCK_SONGS.find((s) => s.id === item.id);
              if (song) handlePlaySong(song, MOCK_SONGS.slice(6, 16));
            }}
          />
        </Section>

        <Section
          title="لیست‌های پخش جدید برای شما"
          sectionRef={(el) => (sectionRefs.current[7] = el)}
          dataIndex={7}
        >
          <HorizontalList items={sectionData.newPlaylists} variant="layered" />
        </Section>
      </main>

      <style jsx global>{`
        /* styles preserved from reference */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .fade-in {
          animation: fadeIn 0.5s ease-out forwards;
          will-change: opacity, transform;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        .notif-checkbox {
          transition: all 180ms ease-in-out;
          will-change: background-color, border-color, transform, opacity;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        .notif-checkbox svg {
          transition: transform 200ms ease, opacity 200ms ease;
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        @keyframes notifCheck {
          0% {
            transform: scale(0.8) rotate(-8deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.12) rotate(8deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        .notif-checkbox.notif-checked svg {
          animation: notifCheck 240ms ease forwards;
        }
        .notif-item {
          transform: translateX(0);
          opacity: 1;
          transition: transform 320ms ease, opacity 280ms ease;
          will-change: transform, opacity;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        .notif-item.removing {
          transform: translateX(140%);
          opacity: 0;
        }
        .brand-text {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          max-width: 220px;
          padding-inline-start: 0.5rem;
          padding-inline-end: 0.5rem;
          opacity: 1;
          transform: translateX(0);
          font-weight: 700;
          font-size: 1rem;
          color: #10b981;
          transition: max-width 480ms cubic-bezier(0.22, 0.9, 0.3, 1),
            padding 480ms cubic-bezier(0.22, 0.9, 0.3, 1), opacity 360ms ease,
            transform 360ms ease;
          will-change: max-width, padding, transform, opacity;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        .brand-text-hidden {
          max-width: 0;
          padding-inline-start: 0;
          padding-inline-end: 0;
          opacity: 0;
          transform: translateX(-8px);
        }

        /* Premium layered stack animations */
        .layered-stack {
          perspective: 1000px;
        }
        .layered-stack .layer {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-style: preserve-3d;
        }
        .layered-stack:hover .layer-1 {
          transform: translateY(-8px) translateX(4px) rotateZ(-2deg) scale(0.92);
        }
        .layered-stack:hover .layer-2 {
          transform: translateY(-4px) translateX(2px) rotateZ(-1deg) scale(0.96);
        }
        .layered-stack:hover .layer-main {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}

/* Reusable components */

type SectionProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  sectionRef?: (el: HTMLElement | null) => void;
  dataIndex?: number;
};
const Section = ({
  title,
  subtitle,
  children,
  sectionRef,
  dataIndex,
}: SectionProps) => (
  <section
    ref={sectionRef}
    data-index={dataIndex}
    className="flex flex-col gap-3 fade-in"
  >
    <div className="px-4 text-right">
      <h2 className="text-2xl font-bold tracking-tight leading-none">
        {title}
      </h2>
      {subtitle && (
        <p className="text-zinc-400 text-xs font-medium mt-1">{subtitle}</p>
      )}
    </div>
    {children}
  </section>
);

type HorizontalListProps = {
  items: ItemType[];
  variant?: "square" | "circle" | "layered";
  onItemClick?: (item: ItemType) => void;
  onPlay?: (item: ItemType) => void;
};
const HorizontalList = ({
  items,
  variant = "square",
  onItemClick,
  onPlay,
}: HorizontalListProps) => {
  return (
    <div className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory no-scrollbar pb-4 will-change-transform">
      {items.map((item, index) => (
        <div
          key={item.id}
          onClick={() => (onPlay ? onPlay(item) : onItemClick?.(item))}
          className={`snap-start shrink-0 flex flex-col gap-2 group cursor-pointer ${
            variant === "circle"
              ? "w-28"
              : variant === "layered"
              ? "w-40"
              : "w-36"
          }`}
        >
          <div
            className={`relative ${
              variant === "layered" ? "layered-stack pt-3 px-1" : ""
            }`}
          >
            {variant === "layered" && (
              <>
                {/* Third layer (deepest) */}
                <div
                  className="layer layer-1 absolute top-0 left-1/2 -translate-x-1/2 w-[75%] h-[calc(100%-12px)] rounded-lg overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, rgba(39, 39, 42, 0.9) 0%, rgba(24, 24, 27, 0.9) 100%)`,
                    boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  <img
                    src={items[(index + 2) % items.length]?.img || item.img}
                    alt=""
                    className="w-full h-full object-cover opacity-40"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                </div>

                {/* Second layer */}
                <div
                  className="layer layer-2 absolute top-[6px] left-1/2 -translate-x-1/2 w-[87%] h-[calc(100%-12px)] rounded-lg overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, rgba(52, 52, 56, 0.95) 0%, rgba(39, 39, 42, 0.95) 100%)`,
                    boxShadow: "0 6px 16px -4px rgba(0, 0, 0, 0.35)",
                  }}
                >
                  <img
                    src={items[(index + 1) % items.length]?.img || item.img}
                    alt=""
                    className="w-full h-full object-cover opacity-50"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-800/70 to-transparent" />
                </div>
              </>
            )}

            {/* Main image */}
            <div
              className={`layer layer-main relative overflow-hidden shadow-lg bg-zinc-800 ${
                variant === "circle"
                  ? "rounded-full aspect-square"
                  : "rounded-lg aspect-square"
              } ${variant === "layered" ? "z-10" : ""}`}
              style={
                variant === "layered"
                  ? {
                      boxShadow:
                        "0 8px 24px -6px rgba(0, 0, 0, 0.4), 0 4px 8px -2px rgba(0, 0, 0, 0.2)",
                    }
                  : {}
              }
            >
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-full object-cover group-active:scale-95 transition-transform duration-200 ease-out"
                loading="lazy"
              />

              {/* Hover overlay with gradient */}
              {variant === "layered" && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}

              {/* Play button */}
              {variant !== "circle" && (onPlay || variant === "layered") && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay?.(item);
                  }}
                  className="absolute bottom-2 left-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 hover:bg-green-400"
                >
                  <Play fill="black" className="mr-1 w-5 h-5 text-black" />
                </button>
              )}

              {/* New badge */}
              {item.isNew && (
                <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-lg z-20">
                  جدید
                </span>
              )}

              {/* Item count indicator for layered variant */}
              {variant === "layered" && (
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      d="M9 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{Math.floor(Math.random() * 15) + 8}</span>
                </div>
              )}
            </div>
          </div>

          <div
            className={`flex flex-col ${
              variant === "circle" ? "items-center text-center" : "items-start"
            }`}
          >
            <h3
              className={`font-semibold text-white truncate w-full ${
                variant === "circle" ? "text-sm" : "text-sm"
              }`}
            >
              {item.title}
            </h3>
            <p className="text-zinc-400 text-xs truncate w-full">
              {item.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

type ChartListProps = {
  items: ItemType[];
  color?: string;
  onPlay?: (item: ItemType) => void;
};
const ChartList = ({ items, color = "text-white", onPlay }: ChartListProps) => {
  return (
    <div className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory no-scrollbar pb-4 will-change-transform">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="snap-start shrink-0 w-[85vw] sm:w-96 flex flex-col gap-2"
        >
          <div
            onClick={() => onPlay?.(item)}
            className="flex flex-row-reverse items-center gap-4 bg-zinc-900/50 p-2 pr-4 rounded-md group active:bg-zinc-800 transition-colors relative cursor-pointer hover:bg-zinc-800/70"
          >
            <span
              className={`text-4xl font-bold w-12 text-center ${
                index < 3 ? color : "text-zinc-600"
              }`}
            >
              {index + 1}
            </span>
            <div className="h-16 w-16 shrink-0 relative rounded shadow-md overflow-hidden">
              <img
                src={item.img}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col overflow-hidden flex-1 min-w-0 text-right">
              <span className="font-bold truncate text-white flex items-center gap-2">
                {item.title}
                {item.isNew && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-lg z-20 ml-2">
                    جدید
                  </span>
                )}
              </span>
              <span className="text-zinc-400 text-xs truncate">
                {item.subtitle}
              </span>
            </div>
            <MoreHorizontal className="w-5 h-5 text-zinc-500 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
};

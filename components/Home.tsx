import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
  memo,
} from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";
import { usePlayer } from "../contexts/PlayerContext";

// Inline SVG icons to avoid heavy lucide-react bundle
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

// --- Mock Data Generators ---
type ItemType = {
  id: number;
  title: string;
  subtitle: string;
  img: string;
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
    // Use a stable seed so images stay consistent across re-renders
    img: `https://picsum.photos/seed/${seedPrefix}-${type}-${i}/300/300`,
    isNew: withNewBadge ? i % 2 === 0 : false, // every other item is new if withNewBadge
  }));

// Helper to create a mock track for the player
const createMockTrack = (item: ItemType) => ({
  id: `track-${item.id}`,
  title: item.title,
  artist: item.subtitle,
  image: item.img,
  duration: "3:45",
  src: "/music.mp3", // Mock audio file
});

// Helper to create tracks from a list of items
const createTracksFromItems = (items: ItemType[]) =>
  items.map((item) => createMockTrack(item));

export default function HomeComponent() {
  const { isAuthenticated, logout, user } = useAuth();
  const { playTrack, setQueue } = usePlayer();
  const router = useRouter();
  const [greeting, setGreeting] = useState("صبح بخیر");
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
  // Refs for sections and nav syncing
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const navRef = useRef<HTMLDivElement | null>(null);
  const bellRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

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

  // Generate stable section data with useMemo
  const sectionData = useMemo(
    () => ({
      forYou: generateItems(6, "square", true, "section0"),
      hottestDrops: generateItems(5, "square", false, "section1"),
      popularArtists: generateItems(8, "artist", false, "section2"),
      popularAlbums: generateItems(6, "square", false, "section3"),
      top10Week: generateItems(10, "square", true, "section4"),
      newDiscoveries: generateItems(6, "square", false, "section5"),
      top10HipHop: generateItems(10, "square", true, "section6"),
      newPlaylists: generateItems(6, "square", false, "section7"),
    }),
    []
  );

  // Helper to play an item within a section (sets the full section as queue)
  const handlePlayFromSection = useCallback(
    (items: ItemType[], clickedItem: ItemType) => {
      const tracks = createTracksFromItems(items);
      const clickedIndex = items.findIndex((i) => i.id === clickedItem.id);
      setQueue(tracks, clickedIndex >= 0 ? clickedIndex : 0);
    },
    [setQueue]
  );

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");

    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting("عصر بخیر");
    else if (hour >= 17) setGreeting("ساندباکس");
  }, [isAuthenticated, router]);

  // Observe sections and update active nav item
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          const idx = Number(el.dataset.index);
          if (entry.isIntersecting) {
            setActiveIndex(idx);
          }
        });
      },
      {
        root: null,
        rootMargin: "-100px 0px -40% 0px",
        threshold: 0.4,
      }
    );

    // Ensure we observe the actual mounted section elements.
    const els = Array.from(document.querySelectorAll("section[data-index]"));
    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Center active nav item when it changes
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activeBtn = nav.querySelector(`[data-index=\"${activeIndex}\"]`);
    if (activeBtn && typeof activeBtn.scrollIntoView === "function") {
      activeBtn.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeIndex]);

  // Close notifications when clicking outside or pressing Escape
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (!showNotifications) return;
      const el = bellRef.current;
      if (el && !el.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showNotifications]);

  if (!isAuthenticated) return null;

  return (
    <div
      dir="rtl"
      className="relative min-h-screen bg-black text-white font-sans pb-24 selection:bg-green-500 selection:text-black "
    >
      {/* Background Gradient Mesh */}
      <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-900/40 to-black pointer-events-none z-0" />

      {/* Glowing Orbs */}
      <div className="absolute top-[-10%]  w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

      {/* Background Gradient Mesh */}
      <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-900/40 to-black pointer-events-none z-0" />

      {/* --- Header Section --- */}
      <header className="sticky top-0 z-50 px-4 pt-4 pb-2 bg-black/90 transition-all duration-300">
        <div className="flex flex-row-reverse items-center justify-between mb-4">
          <div className="flex flex-row-reverse items-center gap-3 fade-in">
            {/* User Initial Circle */}
            <div className="w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center ring-emerald-500 ring-3 font-bold text-lg">
              ع
            </div>
            <div className="font-bold text-xl tracking-tight text-white/90">
              SoundBox
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={bellRef}>
              <button
                aria-label="اعلان‌ها"
                aria-expanded={showNotifications}
                className="text-white/90 p-2 rounded-md hover:bg-white/5 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifications((s) => !s);
                }}
              >
                <Bell className="w-6 h-6" />
              </button>

              {showNotifications && (
                <div
                  role="dialog"
                  aria-label="اعلان‌ها"
                  className="absolute top-full right-0 mt-2 w-80 max-w-[90vw] bg-zinc-900/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-sm">اعلان‌ها</div>
                    <button
                      className="text-xs text-zinc-400 hover:text-white"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setShowNotifications(false);
                      }}
                    >
                      بستن
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {notifications.length === 0 && (
                      <div className="text-zinc-400 text-sm p-2 text-center">
                        اعلان جدیدی وجود ندارد
                      </div>
                    )}

                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`notif-item flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800 transition ${
                          n.removing ? "removing" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          role="checkbox"
                          aria-checked={n.checked}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            // mark as checked and then animate slide-away after check animation
                            setNotifications((prev) =>
                              prev.map((p) =>
                                p.id === n.id ? { ...p, checked: true } : p
                              )
                            );
                            setTimeout(() => {
                              setNotifications((prev) =>
                                prev.map((p) =>
                                  p.id === n.id ? { ...p, removing: true } : p
                                )
                              );
                            }, 220); // let the check animation show briefly
                            setTimeout(() => {
                              setNotifications((prev) =>
                                prev.filter((p) => p.id !== n.id)
                              );
                            }, 560);
                          }}
                          className={`notif-checkbox flex items-center justify-center shrink-0 w-7 h-7 rounded-md border-2 transition-all duration-200 ${
                            n.checked
                              ? "notif-checked border-green-500 bg-green-500"
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
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                /* placeholder for upgrade action */
              }}
              className=" text-emerald-500 px-4 py-1.5 rounded-full font-semibold shadow-md hover:brightness-95 transition-transform transform hover:scale-105"
            >
              ارتقا پلن +
            </button>
          </div>
        </div>

        {/* Section Nav (syncs with scroll) */}
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
                if (el && typeof el.scrollIntoView === "function") {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                setActiveIndex(i);
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                {
                  true: "bg-green-500 text-black",
                  false: "bg-zinc-800 text-white hover:bg-zinc-700",
                }[String(i === activeIndex)]
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* --- Main Content Scroll --- */}
      <main className="relative z-10 flex flex-col gap-8 pt-2">
        {/* 1. For You (Standard Cards) */}
        <Section
          title="برای شما , برای علی رضایی"
          subtitle="بر اساس فعالیت های اخیر شما"
          sectionRef={(el) => (sectionRefs.current[0] = el)}
          dataIndex={0}
        >
          <HorizontalList
            items={sectionData.forYou}
            onItemClick={(item) =>
              handlePlayFromSection(sectionData.forYou, item)
            }
          />
        </Section>

        {/* 2. Hottest Drops (Large Featured Cards) */}
        <Section
          title="جدیدترین ریلیز ها "
          sectionRef={(el) => (sectionRefs.current[1] = el)}
          dataIndex={1}
        >
          <div className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory no-scrollbar pb-4">
            {sectionData.hottestDrops.map((item) => (
              <div
                key={item.id}
                onClick={() =>
                  handlePlayFromSection(sectionData.hottestDrops, item)
                }
                className="snap-center shrink-0 w-[85vw] sm:w-80 relative group cursor-pointer"
              >
                <div className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
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

        {/* 3. Popular Artists (Circular) */}
        <Section
          title="هنرمندان محبوب"
          sectionRef={(el) => (sectionRefs.current[2] = el)}
          dataIndex={2}
        >
          <HorizontalList
            items={sectionData.popularArtists}
            variant="circle"
            onItemClick={(item) =>
              handlePlayFromSection(sectionData.popularArtists, item)
            }
          />
        </Section>

        {/* 4. Popular Albums (Layered Effect) */}
        <Section
          title="آلبوم‌های محبوب"
          sectionRef={(el) => (sectionRefs.current[3] = el)}
          dataIndex={3}
        >
          <HorizontalList
            items={sectionData.popularAlbums}
            variant="layered"
            onItemClick={(item) =>
              handlePlayFromSection(sectionData.popularAlbums, item)
            }
          />
        </Section>

        {/* 5. Top 10 of the Week (Numbered) */}
        <Section
          title="10 عنوان برتر هفته"
          subtitle="50 برتر جهانی"
          sectionRef={(el) => (sectionRefs.current[4] = el)}
          dataIndex={4}
        >
          <ChartList
            items={sectionData.top10Week}
            onItemClick={(item) =>
              handlePlayFromSection(sectionData.top10Week, item)
            }
          />
        </Section>

        {/* 6. New Discoveries */}
        <Section
          title="اکتشافات جدید"
          sectionRef={(el) => (sectionRefs.current[5] = el)}
          dataIndex={5}
        >
          <HorizontalList
            items={sectionData.newDiscoveries}
            onItemClick={(item) =>
              handlePlayFromSection(sectionData.newDiscoveries, item)
            }
          />
        </Section>

        {/* 7. Top 10 of the Month (Genre) */}
        <Section
          title="10 عنوان برتر پاپ"
          subtitle="جدول ماهانه"
          sectionRef={(el) => (sectionRefs.current[6] = el)}
          dataIndex={6}
        >
          <ChartList
            items={sectionData.top10HipHop}
            color="text-orange-500"
            onItemClick={(item) =>
              handlePlayFromSection(sectionData.top10HipHop, item)
            }
          />
        </Section>

        {/* 8. New Playlists (Layered) */}
        <Section
          title="لیست‌های پخش جدید برای شما"
          sectionRef={(el) => (sectionRefs.current[7] = el)}
          dataIndex={7}
        >
          <HorizontalList
            items={sectionData.newPlaylists}
            variant="layered"
            onItemClick={(item) =>
              handlePlayFromSection(sectionData.newPlaylists, item)
            }
          />
        </Section>
      </main>

      {/* Global Styles for hiding scrollbar but keeping functionality */}
      <style jsx global>{`
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
        /* Subtle fade in for load */
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
        }
        /* Notification styles */
        .notif-checkbox {
          transition: all 180ms ease-in-out;
        }
        .notif-checkbox svg {
          transition: transform 200ms ease, opacity 200ms ease;
        }
        .notif-checkbox.notif-checked svg {
          transform: scale(1) rotate(0deg);
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
        /* Notification item slide-away */
        .notif-item {
          transform: translateX(0);
          opacity: 1;
          transition: transform 320ms ease, opacity 280ms ease;
        }
        .notif-item.removing {
          transform: translateX(140%);
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

// --- Reusable Components ---

type ChipProps = {
  children: React.ReactNode;
  active?: boolean;
};
const Chip = memo(({ children, active }: ChipProps) => (
  <button
    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
      active
        ? "bg-green-500 text-black"
        : "bg-zinc-800 text-white hover:bg-zinc-700"
    }`}
  >
    {children}
  </button>
));

type SectionProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  sectionRef?: (el: HTMLElement | null) => void;
  dataIndex?: number;
};
const Section = memo(
  ({ title, subtitle, children, sectionRef, dataIndex }: SectionProps) => (
    <section
      ref={sectionRef as React.RefCallback<HTMLElement>}
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
  )
);

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
};
const NavItem = memo(({ icon, label, active }: NavItemProps) => (
  <div
    className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
      active ? "text-white" : "text-zinc-500 hover:text-white"
    }`}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </div>
));

// --- List Variants ---

type HorizontalListProps = {
  items: ItemType[];
  variant?: "square" | "circle" | "layered";
  onItemClick?: (item: ItemType) => void;
};
const HorizontalList = memo(
  ({ items, variant = "square", onItemClick }: HorizontalListProps) => {
    return (
      <div className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory no-scrollbar pb-4 will-change-transform">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onItemClick?.(item)}
            className={`snap-start shrink-0 flex flex-col gap-2 group cursor-pointer ${
              variant === "circle" ? "w-28" : "w-36"
            }`}
          >
            {/* Image Container */}
            <div className="relative">
              {variant === "layered" && (
                <>
                  <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 w-[90%] h-full bg-zinc-700 rounded-md z-0 opacity-60" />
                  <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-[80%] h-full bg-zinc-800 rounded-md z-[-1] opacity-40" />
                </>
              )}

              <div
                className={`relative overflow-hidden shadow-lg bg-zinc-800 z-10 ${
                  variant === "circle"
                    ? "rounded-full aspect-square"
                    : "rounded-md aspect-square"
                }`}
              >
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover group-active:scale-95 transition-transform duration-200 ease-out"
                  loading="lazy"
                />
                {/* Play Button Overlay */}
                {variant !== "circle" && (
                  <div className="absolute bottom-2 left-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <Play fill="black" className="mr-1 w-5 h-5 text-black" />
                  </div>
                )}
                {/* New Badge */}
                {item.isNew && (
                  <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded shadow-lg z-20">
                    جدید
                  </span>
                )}
              </div>
            </div>

            {/* Text Info */}
            <div
              className={`flex flex-col ${
                variant === "circle"
                  ? "items-center text-center"
                  : "items-start"
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
  }
);

type ChartListProps = {
  items: ItemType[];
  color?: string;
  onItemClick?: (item: ItemType) => void;
};
const ChartList = memo(
  ({ items, color = "text-white", onItemClick }: ChartListProps) => {
    return (
      <div className="flex overflow-x-auto gap-4 px-4 snap-x snap-mandatory no-scrollbar pb-4 will-change-transform">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="snap-start shrink-0 w-[85vw] sm:w-96 flex flex-col gap-2"
          >
            {/* Render 3 items per column for chart look, or just big cards. 
               Following prompt "horizontal list" strictly: Large cards with big numbers. */}
            <div
              onClick={() => onItemClick?.(item)}
              className="flex flex-row-reverse items-center gap-4 bg-zinc-900/50 p-2 pr-4 rounded-md group active:bg-zinc-800 transition-colors relative cursor-pointer"
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
  }
);

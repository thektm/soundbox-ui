// mockData.ts
// All mock data for search page

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  image: string;
  src: string;
  explicit?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  /** Circular profile image used for overlays and avatars. Falls back to `image` if absent. */
  profileImage?: string;
  followers: string;
  verified?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  image: string;
  year: string;
  type: string;
  description: string;
}

export interface Genre {
  id: string;
  name: string;
  color: string;
  image: string;
}

// ============================================================================
// Utility Functions for Slug Generation
// ============================================================================

/**
 * Creates a URL-safe slug from a string, supporting Farsi/Arabic characters.
 * Uses encodeURIComponent to handle non-ASCII characters properly.
 */
export function createSlug(title: string): string {
  // Normalize the string and replace spaces with hyphens
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[\/\\?%*:|"<>]/g, "") // Remove invalid URL characters
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

  return encodeURIComponent(normalized);
}

/**
 * Decodes a slug back to a searchable string
 */
export function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).replace(/-/g, " ");
  } catch {
    return slug.replace(/-/g, " ");
  }
}

export const MOCK_SONGS: Song[] = [
  {
    id: "s1",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    duration: "3:20",
    image: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "s2",
    title: "Starboy",
    artist: "The Weeknd",
    album: "Starboy",
    duration: "3:50",
    image: "https://i.scdn.co/image/ab67616d0000b273a048415db06a5b6fa7ec4e1a",
    src: "/api/audio/music",
    explicit: true,
  },
  {
    id: "s3",
    title: "Shape of You",
    artist: "Ed Sheeran",
    album: "÷ (Divide)",
    duration: "3:53",
    image: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "s4",
    title: "Someone Like You",
    artist: "Adele",
    album: "21",
    duration: "4:45",
    image: "https://i.scdn.co/image/ab67616d0000b2732118bf9b198b05a95ded6300",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "s5",
    title: "Bad Guy",
    artist: "Billie Eilish",
    album: "When We All Fall Asleep",
    duration: "3:14",
    image: "https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce",
    src: "/api/audio/music",
    explicit: true,
  },
  {
    id: "s6",
    title: "Uptown Funk",
    artist: "Bruno Mars",
    album: "Uptown Special",
    duration: "4:30",
    image: "https://i.scdn.co/image/ab67616d0000b273e419ccba0baa8bd3f3d7abf2",
    src: "/api/audio/music",
    explicit: true,
  },
  {
    id: "s7",
    title: "Dance Monkey",
    artist: "Tones and I",
    album: "The Kids Are Coming",
    duration: "3:29",
    image: "https://i.scdn.co/image/ab67616d0000b273c6f7af36ecdc3ed6e0a1f169",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "s8",
    title: "Believer",
    artist: "Imagine Dragons",
    album: "Evolve",
    duration: "3:24",
    image: "https://i.scdn.co/image/ab67616d0000b2750469efa6616134d58f6d407f",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "s9",
    title: "Stay",
    artist: "The Kid LAROI",
    album: "F*CK LOVE 3",
    duration: "2:21",
    image: "https://i.scdn.co/image/ab67616d0000b273a3a7f38ea2033aa501afd4cf",
    src: "/api/audio/music",
    explicit: true,
  },
  {
    id: "s10",
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    duration: "3:23",
    image: "https://i.scdn.co/image/ab67616d0000b273d4daf28d55fe4197ede848be",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "s11",
    title: "Anti-Hero",
    artist: "Taylor Swift",
    album: "Midnights",
    duration: "3:20",
    image: "https://i.scdn.co/image/ab67616d0000b273bb54dde5369e8c4b45fa8d6c",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "s12",
    title: "Cruel Summer",
    artist: "Taylor Swift",
    album: "Lover",
    duration: "2:58",
    image: "https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647",
    src: "/api/audio/music",
    explicit: false,
  },
  // Persian songs
  {
    id: "s13",
    title: "در این شب‌های تنهایی",
    artist: "محسن یگانه",
    album: "تنهایی",
    duration: "4:15",
    image: "https://picsum.photos/seed/persian1/300/300",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "s14",
    title: "بازم برگرد",
    artist: "محسن یگانه",
    album: "برگشت",
    duration: "3:52",
    image: "https://picsum.photos/seed/persian2/300/300",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "s15",
    title: "خواب",
    artist: "رضا بهرام",
    album: "رویا",
    duration: "4:30",
    image: "https://picsum.photos/seed/persian3/300/300",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "s16",
    title: "دوست دارم",
    artist: "علیرضا طلیسچی",
    album: "عشق",
    duration: "3:45",
    image: "https://picsum.photos/seed/persian4/300/300",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "s17",
    title: "عشق یعنی تو",
    artist: "ماکان بند",
    album: "تو",
    duration: "4:10",
    image: "https://picsum.photos/seed/persian5/300/300",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "s18",
    title: "یاد تو",
    artist: "سیروان خسروی",
    album: "یادها",
    duration: "3:35",
    image: "https://picsum.photos/seed/persian6/300/300",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "s19",
    title: "غمگین",
    artist: "حامد زمانی",
    album: "احساسات",
    duration: "4:05",
    image: "https://picsum.photos/seed/persian7/300/300",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "s20",
    title: "شب‌های تهران",
    artist: "کیوان",
    album: "تهران",
    duration: "3:50",
    image: "https://picsum.photos/seed/persian8/300/300",
    src: "/api/audio/music",
    explicit: false,
  },
];

export const MOCK_ARTISTS: Artist[] = [
  {
    id: "a1",
    name: "The Weeknd",
    image: "https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26f1fd",
    profileImage:
      "https://images.unsplash.com/photo-1505653758659-2f4f1b8b7d6f?q=80&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&s=7e6d2d5b8f0f1d6a2f2a6e6b0f5d7c4a",
    followers: "85.2M",
    verified: true,
  },
  {
    id: "a2",
    name: "Ed Sheeran",
    image: "https://i.scdn.co/image/ab6761610000e5eb3bcef85e105dfc42399ef0ba",
    profileImage:
      "https://images.unsplash.com/photo-1463453091185-61582044d556?q=80&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&s=9a3c9fbb1f4b6e5a4a4d1d5e2f3c8a7b",
    followers: "92.1M",
    verified: true,
  },
  {
    id: "a3",
    name: "Adele",
    image: "https://i.scdn.co/image/ab6761610000e5eb68f6e5892075d7f22615bd17",
    profileImage:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&s=3b8c2a9b4f0d5e2a1b6c7d8e9f0a1b2c",
    followers: "56.8M",
    verified: true,
  },
  {
    id: "a4",
    name: "Billie Eilish",
    image: "https://i.scdn.co/image/ab6761610000e5ebd8b9980db67272cb4d2c3daf",
    profileImage:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&s=7f9b0d2e5a6c4b3d2f1e0a6b9c8d7e5f",
    followers: "68.3M",
    verified: true,
  },
  {
    id: "a5",
    name: "Bruno Mars",
    image: "https://i.scdn.co/image/ab6761610000e5ebc36dd9eb55fb0db4911f25dd",
    profileImage:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&s=0b8f7b6e5c6d4a3b2c1f9e8d7a6b5c4d",
    followers: "71.5M",
    verified: true,
  },
  {
    id: "a6",
    name: "Dua Lipa",
    image: "https://i.scdn.co/image/ab6761610000e5eb1bbee4a02f85ecc58d385c3e",
    profileImage:
      "https://images.unsplash.com/photo-1509403170437-7c5b8b1d3c0f?q=80&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&s=2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f",
    followers: "45.2M",
    verified: true,
  },
  {
    id: "a7",
    name: "Imagine Dragons",
    image: "https://i.scdn.co/image/ab6761610000e5eb920dc1f617550de8388f368e",
    profileImage:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&s=4e5f6a7b8c9d0e1f2a3b4c5d6e7f8g9h",
    followers: "38.9M",
    verified: true,
  },
  {
    id: "a8",
    name: "Taylor Swift",
    image: "https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3132a15fbb0",
    profileImage:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=640&auto=format&fit=crop&ixlib=rb-4.0.3&s=3b8c2a9b4f0d5e2a1b6c7d8e9f0a1b2c",
    followers: "89.4M",
    verified: true,
  },
];

export const MOCK_ALBUMS: Album[] = [
  {
    id: "al1",
    title: "After Hours",
    artist: "The Weeknd",
    image: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
    year: "۱۳۹۹",
    type: "آلبوم",
    description: "The Weeknd's fourth studio album featuring hit singles like Blinding Lights.",
  },
  {
    id: "al2",
    title: "÷ (Divide)",
    artist: "Ed Sheeran",
    image: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
    year: "۱۳۹۶",
    type: "آلبوم",
    description: "Ed Sheeran's third studio album with Shape of You and Perfect.",
  },
  {
    id: "al3",
    title: "21",
    artist: "Adele",
    image: "https://i.scdn.co/image/ab67616d0000b2732118bf9b198b05a95ded6300",
    year: "۱۳۹۰",
    type: "آلبوم",
    description: "Adele's second album featuring Someone Like You and Rolling in the Deep.",
  },
  {
    id: "al4",
    title: "When We All Fall Asleep",
    artist: "Billie Eilish",
    image: "https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce",
    year: "۱۳۹۸",
    type: "آلبوم",
    description: "Billie Eilish's debut album with Bad Guy and When the Party's Over.",
  },
  {
    id: "al5",
    title: "Uptown Special",
    artist: "Bruno Mars",
    image: "https://i.scdn.co/image/ab67616d0000b273e419ccba0baa8bd3f3d7abf2",
    year: "۱۳۹۴",
    type: "آلبوم",
    description: "Bruno Mars' third studio album featuring Uptown Funk.",
  },
  {
    id: "al6",
    title: "Evolve",
    artist: "Imagine Dragons",
    image: "https://i.scdn.co/image/ab67616d0000b2730469efa6616134d58f6d407f",
    year: "۱۳۹۶",
    type: "آلبوم",
    description: "Imagine Dragons' third album with Believer and Thunder.",
  },
  {
    id: "al7",
    title: "تهران",
    artist: "محسن یگانه",
    image: "https://picsum.photos/seed/tehran/400/400",
    year: "۱۴۰۲",
    type: "آلبوم",
    description: "آلبوم محبوب محسن یگانه با آهنگ‌های پرانرژی.",
  },
  {
    id: "al8",
    title: "شب‌های تهران",
    artist: "سیروان خسروی",
    image: "https://picsum.photos/seed/tehran-nights/400/400",
    year: "۱۴۰۱",
    type: "آلبوم",
    description: "مجموعه آهنگ‌های خاطره انگیز سیروان خسروی.",
  },
];

export const BROWSE_GENRES: Genre[] = [
  { id: "g1", name: "Pop", color: "#8D67AB", image: "🎵" },
  { id: "g2", name: "Hip-Hop", color: "#BA5D07", image: "🎤" },
  { id: "g3", name: "Rock", color: "#E61E32", image: "🎸" },
  { id: "g4", name: "R&B", color: "#DC148C", image: "💜" },
  { id: "g5", name: "Electronic", color: "#1E3264", image: "🎧" },
  { id: "g6", name: "Indie", color: "#608108", image: "🌿" },
  { id: "g7", name: "Jazz", color: "#477D95", image: "🎷" },
  { id: "g8", name: "Classical", color: "#7D4B32", image: "🎻" },
  { id: "g9", name: "Country", color: "#A56752", image: "🤠" },
  { id: "g10", name: "Latin", color: "#E13300", image: "💃" },
  { id: "g11", name: "K-Pop", color: "#148A08", image: "⭐" },
  { id: "g12", name: "Metal", color: "#444444", image: "🤘" },
];

// ============================================================================
// Playlist-related interfaces and data
// ============================================================================

export interface Playlist {
  id: string;
  title: string;
  description: string;
  image: string;
  gradient: string;
  songsCount: number;
  duration: string;
  followers?: string;
  isNew?: boolean;
  isPremium?: boolean;
}

export type MoodIconKey = 'happy' | 'relaxing' | 'energetic' | 'focus' | 'romantic' | 'sad' | 'party' | 'calm';

export interface MoodChip {
  id: string;
  label: string;
  iconKey: MoodIconKey;
  gradient: string;
}

export const MOOD_CHIPS: MoodChip[] = [
  {
    id: "m1",
    label: "شاد",
    iconKey: "happy",
    gradient: "from-yellow-400 to-orange-500",
  },
  {
    id: "m2",
    label: "آرامش‌بخش",
    iconKey: "relaxing",
    gradient: "from-green-400 to-teal-500",
  },
  {
    id: "m3",
    label: "انرژیک",
    iconKey: "energetic",
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: "m4",
    label: "تمرکز",
    iconKey: "focus",
    gradient: "from-purple-500 to-indigo-600",
  },
  {
    id: "m5",
    label: "رمانتیک",
    iconKey: "romantic",
    gradient: "from-pink-400 to-rose-500",
  },
  {
    id: "m6",
    label: "غمگین",
    iconKey: "sad",
    gradient: "from-gray-500 to-slate-600",
  },
  {
    id: "m7",
    label: "مهمانی",
    iconKey: "party",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    id: "m8",
    label: "آرام",
    iconKey: "calm",
    gradient: "from-cyan-400 to-blue-500",
  },
];

export const FEATURED_PLAYLISTS: Playlist[] = [
  {
    id: "f1",
    title: "برترین‌های امروز",
    description: "داغ‌ترین آهنگ‌های این لحظه. کاور: Sabrina Carpenter",
    image: `https://picsum.photos/seed/featured-f1/300/300`,
    gradient: "from-purple-600 via-pink-500 to-orange-400",
    songsCount: 50,
    duration: "2hr 45min",
    followers: "35.2M",
    isNew: true,
  },
  {
    id: "f2",
    title: "رپ کاویار",
    description: "موزیک جدید از Drake، Travis Scott و دیگران",
    image: `https://picsum.photos/seed/featured-f2/300/300`,
    gradient: "from-gray-900 via-gray-800 to-gray-700",
    songsCount: 50,
    duration: "2hr 30min",
    followers: "15.1M",
  },
  {
    id: "f3",
    title: "تمام دهه ۲۰۱۰",
    description: "بزرگ‌ترین آهنگ‌های دهه ۲۰۱۰",
    image: `https://picsum.photos/seed/featured-f3/300/300`,
    gradient: "from-teal-500 via-emerald-500 to-green-400",
    songsCount: 150,
    duration: "8hr 20min",
    followers: "8.7M",
  },
];

export const MADE_FOR_YOU: Playlist[] = [
  {
    id: "mfy1",
    title: "اکتشاف هفتگی",
    description: "میکس هفتگی مخصوص شما",
    image: `https://picsum.photos/seed/mfy1/300/300`,
    gradient: "from-green-600 to-green-900",
    songsCount: 30,
    duration: "1hr 45min",
    isNew: true,
  },
  {
    id: "mfy2",
    title: "رادار انتشار",
    description: "جدیدترین موزیک‌ها از هنرمندان دنبال‌شده",
    image: `https://picsum.photos/seed/mfy2/300/300`,
    gradient: "from-blue-600 to-indigo-900",
    songsCount: 30,
    duration: "1hr 30min",
    isNew: true,
  },
  {
    id: "mfy3",
    title: "میکس روزانه ۱",
    description: "The Weeknd, Drake, Post Malone",
    image: `https://picsum.photos/seed/mfy3/300/300`,
    gradient: "from-orange-500 to-red-700",
    songsCount: 50,
    duration: "3hr 10min",
  },
  {
    id: "mfy4",
    title: "میکس روزانه ۲",
    description: "Taylor Swift, Ed Sheeran",
    image: `https://picsum.photos/seed/mfy4/300/300`,
    gradient: "from-purple-500 to-violet-800",
    songsCount: 50,
    duration: "3hr 25min",
  },
  {
    id: "mfy5",
    title: "میکس روزانه ۳",
    description: "Billie Eilish, Olivia Rodrigo",
    image: `https://picsum.photos/seed/mfy5/300/300`,
    gradient: "from-cyan-500 to-blue-700",
    songsCount: 50,
    duration: "2hr 55min",
  },
  {
    id: "mfy6",
    title: "کپسول زمان",
    description: "پلی‌لیست شخصی‌سازی‌شده",
    image: `https://picsum.photos/seed/mfy6/300/300`,
    gradient: "from-amber-400 to-orange-600",
    songsCount: 30,
    duration: "1hr 40min",
    isPremium: true,
  },
];

export const FOCUS_PLAYLISTS: Playlist[] = [
  {
    id: "fc1",
    title: "تمرکز عمیق",
    description: "آرام باش و تمرکز کن",
    image: `https://picsum.photos/seed/fc1/300/300`,
    gradient: "from-slate-700 to-slate-900",
    songsCount: 200,
    duration: "12hr",
    followers: "6.2M",
  },
  {
    id: "fc2",
    title: "مطالعه بی‌کلام",
    description: "موسیقی ملایم برای مطالعه",
    image: `https://picsum.photos/seed/fc2/300/300`,
    gradient: "from-amber-600 to-yellow-800",
    songsCount: 180,
    duration: "10hr",
    followers: "3.8M",
  },
  {
    id: "fc3",
    title: "بیت‌های لوفای",
    description: "بیت‌هایی برای آرامش و مطالعه",
    image: `https://picsum.photos/seed/fc3/300/300`,
    gradient: "from-purple-700 to-indigo-900",
    songsCount: 250,
    duration: "14hr",
    followers: "5.1M",
  },
  {
    id: "fc4",
    title: "غذای مغز",
    description: "تمرکز کن و در لحظه باش",
    image: `https://picsum.photos/seed/fc4/300/300`,
    gradient: "from-rose-600 to-pink-800",
    songsCount: 160,
    duration: "9hr",
    followers: "2.9M",
  },
];

export const WORKOUT_PLAYLISTS: Playlist[] = [
  {
    id: "w1",
    title: "هیولای باشگاه",
    description: "انرژی بگیر و به جلو حرکت کن",
    image: `https://picsum.photos/seed/w1/300/300`,
    gradient: "from-red-600 to-orange-700",
    songsCount: 100,
    duration: "5hr 30min",
    followers: "9.4M",
  },
  {
    id: "w2",
    title: "ورزش و مدیتیشن",
    description: "پاپ‌های انرژی‌بخش برای تمرین",
    image: `https://picsum.photos/seed/w2/300/300`,
    gradient: "from-green-500 to-emerald-700",
    songsCount: 80,
    duration: "4hr",
    followers: "7.2M",
  },
  {
    id: "w3",
    title: "ورزش قدرتی",
    description: "EDM و الکترو هاوس",
    image: `https://picsum.photos/seed/w3/300/300`,
    gradient: "from-blue-500 to-cyan-700",
    songsCount: 90,
    duration: "4hr 45min",
    followers: "4.5M",
  },
  {
    id: "w4",
    title: "کاردیو",
    description: "آهنگ‌های پرانرژی برای تمرین",
    image: `https://picsum.photos/seed/w4/300/300`,
    gradient: "from-pink-500 to-rose-700",
    songsCount: 75,
    duration: "3hr 50min",
    followers: "3.8M",
  },
];

export const CHILL_PLAYLISTS: Playlist[] = [
  {
    id: "c1",
    title: "آهنگ‌های آرامش‌بخش",
    description: "با بهترین آهنگ‌های آرامش‌بخش استراحت کن",
    image: `https://picsum.photos/seed/c1/300/300`,
    gradient: "from-teal-500 to-cyan-700",
    songsCount: 130,
    duration: "7hr 20min",
    followers: "11.3M",
  },
  {
    id: "c2",
    title: "پیانوی آرام",
    description: "آرام باش، نفس بکش و ریلکس کن",
    image: `https://picsum.photos/seed/c2/300/300`,
    gradient: "from-slate-600 to-gray-800",
    songsCount: 200,
    duration: "12hr",
    followers: "6.7M",
  },
  {
    id: "c3",
    title: "جاز ویبس",
    description: "جاز آرام و پرانرژی",
    image: `https://picsum.photos/seed/c3/300/300`,
    gradient: "from-amber-600 to-orange-800",
    songsCount: 150,
    duration: "8hr 30min",
    followers: "4.2M",
  },
  {
    id: "c4",
    title: "آکوستیک آرامش‌بخش",
    description: "آرام و بی‌کلام استراحت کن",
    image: `https://picsum.photos/seed/c4/300/300`,
    gradient: "from-green-600 to-teal-800",
    songsCount: 120,
    duration: "6hr 45min",
    followers: "3.5M",
  },
];

export const PARTY_PLAYLISTS: Playlist[] = [
  {
    id: "p1",
    title: "میکس هیت‌های بزرگ",
    description: "هیت‌های بی‌وقفه",
    image: `https://picsum.photos/seed/p1/300/300`,
    gradient: "from-fuchsia-500 to-purple-700",
    songsCount: 75,
    duration: "4hr",
    followers: "8.9M",
    isNew: true,
  },
  {
    id: "p2",
    title: "پارتی رقص",
    description: "مهمانی را شروع کن",
    image: `https://picsum.photos/seed/p2/300/300`,
    gradient: "from-pink-500 to-red-600",
    songsCount: 100,
    duration: "5hr 20min",
    followers: "6.1M",
  },
  {
    id: "p3",
    title: "جمعه‌های پرانرژی",
    description: "آخر هفته‌ات را شروع کن",
    image: `https://picsum.photos/seed/p3/300/300`,
    gradient: "from-violet-500 to-indigo-700",
    songsCount: 50,
    duration: "2hr 45min",
    followers: "2.3M",
  },
];

export const DECADES_PLAYLISTS: Playlist[] = [
  {
    id: "d1",
    title: "تمام دهه ۸۰",
    description: "بزرگ‌ترین آهنگ‌های دهه ۱۹۸۰",
    image: `https://picsum.photos/seed/d1/300/300`,
    gradient: "from-fuchsia-600 to-purple-800",
    songsCount: 150,
    duration: "9hr",
  },
  {
    id: "d2",
    title: "تمام دهه ۹۰",
    description: "بزرگ‌ترین آهنگ‌های دهه ۱۹۹۰",
    image: `https://picsum.photos/seed/d2/300/300`,
    gradient: "from-cyan-500 to-blue-700",
    songsCount: 150,
    duration: "9hr",
  },
  {
    id: "d3",
    title: "تمام دهه ۲۰۰۰",
    description: "بزرگ‌ترین آهنگ‌های دهه ۲۰۰۰",
    image: `https://picsum.photos/seed/d3/300/300`,
    gradient: "from-orange-500 to-red-600",
    songsCount: 150,
    duration: "9hr",
  },
  {
    id: "d4",
    title: "تمام دهه ۲۰۲۰",
    description: "بزرگ‌ترین آهنگ‌های دهه ۲۰۲۰",
    image: `https://picsum.photos/seed/d4/300/300`,
    gradient: "from-green-500 to-emerald-700",
    songsCount: 100,
    duration: "5hr 30min",
    isNew: true,
  },
];

export const SLEEP_PLAYLISTS: Playlist[] = [
  {
    id: "sl1",
    title: "خواب",
    description: "پیانوی آرام و محیطی",
    image: `https://picsum.photos/seed/sl1/300/300`,
    gradient: "from-indigo-800 to-slate-900",
    songsCount: 100,
    duration: "8hr",
  },
  {
    id: "sl2",
    title: "باران شبانه",
    description: "صدای آرام باران",
    image: `https://picsum.photos/seed/sl2/300/300`,
    gradient: "from-blue-900 to-gray-900",
    songsCount: 50,
    duration: "6hr",
  },
];

export const GENRE_CATEGORIES = [
  { id: "g1", name: "Pop", color: "#E13300", icon: "🎵", count: "50+" },
  { id: "g2", name: "Hip-Hop", color: "#BA5D07", icon: "🎤", count: "40+" },
  { id: "g3", name: "Rock", color: "#E91429", icon: "🎸", count: "35+" },
  { id: "g4", name: "R&B", color: "#8C1932", icon: "💜", count: "30+" },
  { id: "g5", name: "Electronic", color: "#0D73EC", icon: "🎧", count: "45+" },
  { id: "g6", name: "Latin", color: "#E1118B", icon: "💃", count: "25+" },
  { id: "g7", name: "Indie", color: "#608108", icon: "🌿", count: "30+" },
  { id: "g8", name: "Classical", color: "#7358FF", icon: "🎻", count: "20+" },
  { id: "g9", name: "Jazz", color: "#1E3264", icon: "🎺", count: "25+" },
  { id: "g10", name: "Country", color: "#477D95", icon: "🤠", count: "20+" },
  { id: "g11", name: "Metal", color: "#1A1A1A", icon: "🤘", count: "15+" },
  { id: "g12", name: "K-Pop", color: "#FF4081", icon: "⭐", count: "20+" },
];

// ============================================================================
// Playlist utilities
// ============================================================================

/**
 * Return a flattened list with all playlists
 */
export function getAllPlaylists(): Playlist[] {
  return [
    ...FEATURED_PLAYLISTS,
    ...MADE_FOR_YOU,
    ...FOCUS_PLAYLISTS,
    ...WORKOUT_PLAYLISTS,
    ...CHILL_PLAYLISTS,
    ...PARTY_PLAYLISTS,
    ...DECADES_PLAYLISTS,
    ...SLEEP_PLAYLISTS,
  ];
}

/**
 * Find a playlist by slug or title. Uses `createSlug`/`decodeSlug` for safe
 * matching and supports non-ascii characters.
 */
export function findPlaylistBySlug(slug: string, allPlaylists: Playlist[]) {
  const decoded = decodeSlug(slug).toLowerCase();
  return allPlaylists.find((p) => {
    const s = decodeSlug(createSlug(p.title)).toLowerCase();
    if (s === decoded) return true;
    // fallback: compare normalized titles
    const normTitle = p.title.toLowerCase().replace(/\s+/g, " ").trim();
    return normTitle === decoded;
  });
}

// ============================================================================
// Profile-related interfaces and data (Followers, Following, Liked Items)
// ============================================================================

// Follower Interface (Regular users following you)
export interface Follower {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isFollowedByYou: boolean;
  mutualFollowers?: number;
}

// Following Interface (Artists you follow - verified style)
export interface Following {
  id: string;
  name: string;
  avatar: string;
  type: string;
  followers: string;
  verified: boolean;
}

// Liked Album Interface
export interface LikedAlbum {
  id: string;
  title: string;
  artist: string;
  image: string;
  year: string;
  songsCount: number;
}

// Liked Playlist Interface
export interface LikedPlaylist {
  id: string;
  title: string;
  description: string;
  image: string;
  gradient: string;
  songsCount: number;
  duration: string;
  followers?: string;
  isNew?: boolean;
  isPremium?: boolean;
}

// User Playlist Interface
export interface UserPlaylist {
  id: string;
  title: string;
  description?: string;
  image: string;
  gradient: string;
  songsCount: number;
  duration: string;
  isPublic: boolean;
  createdAt: string;
}

// ============================================================================
// Mock Followers Data (Regular users, not verified)
// ============================================================================
export const MOCK_FOLLOWERS: Follower[] = [
  {
    id: "f1",
    name: "سارا احمدی",
    username: "@sara_ahmadi",
    avatar: "https://picsum.photos/seed/follower1/200/200",
    isFollowedByYou: true,
    mutualFollowers: 12,
  },
  {
    id: "f2",
    name: "محمد رضایی",
    username: "@m.rezaei92",
    avatar: "https://picsum.photos/seed/follower2/200/200",
    isFollowedByYou: false,
    mutualFollowers: 5,
  },
  {
    id: "f3",
    name: "نیلوفر کریمی",
    username: "@nilookar",
    avatar: "https://picsum.photos/seed/follower3/200/200",
    isFollowedByYou: true,
    mutualFollowers: 23,
  },
  {
    id: "f4",
    name: "امیر حسینی",
    username: "@amir.h",
    avatar: "https://picsum.photos/seed/follower4/200/200",
    isFollowedByYou: false,
  },
  {
    id: "f5",
    name: "مریم نوری",
    username: "@maryam_n",
    avatar: "https://picsum.photos/seed/follower5/200/200",
    isFollowedByYou: true,
    mutualFollowers: 8,
  },
  {
    id: "f6",
    name: "علی محمدی",
    username: "@ali_mhmd",
    avatar: "https://picsum.photos/seed/follower6/200/200",
    isFollowedByYou: false,
    mutualFollowers: 3,
  },
  {
    id: "f7",
    name: "زهرا کاظمی",
    username: "@zahra.k",
    avatar: "https://picsum.photos/seed/follower7/200/200",
    isFollowedByYou: true,
  },
  {
    id: "f8",
    name: "حسین جعفری",
    username: "@h_jafari",
    avatar: "https://picsum.photos/seed/follower8/200/200",
    isFollowedByYou: false,
    mutualFollowers: 15,
  },
  {
    id: "f9",
    name: "فاطمه علوی",
    username: "@fatemeh.alavi",
    avatar: "https://picsum.photos/seed/follower9/200/200",
    isFollowedByYou: true,
    mutualFollowers: 7,
  },
  {
    id: "f10",
    name: "رضا موسوی",
    username: "@reza_m",
    avatar: "https://picsum.photos/seed/follower10/200/200",
    isFollowedByYou: false,
  },
  {
    id: "f11",
    name: "لیلا صادقی",
    username: "@leila.sadeghi",
    avatar: "https://picsum.photos/seed/follower11/200/200",
    isFollowedByYou: true,
    mutualFollowers: 19,
  },
  {
    id: "f12",
    name: "پویا نیکزاد",
    username: "@pooya.n",
    avatar: "https://picsum.photos/seed/follower12/200/200",
    isFollowedByYou: false,
    mutualFollowers: 2,
  },
];

// ============================================================================
// Mock Following Data (Artists - Verified)
// ============================================================================
export const MOCK_FOLLOWING: Following[] = [
  {
    id: "a1",
    name: "The Weeknd",
    avatar: "https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26f1fd",
    type: "هنرمند",
    followers: "85.2M",
    verified: true,
  },
  {
    id: "a2",
    name: "محسن یگانه",
    avatar: "https://picsum.photos/seed/mohsen/200/200",
    type: "خواننده",
    followers: "15.8M",
    verified: true,
  },
  {
    id: "a3",
    name: "Taylor Swift",
    avatar: "https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3132a15fbb0",
    type: "هنرمند",
    followers: "89.4M",
    verified: true,
  },
  {
    id: "a4",
    name: "سیروان خسروی",
    avatar: "https://picsum.photos/seed/sirvan/200/200",
    type: "خواننده",
    followers: "12.3M",
    verified: true,
  },
  {
    id: "a5",
    name: "Billie Eilish",
    avatar: "https://i.scdn.co/image/ab6761610000e5ebd8b9980db67272cb4d2c3daf",
    type: "هنرمند",
    followers: "68.3M",
    verified: true,
  },
  {
    id: "a6",
    name: "رضا بهرام",
    avatar: "https://picsum.photos/seed/reza/200/200",
    type: "خواننده",
    followers: "8.7M",
    verified: true,
  },
  {
    id: "a7",
    name: "Drake",
    avatar: "https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9",
    type: "هنرمند",
    followers: "76.1M",
    verified: true,
  },
  {
    id: "a8",
    name: "ماکان بند",
    avatar: "https://picsum.photos/seed/makan/200/200",
    type: "گروه موسیقی",
    followers: "6.2M",
    verified: true,
  },
  {
    id: "a9",
    name: "Dua Lipa",
    avatar: "https://i.scdn.co/image/ab6761610000e5eb1bbee4a02f85ecc58d385c3e",
    type: "هنرمند",
    followers: "45.2M",
    verified: true,
  },
  {
    id: "a10",
    name: "علیرضا طلیسچی",
    avatar: "https://picsum.photos/seed/alireza/200/200",
    type: "خواننده",
    followers: "5.4M",
    verified: true,
  },
];

// ============================================================================
// Liked Songs (Uses existing Song interface)
// ============================================================================
export const LIKED_SONGS: Song[] = [
  {
    id: "ls1",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    duration: "3:20",
    image: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "ls2",
    title: "در این شب‌های تنهایی",
    artist: "محسن یگانه",
    album: "تنهایی",
    duration: "4:15",
    image: "https://picsum.photos/seed/persian1/300/300",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "ls3",
    title: "Anti-Hero",
    artist: "Taylor Swift",
    album: "Midnights",
    duration: "3:20",
    image: "https://i.scdn.co/image/ab67616d0000b273bb54dde5369e8c4b45fa8d6c",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "ls4",
    title: "خواب",
    artist: "رضا بهرام",
    album: "رویا",
    duration: "4:30",
    image: "https://picsum.photos/seed/persian3/300/300",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "ls5",
    title: "Starboy",
    artist: "The Weeknd",
    album: "Starboy",
    duration: "3:50",
    image: "https://i.scdn.co/image/ab67616d0000b273a048415db06a5b6fa7ec4e1a",
    src: "/api/audio/music",
    explicit: true,
  },
  {
    id: "ls6",
    title: "عشق یعنی تو",
    artist: "ماکان بند",
    album: "تو",
    duration: "4:10",
    image: "https://picsum.photos/seed/persian5/300/300",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "ls7",
    title: "Bad Guy",
    artist: "Billie Eilish",
    album: "When We All Fall Asleep",
    duration: "3:14",
    image: "https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce",
    src: "/api/audio/music",
    explicit: true,
  },
  {
    id: "ls8",
    title: "یاد تو",
    artist: "سیروان خسروی",
    album: "یادها",
    duration: "3:35",
    image: "https://picsum.photos/seed/persian6/300/300",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "ls9",
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    duration: "3:23",
    image: "https://i.scdn.co/image/ab67616d0000b273d4daf28d55fe4197ede848be",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "ls10",
    title: "دوست دارم",
    artist: "علیرضا طلیسچی",
    album: "عشق",
    duration: "3:45",
    image: "https://picsum.photos/seed/persian4/300/300",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "ls11",
    title: "Shape of You",
    artist: "Ed Sheeran",
    album: "÷ (Divide)",
    duration: "3:53",
    image: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "ls12",
    title: "بازم برگرد",
    artist: "محسن یگانه",
    album: "برگشت",
    duration: "3:52",
    image: "https://picsum.photos/seed/persian2/300/300",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "ls13",
    title: "Cruel Summer",
    artist: "Taylor Swift",
    album: "Lover",
    duration: "2:58",
    image: "https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "ls14",
    title: "شب‌های تهران",
    artist: "کیوان",
    album: "تهران",
    duration: "3:50",
    image: "https://picsum.photos/seed/persian8/300/300",
    src: "/api/audio/music",
    explicit: false,
  },
  {
    id: "ls15",
    title: "Stay",
    artist: "The Kid LAROI",
    album: "F*CK LOVE 3",
    duration: "2:21",
    image: "https://i.scdn.co/image/ab67616d0000b273a3a7f38ea2033aa501afd4cf",
    src: "/api/audio/music",
    explicit: true,
  },
];

// ============================================================================
// Liked Albums Data
// ============================================================================
export const LIKED_ALBUMS: LikedAlbum[] = [
  {
    id: "la1",
    title: "After Hours",
    artist: "The Weeknd",
    image: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
    year: "۱۳۹۹",
    songsCount: 14,
  },
  {
    id: "la2",
    title: "تنهایی",
    artist: "محسن یگانه",
    image: "https://picsum.photos/seed/album-tanha/400/400",
    year: "۱۴۰۱",
    songsCount: 10,
  },
  {
    id: "la3",
    title: "Midnights",
    artist: "Taylor Swift",
    image: "https://i.scdn.co/image/ab67616d0000b273bb54dde5369e8c4b45fa8d6c",
    year: "۱۴۰۱",
    songsCount: 13,
  },
  {
    id: "la4",
    title: "رویا",
    artist: "رضا بهرام",
    image: "https://picsum.photos/seed/album-roya/400/400",
    year: "۱۴۰۰",
    songsCount: 8,
  },
  {
    id: "la5",
    title: "Future Nostalgia",
    artist: "Dua Lipa",
    image: "https://i.scdn.co/image/ab67616d0000b273d4daf28d55fe4197ede848be",
    year: "۱۳۹۹",
    songsCount: 11,
  },
  {
    id: "la6",
    title: "شب‌های تهران",
    artist: "سیروان خسروی",
    image: "https://picsum.photos/seed/tehran-nights/400/400",
    year: "۱۴۰۱",
    songsCount: 12,
  },
  {
    id: "la7",
    title: "When We All Fall Asleep",
    artist: "Billie Eilish",
    image: "https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce",
    year: "۱۳۹۸",
    songsCount: 14,
  },
  {
    id: "la8",
    title: "÷ (Divide)",
    artist: "Ed Sheeran",
    image: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
    year: "۱۳۹۶",
    songsCount: 16,
  },
  {
    id: "la9",
    title: "تو",
    artist: "ماکان بند",
    image: "https://picsum.photos/seed/album-to/400/400",
    year: "۱۴۰۲",
    songsCount: 9,
  },
  {
    id: "la10",
    title: "Starboy",
    artist: "The Weeknd",
    image: "https://i.scdn.co/image/ab67616d0000b273a048415db06a5b6fa7ec4e1a",
    year: "۱۳۹۵",
    songsCount: 18,
  },
];

// ============================================================================
// Liked Playlists Data
// ============================================================================
export const LIKED_PLAYLISTS: LikedPlaylist[] = [
  {
    id: "lp1",
    title: "برترین‌های امروز",
    description: "داغ‌ترین آهنگ‌های این لحظه. کاور: Sabrina Carpenter",
    image: "https://picsum.photos/seed/featured-f1/300/300",
    gradient: "from-purple-600 via-pink-500 to-orange-400",
    songsCount: 50,
    duration: "2hr 45min",
    followers: "35.2M",
    isNew: true,
  },
  {
    id: "lp2",
    title: "آهنگ‌های آرامش‌بخش",
    description: "با بهترین آهنگ‌های آرامش‌بخش استراحت کن",
    image: "https://picsum.photos/seed/c1/300/300",
    gradient: "from-teal-500 to-cyan-700",
    songsCount: 130,
    duration: "7hr 20min",
    followers: "11.3M",
  },
  {
    id: "lp3",
    title: "میکس روزانه ۱",
    description: "The Weeknd, Drake, Post Malone",
    image: "https://picsum.photos/seed/mfy3/300/300",
    gradient: "from-orange-500 to-red-700",
    songsCount: 50,
    duration: "3hr 10min",
  },
  {
    id: "lp4",
    title: "تمرکز عمیق",
    description: "آرام باش و تمرکز کن",
    image: "https://picsum.photos/seed/fc1/300/300",
    gradient: "from-slate-700 to-slate-900",
    songsCount: 200,
    duration: "12hr",
    followers: "6.2M",
    isPremium: true,
  },
  {
    id: "lp5",
    title: "هیولای باشگاه",
    description: "انرژی بگیر و به جلو حرکت کن",
    image: "https://picsum.photos/seed/w1/300/300",
    gradient: "from-red-600 to-orange-700",
    songsCount: 100,
    duration: "5hr 30min",
    followers: "9.4M",
  },
  {
    id: "lp6",
    title: "پارتی رقص",
    description: "مهمانی را شروع کن",
    image: "https://picsum.photos/seed/p2/300/300",
    gradient: "from-pink-500 to-red-600",
    songsCount: 100,
    duration: "5hr 20min",
    followers: "6.1M",
    isNew: true,
  },
  {
    id: "lp7",
    title: "خواب",
    description: "پیانوی آرام و محیطی",
    image: "https://picsum.photos/seed/sl1/300/300",
    gradient: "from-indigo-800 to-slate-900",
    songsCount: 100,
    duration: "8hr",
  },
  {
    id: "lp8",
    title: "جاز ویبس",
    description: "جاز آرام و پرانرژی",
    image: "https://picsum.photos/seed/c3/300/300",
    gradient: "from-amber-600 to-orange-800",
    songsCount: 150,
    duration: "8hr 30min",
    followers: "4.2M",
  },
];

// ============================================================================
// User Playlists Data (Created by user)
// ============================================================================
export const USER_PLAYLISTS: UserPlaylist[] = [
  {
    id: "up1",
    title: "آهنگ‌های مورد علاقه",
    description: "آهنگ‌هایی که بیشتر گوش می‌دم",
    image: "https://picsum.photos/seed/user-pl1/300/300",
    gradient: "from-emerald-600 to-teal-700",
    songsCount: 45,
    duration: "2hr 30min",
    isPublic: true,
    createdAt: "2024-01-15",
  },
  {
    id: "up2",
    title: "برای رانندگی",
    description: "آهنگ‌های پرانرژی برای مسیر",
    image: "https://picsum.photos/seed/user-pl2/300/300",
    gradient: "from-orange-500 to-red-600",
    songsCount: 32,
    duration: "1hr 45min",
    isPublic: true,
    createdAt: "2024-02-20",
  },
  {
    id: "up3",
    title: "شب‌های آرام",
    description: "موزیک برای استراحت",
    image: "https://picsum.photos/seed/user-pl3/300/300",
    gradient: "from-indigo-600 to-purple-700",
    songsCount: 28,
    duration: "2hr 10min",
    isPublic: false,
    createdAt: "2024-03-10",
  },
  {
    id: "up4",
    title: "ورزش صبحگاهی",
    description: "",
    image: "https://picsum.photos/seed/user-pl4/300/300",
    gradient: "from-green-500 to-emerald-600",
    songsCount: 20,
    duration: "1hr 15min",
    isPublic: true,
    createdAt: "2024-04-05",
  },
  {
    id: "up5",
    title: "یادها",
    description: "آهنگ‌های خاطره انگیز",
    image: "",
    gradient: "from-rose-500 to-pink-600",
    songsCount: 15,
    duration: "55min",
    isPublic: false,
    createdAt: "2024-05-12",
  },
  {
    id: "up6",
    title: "کافه",
    description: "موزیک ملایم برای کار",
    image: "https://picsum.photos/seed/user-pl6/300/300",
    gradient: "from-amber-500 to-yellow-600",
    songsCount: 50,
    duration: "3hr 20min",
    isPublic: true,
    createdAt: "2024-06-01",
  },
];

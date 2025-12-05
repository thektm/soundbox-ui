// mockData.ts
// All mock data for search page

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  image: string;
  explicit?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  followers: string;
  verified?: boolean;
}

export interface Genre {
  id: string;
  name: string;
  color: string;
  image: string;
}

export const MOCK_SONGS: Song[] = [
  {
    id: "s1",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    duration: "3:20",
    image: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
    explicit: false,
  },
  {
    id: "s2",
    title: "Starboy",
    artist: "The Weeknd",
    album: "Starboy",
    duration: "3:50",
    image: "https://i.scdn.co/image/ab67616d0000b273a048415db06a5b6fa7ec4e1a",
    explicit: true,
  },
  {
    id: "s3",
    title: "Shape of You",
    artist: "Ed Sheeran",
    album: "÷ (Divide)",
    duration: "3:53",
    image: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
    explicit: false,
  },
  {
    id: "s4",
    title: "Someone Like You",
    artist: "Adele",
    album: "21",
    duration: "4:45",
    image: "https://i.scdn.co/image/ab67616d0000b2732118bf9b198b05a95ded6300",
    explicit: false,
  },
  {
    id: "s5",
    title: "Bad Guy",
    artist: "Billie Eilish",
    album: "When We All Fall Asleep",
    duration: "3:14",
    image: "https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce",
    explicit: true,
  },
  {
    id: "s6",
    title: "Uptown Funk",
    artist: "Bruno Mars",
    album: "Uptown Special",
    duration: "4:30",
    image: "https://i.scdn.co/image/ab67616d0000b273e419ccba0baa8bd3f3d7abf2",
    explicit: true,
  },
  {
    id: "s7",
    title: "Dance Monkey",
    artist: "Tones and I",
    album: "The Kids Are Coming",
    duration: "3:29",
    image: "https://i.scdn.co/image/ab67616d0000b273c6f7af36ecdc3ed6e0a1f169",
    explicit: false,
  },
  {
    id: "s8",
    title: "Believer",
    artist: "Imagine Dragons",
    album: "Evolve",
    duration: "3:24",
    image: "https://i.scdn.co/image/ab67616d0000b2750469efa6616134d58f6d407f",
    explicit: false,
  },
  {
    id: "s9",
    title: "Stay",
    artist: "The Kid LAROI",
    album: "F*CK LOVE 3",
    duration: "2:21",
    image: "https://i.scdn.co/image/ab67616d0000b273a3a7f38ea2033aa501afd4cf",
    explicit: true,
  },
  {
    id: "s10",
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    duration: "3:23",
    image: "https://i.scdn.co/image/ab67616d0000b273d4daf28d55fe4197ede848be",
    explicit: false,
  },
];

export const MOCK_ARTISTS: Artist[] = [
  {
    id: "a1",
    name: "The Weeknd",
    image: "https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26f1fd",
    followers: "85.2M",
    verified: true,
  },
  {
    id: "a2",
    name: "Ed Sheeran",
    image: "https://i.scdn.co/image/ab6761610000e5eb3bcef85e105dfc42399ef0ba",
    followers: "92.1M",
    verified: true,
  },
  {
    id: "a3",
    name: "Adele",
    image: "https://i.scdn.co/image/ab6761610000e5eb68f6e5892075d7f22615bd17",
    followers: "56.8M",
    verified: true,
  },
  {
    id: "a4",
    name: "Billie Eilish",
    image: "https://i.scdn.co/image/ab6761610000e5ebd8b9980db67272cb4d2c3daf",
    followers: "68.3M",
    verified: true,
  },
  {
    id: "a5",
    name: "Bruno Mars",
    image: "https://i.scdn.co/image/ab6761610000e5ebc36dd9eb55fb0db4911f25dd",
    followers: "71.5M",
    verified: true,
  },
  {
    id: "a6",
    name: "Dua Lipa",
    image: "https://i.scdn.co/image/ab6761610000e5eb1bbee4a02f85ecc58d385c3e",
    followers: "45.2M",
    verified: true,
  },
  {
    id: "a7",
    name: "Imagine Dragons",
    image: "https://i.scdn.co/image/ab6761610000e5eb920dc1f617550de8388f368e",
    followers: "38.9M",
    verified: true,
  },
  {
    id: "a8",
    name: "Taylor Swift",
    image: "https://i.scdn.co/image/ab6761610000e5eb5a00969a4698c3132a15fbb0",
    followers: "89.4M",
    verified: true,
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
    image: `https://picsum.photos/seed/featured-f1-${Math.random()}/300/300`,
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
    image: `https://picsum.photos/seed/featured-f2-${Math.random()}/300/300`,
    gradient: "from-gray-900 via-gray-800 to-gray-700",
    songsCount: 50,
    duration: "2hr 30min",
    followers: "15.1M",
  },
  {
    id: "f3",
    title: "تمام دهه ۲۰۱۰",
    description: "بزرگ‌ترین آهنگ‌های دهه ۲۰۱۰",
    image: `https://picsum.photos/seed/featured-f3-${Math.random()}/300/300`,
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
    image: `https://picsum.photos/seed/mfy1-${Math.random()}/300/300`,
    gradient: "from-green-600 to-green-900",
    songsCount: 30,
    duration: "1hr 45min",
    isNew: true,
  },
  {
    id: "mfy2",
    title: "رادار انتشار",
    description: "جدیدترین موزیک‌ها از هنرمندان دنبال‌شده",
    image: `https://picsum.photos/seed/mfy2-${Math.random()}/300/300`,
    gradient: "from-blue-600 to-indigo-900",
    songsCount: 30,
    duration: "1hr 30min",
    isNew: true,
  },
  {
    id: "mfy3",
    title: "میکس روزانه ۱",
    description: "The Weeknd, Drake, Post Malone",
    image: `https://picsum.photos/seed/mfy3-${Math.random()}/300/300`,
    gradient: "from-orange-500 to-red-700",
    songsCount: 50,
    duration: "3hr 10min",
  },
  {
    id: "mfy4",
    title: "میکس روزانه ۲",
    description: "Taylor Swift, Ed Sheeran",
    image: `https://picsum.photos/seed/mfy4-${Math.random()}/300/300`,
    gradient: "from-purple-500 to-violet-800",
    songsCount: 50,
    duration: "3hr 25min",
  },
  {
    id: "mfy5",
    title: "میکس روزانه ۳",
    description: "Billie Eilish, Olivia Rodrigo",
    image: `https://picsum.photos/seed/mfy5-${Math.random()}/300/300`,
    gradient: "from-cyan-500 to-blue-700",
    songsCount: 50,
    duration: "2hr 55min",
  },
  {
    id: "mfy6",
    title: "کپسول زمان",
    description: "پلی‌لیست شخصی‌سازی‌شده",
    image: `https://picsum.photos/seed/mfy6-${Math.random()}/300/300`,
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
    image: `https://picsum.photos/seed/fc1-${Math.random()}/300/300`,
    gradient: "from-slate-700 to-slate-900",
    songsCount: 200,
    duration: "12hr",
    followers: "6.2M",
  },
  {
    id: "fc2",
    title: "مطالعه بی‌کلام",
    description: "موسیقی ملایم برای مطالعه",
    image: `https://picsum.photos/seed/fc2-${Math.random()}/300/300`,
    gradient: "from-amber-600 to-yellow-800",
    songsCount: 180,
    duration: "10hr",
    followers: "3.8M",
  },
  {
    id: "fc3",
    title: "بیت‌های لوفای",
    description: "بیت‌هایی برای آرامش و مطالعه",
    image: `https://picsum.photos/seed/fc3-${Math.random()}/300/300`,
    gradient: "from-purple-700 to-indigo-900",
    songsCount: 250,
    duration: "14hr",
    followers: "5.1M",
  },
  {
    id: "fc4",
    title: "غذای مغز",
    description: "تمرکز کن و در لحظه باش",
    image: `https://picsum.photos/seed/fc4-${Math.random()}/300/300`,
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
    image: `https://picsum.photos/seed/w1-${Math.random()}/300/300`,
    gradient: "from-red-600 to-orange-700",
    songsCount: 100,
    duration: "5hr 30min",
    followers: "9.4M",
  },
  {
    id: "w2",
    title: "ورزش و مدیتیشن",
    description: "پاپ‌های انرژی‌بخش برای تمرین",
    image: `https://picsum.photos/seed/w2-${Math.random()}/300/300`,
    gradient: "from-green-500 to-emerald-700",
    songsCount: 80,
    duration: "4hr",
    followers: "7.2M",
  },
  {
    id: "w3",
    title: "ورزش قدرتی",
    description: "EDM و الکترو هاوس",
    image: `https://picsum.photos/seed/w3-${Math.random()}/300/300`,
    gradient: "from-blue-500 to-cyan-700",
    songsCount: 90,
    duration: "4hr 45min",
    followers: "4.5M",
  },
  {
    id: "w4",
    title: "کاردیو",
    description: "آهنگ‌های پرانرژی برای تمرین",
    image: `https://picsum.photos/seed/w4-${Math.random()}/300/300`,
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
    image: `https://picsum.photos/seed/c1-${Math.random()}/300/300`,
    gradient: "from-teal-500 to-cyan-700",
    songsCount: 130,
    duration: "7hr 20min",
    followers: "11.3M",
  },
  {
    id: "c2",
    title: "پیانوی آرام",
    description: "آرام باش، نفس بکش و ریلکس کن",
    image: `https://picsum.photos/seed/c2-${Math.random()}/300/300`,
    gradient: "from-slate-600 to-gray-800",
    songsCount: 200,
    duration: "12hr",
    followers: "6.7M",
  },
  {
    id: "c3",
    title: "جاز ویبس",
    description: "جاز آرام و پرانرژی",
    image: `https://picsum.photos/seed/c3-${Math.random()}/300/300`,
    gradient: "from-amber-600 to-orange-800",
    songsCount: 150,
    duration: "8hr 30min",
    followers: "4.2M",
  },
  {
    id: "c4",
    title: "آکوستیک آرامش‌بخش",
    description: "آرام و بی‌کلام استراحت کن",
    image: `https://picsum.photos/seed/c4-${Math.random()}/300/300`,
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
    image: `https://picsum.photos/seed/p1-${Math.random()}/300/300`,
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
    image: `https://picsum.photos/seed/p2-${Math.random()}/300/300`,
    gradient: "from-pink-500 to-red-600",
    songsCount: 100,
    duration: "5hr 20min",
    followers: "6.1M",
  },
  {
    id: "p3",
    title: "جمعه‌های پرانرژی",
    description: "آخر هفته‌ات را شروع کن",
    image: `https://picsum.photos/seed/p3-${Math.random()}/300/300`,
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
    image: `https://picsum.photos/seed/d1-${Math.random()}/300/300`,
    gradient: "from-fuchsia-600 to-purple-800",
    songsCount: 150,
    duration: "9hr",
  },
  {
    id: "d2",
    title: "تمام دهه ۹۰",
    description: "بزرگ‌ترین آهنگ‌های دهه ۱۹۹۰",
    image: `https://picsum.photos/seed/d2-${Math.random()}/300/300`,
    gradient: "from-cyan-500 to-blue-700",
    songsCount: 150,
    duration: "9hr",
  },
  {
    id: "d3",
    title: "تمام دهه ۲۰۰۰",
    description: "بزرگ‌ترین آهنگ‌های دهه ۲۰۰۰",
    image: `https://picsum.photos/seed/d3-${Math.random()}/300/300`,
    gradient: "from-orange-500 to-red-600",
    songsCount: 150,
    duration: "9hr",
  },
  {
    id: "d4",
    title: "تمام دهه ۲۰۲۰",
    description: "بزرگ‌ترین آهنگ‌های دهه ۲۰۲۰",
    image: `https://picsum.photos/seed/d4-${Math.random()}/300/300`,
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
    image: `https://picsum.photos/seed/sl1-${Math.random()}/300/300`,
    gradient: "from-indigo-800 to-slate-900",
    songsCount: 100,
    duration: "8hr",
  },
  {
    id: "sl2",
    title: "باران شبانه",
    description: "صدای آرام باران",
    image: `https://picsum.photos/seed/sl2-${Math.random()}/300/300`,
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

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { isNativeAndroid, nativePreferences } from "../lib/nativePreferences";
import { EXTRA_FA_TO_EN } from "./I18nCatalogExtra";
import {
  installClientFetchGuard,
  sanitizeUserFacingErrorText,
} from "../lib/clientError";

export type AppLanguage = "fa" | "en";

const STORAGE_KEY = "sedabox.language";
const DEFAULT_LANGUAGE: AppLanguage = "fa";
const RTL_LANGUAGES = new Set<AppLanguage>(["fa"]);

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const EXACT_FA_TO_EN: Record<string, string> = {
  "خانه": "Home",
  "جستجو": "Search",
  "کتابخانه": "Library",
  "پروفایل": "Profile",
  "تنظیمات": "Settings",
  "تنظیمات عمومی": "General",
  "زبان": "Language",
  "زبان برنامه": "App language",
  "فارسی": "Persian",
  "انگلیسی": "English",
  "انتخاب زبان": "Choose language",
  "زبان با موفقیت تغییر کرد": "Language changed successfully",
  "اعلان‌ها": "Notifications",
  "اعلان جدیدی وجود ندارد": "No new notifications",
  "همه خوانده شد": "All marked as read",
  "کیفیت پخش": "Streaming quality",
  "تغییر کیفیت پخش": "Change streaming quality",
  "انتخاب کیفیت پخش": "Choose streaming quality",
  "کیفیت پخش تغییر یافت": "Streaming quality updated",
  "کیفیت پخش متوسط (128kbps)": "Standard quality (128 kbps)",
  "کیفیت بالا (320kbps)": "High quality (320 kbps)",
  "160 kbps - توصیه شده": "160 kbps - Recommended",
  "320 kbps - کیفیت عالی (مخصوص پریمیوم)": "320 kbps - Best quality (Premium only)",
  "امنیت و رمز عبور": "Security & password",
  "مدیریت دستگاه‌ها": "Manage devices",
  "مشاهده دستگاه‌های فعال": "View active devices",
  "دستگاه‌های فعال": "Active devices",
  "دستگاه شما": "Your device",
  "ویرایش": "Edit",
  "ویرایش پروفایل": "Edit profile",
  "ذخیره تغییرات": "Save changes",
  "در حال ذخیره...": "Saving...",
  "تنظیمات ذخیره شد": "Settings saved",
  "تنظیمات با موفقیت ذخیره شد": "Settings saved successfully",
  "خطا در ذخیره تنظیمات": "Could not save settings",
  "نام": "First name",
  "نام خانوادگی": "Last name",
  "نام خود را وارد کنید": "Enter your first name",
  "نام خانوادگی خود را وارد کنید": "Enter your last name",
  "ایمیل": "Email",
  "ایمیل خود را وارد کنید": "Enter your email",
  "شماره موبایل": "Mobile number",
  "رمز عبور": "Password",
  "رمز عبور جدید": "New password",
  "تایید رمز عبور": "Confirm password",
  "رمز فعلی": "Current password",
  "تغییر رمز عبور": "Change password",
  "در حال تغییر رمز عبور...": "Changing password...",
  "رمز فعلی اشتباه است": "The current password is incorrect",
  "رمز عبور با تکرار آن مطابقت ندارد": "Passwords do not match",
  "رمز عبور و تکرار آن مطابقت ندارند": "Passwords do not match",
  "رمز عبور با موفقیت تغییر کرد": "Password changed successfully",
  "تغییر رمز عبور با شکست مواجه شد": "Could not change password",
  "ورود": "Log in",
  "ورود به حساب": "Log in",
  "ورود به صداباکس": "Log in to SedaBox",
  "ورود با رمز عبور": "Log in with password",
  "ورود با کد یکبار مصرف": "Log in with one-time code",
  "در حال ورود به حساب کاربری...": "Logging in...",
  "خروج از حساب کاربری": "Log out",
  "ثبت نام": "Sign up",
  "ثبت‌نام": "Sign up",
  "ثبت‌نام رایگان": "Sign up free",
  "ساخت حساب رایگان": "Create a free account",
  "در حال ایجاد حساب کاربری...": "Creating account...",
  "بازیابی رمز عبور": "Reset password",
  "رمز عبور خود را فراموش کرده‌اید؟": "Forgot your password?",
  "ارسال کد بازیابی": "Send recovery code",
  "در حال ارسال کد بازیابی...": "Sending recovery code...",
  "کد بازیابی برای شما ارسال شد": "A recovery code was sent to you",
  "کد تایید": "Verification code",
  "ارسال مجدد کد": "Resend code",
  "در حال ارسال کد تایید...": "Sending verification code...",
  "کد تایید برای شما ارسال شد": "A verification code was sent to you",
  "کد تایید با موفقیت ارسال شد": "Verification code sent successfully",
  "کد تایید وارد شده اشتباه است": "The verification code is incorrect",
  "کد تایید منقضی شده است": "The verification code has expired",
  "تایید کد ناموفق بود": "Code verification failed",
  "تایید": "Confirm",
  "مرحله بعد": "Next",
  "بازگشت": "Back",
  "بازگشت به خانه": "Back to home",
  "بازگشت به جستجو": "Back to search",
  "بازگشت به ورود": "Back to login",
  "← بازگشت به مراحل قبل": "← Back to previous steps",
  "بستن": "Close",
  "بستن پنجره": "Close dialog",
  "بستن جستجو": "Close search",
  "بستن سایدبار": "Close sidebar",
  "باز کردن": "Open",
  "باز کردن سایدبار": "Open sidebar",
  "لغو": "Cancel",
  "انصراف": "Cancel",
  "حذف": "Delete",
  "ویرایش پلی‌لیست": "Edit playlist",
  "ایجاد": "Create",
  "در حال بارگذاری...": "Loading...",
  "در حال بارگزاری...": "Loading...",
  "در حال بارگذاری ...": "Loading...",
  "بارگذاری موارد بیشتر": "Load more",
  "تلاش مجدد": "Try again",
  "خطایی رخ داد": "Something went wrong",
  "خطایی رخ داد. لطفاً دوباره تلاش کنید.": "Something went wrong. Please try again.",
  "خطایی رخ داده است. لطفا دوباره تلاش کنید": "Something went wrong. Please try again.",
  "خطای نامشخصی رخ داده است": "An unknown error occurred",
  "خطا در ارتباط با سرور": "Server connection error",
  "خطا در برقراری ارتباط با سرور": "Could not connect to the server",
  "خطا در اتصال شبکه. اتصال اینترنت خود را بررسی کنید.": "Network error. Check your internet connection.",
  "اتصال اینترنت قطع شد. لطفاً شبکه خود را بررسی کنید.": "Internet connection lost. Check your network.",
  "اتصال اینترنت قطع شد. پخش متوقف شد.": "Internet connection lost. Playback stopped.",
  "در حال انتظار برای اتصال اینترنت...": "Waiting for an internet connection...",
  "درخواست نامعتبر": "Invalid request",
  "درخواست نامعتبر است": "The request is invalid",
  "دسترسی غیرمجاز": "Unauthorized",
  "حساب کاربری فعال نیست": "This account is not active",
  "زمان نشست شما به پایان رسیده است، مجدداً وارد شوید": "Your session has expired. Please log in again.",
  "نشست پیدا نشد": "Session not found",
  "نشستی یافت نشد": "No session found",
  "نشست با موفقیت لغو شد": "Session revoked successfully",
  "نشست لغو شد": "Session revoked",
  "توکن رفرش نامعتبر است": "Invalid refresh token",
  "نام کاربری یا رمز عبور اشتباه است": "Incorrect username or password",
  "شماره همراه نامعتبر است.": "Invalid mobile number.",
  "شماره همراه یافت نشد": "Mobile number not found",
  "این شماره همراه قبلاً در سیستم وجود دارد": "This mobile number is already registered",
  "این کاربر قبلاً ثبت‌نام کرده است": "This user is already registered",
  "شناسه منحصر به فرد قبلا استفاده شده است": "This unique ID is already in use",
  "برای پیدا کردن پروفایل شما در جستجو استفاده می‌شود": "Used to find your profile in search",
  "تصویر پروفایل با موفقیت آپلود شد": "Profile image uploaded successfully",
  "تصویر پروفایل با موفقیت حذف شد": "Profile image removed successfully",
  "در حال آپلود تصویر...": "Uploading image...",
  "در حال حذف تصویر...": "Removing image...",
  "آیا از حذف تصویر پروفایل خود مطمئن هستید؟": "Are you sure you want to remove your profile image?",
  "پروفایل با موفقیت بروزرسانی شد": "Profile updated successfully",
  "پروفایل شما": "Your profile",
  "پروفایل کاربر": "User profile",
  "پروفایل یافت نشد": "Profile not found",
  "این پروفایل خودتان است": "This is your profile",
  "این ظاهر پروفایل شما برای دیگران است": "This is how your profile appears to others",
  "مشاهده پروفایل": "View profile",
  "مشاهده پروفایل کاربر": "View user profile",
  "اشتراک‌گذاری پروفایل": "Share profile",
  "اشتراک گذاری پروفایل": "Share profile",
  "اشتراک‌گذاری ممکن نیست": "Sharing is not available",
  "لینک کپی شد": "Link copied",
  "خطا در تولید لینک": "Could not create link",
  "کاربر": "User",
  "کاربران": "Users",
  "کاربر عادی": "Free user",
  "کاربر پریمیوم": "Premium user",
  "نوع حساب:": "Account type:",
  "حساب رایگان": "Free account",
  "حساب Premium ": "Premium account",
  "پلن فعلی": "Current plan",
  "پلن فعلی شما": "Your current plan",
  "پلن رایگان": "Free plan",
  "پلن پریمیوم": "Premium plan",
  "پریمیوم": "Premium",
  "پرمیوم": "Premium",
  "اشتراک ویژه": "Premium subscription",
  "ارتقا به پریمیوم": "Upgrade to Premium",
  "ارتقا به اشتراک ویژه": "Upgrade to Premium",
  "ارتقا به نسخه پرو": "Upgrade to Pro",
  "ارتقا به این پلن": "Upgrade to this plan",
  "انتخاب پلن": "Choose a plan",
  "انتخاب پلن رایگان": "Choose free plan",
  "پریمیوم ماهانه": "Monthly Premium",
  "پلن خریداری شده": "Purchased plan",
  "پرداخت موفق!": "Payment successful!",
  "پرداخت امن": "Secure payment",
  "پردازش تراکنش": "Processing transaction",
  "اتصال به درگاه پرداخت": "Connecting to payment gateway",
  "نهایی‌سازی پرداخت": "Finalizing payment",
  "مبلغ پرداختی": "Amount paid",
  "شماره تراکنش": "Transaction ID",
  "تاریخ انقضا": "Expiration date",
  "وضعیت جدید": "New status",
  "امکانات فعال شده:": "Features activated:",
  "امکانات این پلن:": "Plan features:",
  "ویژگی‌های پلن پریمیوم": "Premium plan features",
  "ویژگی‌های پلن رایگان": "Free plan features",
  "بدون تبلیغات": "Ad-free",
  "بدون تبلیغ": "No ads",
  "پخش آفلاین": "Offline playback",
  "پشتیبانی ۲۴/۷": "24/7 support",
  "دسترسی کامل به همه امکانات": "Full access to all features",
  "دسترسی محدود به امکانات": "Limited feature access",
  "پلی‌لیست نامحدود": "Unlimited playlists",
  "پلی‌لیست محدود": "Limited playlists",
  "الگوریتم کامل": "Full recommendation algorithm",
  "الگوریتم محدود": "Limited recommendation algorithm",
  "موسیقی بدون مرز": "Music without limits",
  "بهترین تجربه موسیقی را انتخاب کنید": "Choose your best music experience",
  "بهترین تجربه موسیقی را با صداباکس داشته باشید": "Enjoy the best music experience with SedaBox",
  "آهنگ": "Song",
  "آهنگ‌ها": "Songs",
  "آلبوم": "Album",
  "آلبوم‌ها": "Albums",
  "هنرمند": "Artist",
  "هنرمندان": "Artists",
  "پلی‌لیست": "Playlist",
  "پلی لیست‌ها": "Playlists",
  "پلی‌لیست‌ها": "Playlists",
  "لیست‌های پخش": "Playlists",
  "اثر": "Release",
  "آثار": "Releases",
  "پخش": "Play",
  "پخش همه": "Play all",
  "پخش بعدی": "Play next",
  "پخش مجدد": "Replay",
  "در حال پخش": "Now playing",
  "صف پخش": "Queue",
  "نمایش صف پخش": "Show queue",
  "صف پخش خالی است": "The queue is empty",
  "آهنگ در صف": "song in queue",
  "به انتهای صف اضافه شد": "Added to the end of the queue",
  "افزودن به صف پخش": "Add to queue",
  "آهنگی برای پخش انتخاب کنید": "Choose a song to play",
  "هنوز آهنگی پخش نکرده‌اید": "You have not played anything yet",
  "آهنگ مشابهی پیدا نشد": "No similar song found",
  "آهنگ‌های پیشنهادی مشابه": "Similar recommended songs",
  "آهنگ‌های مشابه": "Similar songs",
  "پخش آثار هنرمند": "Play artist releases",
  "مشاهده هنرمند": "View artist",
  "اشتراک‌گذاری هنرمند": "Share artist",
  "هنرمند تایید شده": "Verified artist",
  "شنونده ماهانه": "monthly listeners",
  "هنرمندان مشابه": "Similar artists",
  "هنرمند مشابهی یافت نشد": "No similar artist found",
  "هنرمند یافت نشد": "Artist not found",
  "آهنگ پیدا نشد": "Song not found",
  "آلبوم پیدا نشد": "Album not found",
  "پلی‌لیست یافت نشد": "Playlist not found",
  "آهنگ یا پلی‌لیست یافت نشد": "Song or playlist not found",
  "موردی یافت نشد": "Nothing found",
  "نتیجه‌ای یافت نشد": "No results found",
  "جستجوهای اخیر": "Recent searches",
  "پاک کردن جستجو": "Clear search",
  "پاک کردن همه": "Clear all",
  "نتیجه برتر": "Top result",
  "آخرین ترک": "Latest track",
  "جستجوی هنرمندان": "Search artists",
  "جستجو در آهنگ‌ها...": "Search songs...",
  "جستجو در پلی‌لیست‌ها...": "Search playlists...",
  "جستجو در آلبوم‌های لایک‌شده...": "Search liked albums...",
  "جستجو در کتابخانه": "Search your library",
  "لطفاً املای کلمات را بررسی کنید یا از کلمات کلیدی متفاوتی استفاده کنید.": "Check the spelling or try different keywords.",
  "همه": "All",
  "محبوب‌ترین": "Most popular",
  "جدید": "New",
  "پیشنهادی": "Recommended",
  "برای شما": "For you",
  "منتخب‌های امروز": "Today's picks",
  "اکتشافات جدید": "New discoveries",
  "در حال رشد": "Trending",
  "پلی‌لیست‌های پیشنهادی": "Recommended playlists",
  "پلی‌لیست‌های پیشنهادی برای شما": "Recommended playlists for you",
  "هماهنگ با سلیقه و شنیده‌های شما": "Matched to your taste and listening history",
  "پلی‌لیست‌های منتخب": "Featured playlists",
  "پلی‌لیست‌های منتخب، تازه و آماده پخش": "Fresh featured playlists, ready to play",
  "پلی لیست‌های جدید برای شما": "New playlists for you",
  "پلی‌لیست‌های جدید برای شما": "New playlists for you",
  "پلی‌لیست‌های من": "My playlists",
  "پلی‌لیست‌های لایک‌شده": "Liked playlists",
  "آهنگ‌های لایک‌شده": "Liked songs",
  "آهنگ‌های لایک شده": "Liked songs",
  "آلبوم‌های لایک‌شده": "Liked albums",
  "هنرمندان دنبال‌شده": "Followed artists",
  "هنرمندان دنبال شده": "Followed artists",
  "کتابخانه شما": "Your library",
  "تاریخچه دانلودها": "Download history",
  "تاریخچه شما خالی است": "Your history is empty",
  "حذف از تاریخچه": "Remove from history",
  "آیتم از تاریخچه حذف شد": "Item removed from history",
  "مشاهده تاریخچه دانلودها": "View download history",
  "مشاهده تمام آهنگ‌های دریافت شده": "View all downloaded songs",
  "دانلود آهنگ": "Download song",
  "دانلود آثار موسیقی": "Download music",
  "عدم دسترسی به دانلود": "Download unavailable",
  "ایجاد پلی‌لیست جدید": "Create new playlist",
  "ساخت پلی‌لیست جدید": "Create new playlist",
  "یک پلی‌لیست جدید بسازید": "Create a new playlist",
  "پلی‌لیست جدید": "New playlist",
  "پلی‌لیست جدید بسازید": "Create a new playlist",
  "نام پلی‌لیست": "Playlist name",
  "پلی‌لیست من...": "My playlist...",
  "عمومی": "Public",
  "خصوصی": "Private",
  "همه می‌توانند ببینند": "Visible to everyone",
  "فقط شما می‌توانید ببینید": "Visible only to you",
  "این پلی‌لیست هنوز خالی است": "This playlist is empty",
  "هنوز پلی‌لیستی ندارید": "You do not have any playlists yet",
  "هنوز پلی‌لیستی ایجاد نشده": "No playlist has been created yet",
  "شما هنوز پلی‌لیستی نساخته‌اید": "You have not created a playlist yet",
  "افزودن به پلی‌لیست": "Add to playlist",
  "اضافه به پلی‌لیست": "Add to playlist",
  "پلی‌لیست مورد نظر را انتخاب کنید": "Choose a playlist",
  "به پلی‌لیست اضافه شد": "Added to playlist",
  "خطا در افزودن به پلی‌لیست": "Could not add to playlist",
  "این آهنگ قبلاً در این پلی‌لیست وجود دارد": "This song is already in this playlist",
  "پلی‌لیست لایک شد": "Playlist liked",
  "آلبوم لایک شد": "Album liked",
  "به لایک‌ها اضافه شد": "Added to liked items",
  "از لایک‌ها حذف شد": "Removed from liked items",
  "افزودن به لایک‌ها": "Add to liked items",
  "لایک": "Like",
  "پسند": "Like",
  "دوست دارم": "Liked",
  "لغو دنبال کردن": "Unfollow",
  "دنبال کردن": "Follow",
  "دنبال شده": "Following",
  "دنبال می‌کنید": "Following",
  "دنبال‌کننده": "Follower",
  "دنبال‌شونده": "Following",
  "هنوز کسی را دنبال نکرده‌اید": "You are not following anyone yet",
  "هنوز کسی شما را دنبال نمی‌کند": "No one follows you yet",
  "این کاربر هنوز دنبال‌کننده‌ای ندارد": "This user has no followers yet",
  "این کاربر هنوز کسی را دنبال نکرده است": "This user is not following anyone yet",
  "ابتدا وارد شوید": "Please log in first",
  "برای ادامه وارد شوید": "Log in to continue",
  "برای انجام این کار وارد شوید": "Log in to do this",
  "برای این عمل باید وارد شوید": "You need to log in for this action",
  "لطفا ابتدا وارد حساب خود شوید": "Please log in first",
  "ادامه به‌صورت مهمان": "Continue as guest",
  "شروع گوش دادن": "Start listening",
  "رفتن به بخش اکتشاف": "Go to Discover",
  "مشاهده بیشتر": "View more",
  "مشاهده همه": "View all",
  "نمایش بیشتر": "Show more",
  "نمایش کمتر": "Show less",
  "نمایش همه": "Show all",
  "نمایش کامل متن": "Show full text",
  "نمایش اشعار": "Show lyrics",
  "متن آهنگ": "Lyrics",
  "متن آهنگ یافت نشد": "Lyrics not found",
  "هنوز متنی برای این آهنگ ثبت نشده است": "Lyrics have not been added for this song yet",
  "جزئیات آهنگ": "Song details",
  "عوامل": "Credits",
  "آهنگساز": "Composer",
  "ناشر": "Label",
  "مدت": "Duration",
  "عنوان": "Title",
  "توضیحات": "Description",
  "بدون توضیحات": "No description",
  "ژانر": "Genre",
  "ژانرها": "Genres",
  "مرور بر اساس ژانر": "Browse by genre",
  "سبک‌های موسیقی مورد علاقه": "Favorite music genres",
  "احساسات": "Moods",
  "شبکه‌های اجتماعی": "Social media",
  "دنبال کنید در": "Follow on",
  "پادکست": "Podcast",
  "خواننده": "Singer",
  "گروه موسیقی": "Band",
  "تأیید شده": "Verified",
  "حساب رسمی صداباکس": "Official SedaBox account",
  "ایجاد شده توسط": "Created by",
  "ایجاد شده توسط صداباکس": "Created by SedaBox",
  "از صداباکس": "by SedaBox",
  "صداباکس": "SedaBox",
  "صدا باکس": "SedaBox",
  "وب اپلیکیشن صداباکس": "SedaBox web app",
  "به روز بمانید": "Stay up to date",
  "جدیدترین ریلیز ها": "Latest releases",
  "آخرین ریلیز": "Latest release",
  "آخرین آهنگ‌ها": "Latest songs",
  "انتشار تازه": "Fresh release",
  "انتشار جدید": "New release",
  "آلبوم‌های محبوب": "Popular albums",
  "هنرمندان محبوب": "Popular artists",
  "برترین آهنگ‌ها": "Top songs",
  "برترین آهنگ‌های روز": "Top songs today",
  "برترین آهنگ‌های هفته": "Top songs this week",
  "برترین آلبوم‌های روز": "Top albums today",
  "برترین آلبوم‌های هفته": "Top albums this week",
  "برترین هنرمندان روز": "Top artists today",
  "برترین هنرمندان هفته": "Top artists this week",
  "برترین‌های امروز": "Today's top picks",
  "اهنگ های برتر": "Top songs",
  "آلبوم‌های ترند شده امروز": "Today's trending albums",
  "آلبوم‌های برتر هفته اخیر": "Top albums this week",
  "هنرمندانی که امروز بیشترین مخاطب را داشتند": "Today's most-listened-to artists",
  "پرشنونده‌ترین‌های امروز در سراسر جهان": "Today's most-listened-to worldwide",
  "پیشنهاد امروز": "Today's recommendation",
  "پیشنهاد ویژه": "Special offer",
  "بهترین‌های صنعت موسیقی": "The best in music",
  "ویژه‌ها": "Featured",
  "موسیقی برای هر لحظه": "Music for every moment",
  "انتخاب‌هایی آماده برای هر حال‌وهوا": "Picks for every mood",
  "آرامش": "Chill",
  "ورزش": "Workout",
  "مهمانی": "Party",
  "برای رانندگی": "For driving",
  "خواب": "Sleep",
  "تمرکز عمیق": "Deep focus",
  "کافه": "Cafe",
  "تنهایی": "Alone",
  "عشق": "Love",
  "تصادفی": "Shuffle",
  "تغییر ترتیب": "Reorder",
  "نمای شبکه‌ای": "Grid view",
  "نمای لیستی": "List view",
  "نمایش شبکه‌ای": "Grid view",
  "نمایش لیستی": "List view",
  "تغییر نمایش": "Change view",
  "پایان نتایج کتابخانه": "End of library results",
  "پایان لیست هنرمندان": "End of artist list",
  "برای شروع": "To get started",
  "مناسب برای شروع": "Great for getting started",
  "امکانات انحصاری": "Exclusive features",
  "موسیقی بدون کلام برای تمرکز بیشتر": "Instrumental music for better focus",
  "موسیقی را بر اساس دسته‌بندی کشف کن": "Discover music by category",
  "با این پلی‌لیست‌ها انرژی بگیر": "Power up with these playlists",
  "با صداهای آرامش‌بخش بخواب": "Sleep with calming sounds",
  "موزیک برای استراحت": "Music for relaxing",
  "موزیک ملایم برای کار": "Soft music for work",
  "پخش آنلاین موسیقی": "Online music streaming",
  "پخش آنلاین موسیقی بدون محدودیت": "Unlimited online music streaming",
  "پخش آنلاین موسیقی با تبلیغ صوتی / بنری": "Online streaming with audio/banner ads",
  "پخش کامل، لایک، دنبال‌کردن هنرمند و پلی‌لیست‌های شخصی.": "Full playback, likes, artist follows, and personal playlists.",
  "پیش‌نمایش ۳۰ ثانیه‌ای · ورود برای پخش کامل": "30-second preview · Log in for full playback",
  "پیش‌نمایش این آهنگ هنوز آماده نشده است.": "This song preview is not ready yet.",
  "پیش‌نمایش در دسترس نیست؛ کمی بعد دوباره تلاش کنید.": "Preview unavailable; try again shortly.",
  "فایل پخش این آهنگ در دسترس نیست.": "The audio file for this song is unavailable.",
  "تبلیغ": "Ad",
  "گزارش محتوا": "Report content",
  "گزارش هنرمند": "Report artist",
  "گزارش کاربر": "Report user",
  "دلیل گزارش شما چیست؟": "Why are you reporting this?",
  "اطلاعات نادرست": "Incorrect information",
  "محتوای نامناسب": "Inappropriate content",
  "نقض کپی‌رایت": "Copyright infringement",
  "سایر موارد": "Other",
  "توضیحات تکمیلی (اجباری):": "Additional details (required):",
  "لطفاً توضیحات خود را وارد کنید": "Please enter details",
  "لطفاً دلیل گزارش خود را به طور کامل شرح دهید...": "Describe the reason for your report...",
  "ثبت نهایی گزارش": "Submit report",
  "در حال ارسال...": "Sending...",
  "خطا در ثبت گزارش": "Could not submit report",
  "گزارش شما با موفقیت ثبت شد و در حال بررسی است": "Your report was submitted and is under review",
  "بررسی در کمتر از ۲۴ ساعت": "Reviewed within 24 hours",
  "رد کردن": "Skip",
  "محدودیت در رد کردن آهنگ (Skip)": "Limited song skips",
  "مخلوط کردن صف پخش (shuffle)": "Shuffle the queue",
  "Skip نامحدود": "Unlimited skips",
  "تومان": "Toman",
  "روز": "day",
  "هفته": "week",
  "ماه": "month",
  "ساعت": "hour",
  "دقیقه": "minute",
  "ثانیه": "second",
  "بالا": "High",
  "متوسط": "Standard",
  "رایگان": "Free",
  "شروع": "Start",
  "اتمام": "Finish",
  "بخش بعدی": "Next section",
  "بخش قبلی": "Previous section",
  "بخش انتخاب شده یافت نشد": "The selected section was not found",
  "مورد فعال": "active items",
  "آمار و فعالیت‌ها": "Stats & activity",
  "آمار فعالیتی": "Activity stats",
  "اخیراً پخش شده": "Recently played",
  "آهنگ‌های اخیراً پخش شده": "Recently played songs",
  "اردیبهشت ۱۴۰۲": "May 2023",
  "هیچ": "None",
  "ناشناخته": "Unknown",
};

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EN_DIGITS = "0123456789";
const PERSIAN_RE = /[\u0600-\u06ff]/;

function normalizeFa(input: string): string {
  return input
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200f|\u200e/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function toEnglishDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (char) => {
    const faIndex = FA_DIGITS.indexOf(char);
    if (faIndex >= 0) return EN_DIGITS[faIndex];
    const arIndex = AR_DIGITS.indexOf(char);
    return arIndex >= 0 ? EN_DIGITS[arIndex] : char;
  });
}

function preserveOuterWhitespace(original: string, translated: string): string {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  return `${leading}${translated}${trailing}`;
}

function dynamicFaToEn(input: string): string | null {
  const value = normalizeFa(input);
  let match: RegExpMatchArray | null;

  // Put compound templates before short suffix rules such as "X songs" or
  // "X minutes" so a trailing word cannot cause a partial translation.
  if ((match = value.match(/^گوش دادن به پلی‌لیست (.+?) در وب اپلیکیشن صداباکس - شامل (.+?) آهنگ$/))) {
    return `Listen to the playlist ${match[1]} on the SedaBox web app — ${toEnglishDigits(match[2])} songs`;
  }
  if ((match = value.match(/^(.+?) ساعت و (.+?) دقیقه$/))) {
    return `${toEnglishDigits(match[1])} hours ${toEnglishDigits(match[2])} minutes`;
  }
  if ((match = value.match(/^پخش مجدد (.+?)$/))) return `Play ${match[1]} again`;
  if ((match = value.match(/^مشاهده هنرمند (.+?) در (?:سدا|صدا)باکس$/))) {
    return `View ${match[1]} on SedaBox`;
  }
  if ((match = value.match(/^(.+?) لیست پخش عمومی$/))) {
    return `${toEnglishDigits(match[1])} public playlists`;
  }
  if ((match = value.match(/^اثر (.+?)$/))) return `by ${match[1]}`;

  if ((match = value.match(/^(.+?)\s+روز پیش$/))) return `${toEnglishDigits(match[1])} days ago`;
  if ((match = value.match(/^(.+?)\s+ساعت پیش$/))) return `${toEnglishDigits(match[1])} hours ago`;
  if ((match = value.match(/^(.+?)\s+دقیقه پیش$/))) return `${toEnglishDigits(match[1])} minutes ago`;
  if ((match = value.match(/^(.+?)\s+ثانیه پیش$/))) return `${toEnglishDigits(match[1])} seconds ago`;
  if ((match = value.match(/^(.+?)\s+دنبال‌کننده$/))) return `${toEnglishDigits(match[1])} followers`;
  if ((match = value.match(/^(.+?)\s+شنونده ماهانه$/))) return `${toEnglishDigits(match[1])} monthly listeners`;
  if ((match = value.match(/^(.+?)\s+آهنگ$/))) return `${toEnglishDigits(match[1])} songs`;
  if ((match = value.match(/^(.+?)\s+آلبوم$/))) return `${toEnglishDigits(match[1])} albums`;
  if ((match = value.match(/^(.+?)\s+پلی‌لیست عمومی$/))) return `${toEnglishDigits(match[1])} public playlists`;
  if ((match = value.match(/^(.+?)\s+پخش$/))) return `${toEnglishDigits(match[1])} plays`;
  if ((match = value.match(/^لطفا\s+(.+?)\s+ثانیه صبر کنید و سپس دوباره امتحان کنید$/))) {
    return `Please wait ${toEnglishDigits(match[1])} seconds and try again`;
  }
  if ((match = value.match(/^گوش دادن به آهنگ\s+(.+?)\s+از\s+(.+?)\s+در صداباکس$/))) {
    return `Listen to ${match[1]} by ${match[2]} on SedaBox`;
  }
  if ((match = value.match(/^گوش دادن به آلبوم\s+(.+?)\s+از\s+(.+?)\s+در صداباکس$/))) {
    return `Listen to the album ${match[1]} by ${match[2]} on SedaBox`;
  }
  if ((match = value.match(/^گوش دادن به پلی‌لیست\s+(.+?)\s+در صداباکس$/))) {
    return `Listen to the playlist ${match[1]} on SedaBox`;
  }
  if ((match = value.match(/^مشاهده هنرمند\s+(.+?)\s+در صداباکس$/))) {
    return `View ${match[1]} on SedaBox`;
  }
  if ((match = value.match(/^(.+?)\s+شروع به دنبال کردن شما کرد\.?$/))) {
    return `${match[1]} started following you.`;
  }
  if ((match = value.match(/^آهنگ جدید ['«](.+?)['»] از (.+?) منتشر شد!?$/))) {
    return `New song “${match[1]}” by ${match[2]} was released!`;
  }
  if ((match = value.match(/^آلبوم جدید ['«](.+?)['»] از (.+?) منتشر شد!?$/))) {
    return `New album “${match[1]}” by ${match[2]} was released!`;
  }

  // Complete coverage for application-generated dynamic copy. These patterns
  // translate sentence templates only; names and user-authored titles remain
  // exactly as supplied by the API.
  if ((match = value.match(/^گوش دادن به آهنگ (.+?) از (.+?) در (?:سدا|صدا)باکس$/))) {
    return `Listen to ${match[1]} by ${match[2]} on SedaBox`;
  }
  if ((match = value.match(/^گوش دادن به آلبوم (.+?) از (.+?) در (?:سدا|صدا)باکس$/))) {
    return `Listen to the album ${match[1]} by ${match[2]} on SedaBox`;
  }
  if ((match = value.match(/^گوش دادن به پلی‌لیست (.+?) در (?:سدا|صدا)باکس$/))) {
    return `Listen to the playlist ${match[1]} on SedaBox`;
  }
  if ((match = value.match(/^گوش دادن به (.+?) از (.+?) در (?:سدا|صدا)باکس$/))) {
    return `Listen to ${match[1]} by ${match[2]} on SedaBox`;
  }
  if ((match = value.match(/^درحال گوش دادن به (.+?) از (.+?) در (?:سدا|صدا)باکس$/))) {
    return `Now listening to ${match[1]} by ${match[2]} on SedaBox`;
  }
  if ((match = value.match(/^شنیدن آهنگ (.+?) از (.+?) در وب اپلیکیشن صداباکس$/))) {
    return `Listen to ${match[1]} by ${match[2]} on the SedaBox web app`;
  }
  if ((match = value.match(/^شنیدن آلبوم (.+?) از (.+?) در وب اپلیکیشن صداباکس$/))) {
    return `Listen to the album ${match[1]} by ${match[2]} on the SedaBox web app`;
  }
  if ((match = value.match(/^گوش دادن به آثار (.+?) در (?:سدا|صدا)باکس$/))) {
    return `Listen to ${match[1]}'s music on SedaBox`;
  }
  if ((match = value.match(/^گوش دادن به آثار (.+?) در وب اپلیکیشن صداباکس(?: - (.*))?$/))) {
    return `Listen to ${match[1]}'s music on the SedaBox web app${match[2] ? ` — ${match[2]}` : ""}`;
  }
  if ((match = value.match(/^گوش دادن به پلی‌لیست (.+?) در وب اپلیکیشن صداباکس - شامل (.+?) آهنگ$/))) {
    return `Listen to the playlist ${match[1]} on the SedaBox web app — ${toEnglishDigits(match[2])} songs`;
  }
  if ((match = value.match(/^پخش (.+?) از (.+?)$/))) return `Play ${match[1]} by ${match[2]}`;
  if ((match = value.match(/^پخش (.+?)$/))) return `Play ${match[1]}`;
  if ((match = value.match(/^پخش مجدد (.+?)$/))) return `Play ${match[1]} again`;
  if ((match = value.match(/^مشاهده هنرمند (.+?)$/))) return `View artist ${match[1]}`;
  if ((match = value.match(/^مشاهده هنرمند (.+?) در (?:سدا|صدا)باکس$/))) return `View ${match[1]} on SedaBox`;
  if ((match = value.match(/^مشاهده آلبوم (.+?) از (.+?)$/))) return `View the album ${match[1]} by ${match[2]}`;
  if ((match = value.match(/^مشاهده لیست پخش (.+?)$/))) return `View playlist ${match[1]}`;
  if ((match = value.match(/^مشاهده پلی‌لیست (.+?)$/))) return `View playlist ${match[1]}`;
  if ((match = value.match(/^مشاهده پروفایل کاربر (.+?)$/))) return `View user profile ${match[1]}`;
  if ((match = value.match(/^مشاهده پروفایل (.+?)$/))) return `View ${match[1]}'s profile`;
  if ((match = value.match(/^گزینه‌های بیشتر برای (.+?)$/))) return `More options for ${match[1]}`;
  if ((match = value.match(/^رفتن به (.+?)$/))) return `Go to ${match[1]}`;
  if ((match = value.match(/^ژانر (.+?)$/))) return `${match[1]} genre`;
  if ((match = value.match(/^آلبوم (.+?) از (.+?)$/))) return `Album ${match[1]} by ${match[2]}`;
  if ((match = value.match(/^هنرمند (.+?)$/))) return `Artist ${match[1]}`;
  if ((match = value.match(/^کاربر (.+?)$/))) return `User ${match[1]}`;
  if ((match = value.match(/^شماره همراه: (.+?)$/))) return `Mobile number: ${match[1]}`;
  if ((match = value.match(/^شناسه: (.+?)$/))) return `ID: ${match[1]}`;
  if ((match = value.match(/^جستجو: (.+?)$/))) return `Search: ${match[1]}`;
  if ((match = value.match(/^قیمت: (.+?) تومان$/))) return `Price: ${toEnglishDigits(match[1])} Toman`;
  if ((match = value.match(/^ارسال مجدد \((.+?)\)$/))) return `Resend (${toEnglishDigits(match[1])})`;
  if ((match = value.match(/^تعداد (.+?) نشست لغو شد$/))) return `${toEnglishDigits(match[1])} sessions were revoked`;
  if ((match = value.match(/^(.+?) مورد فعال$/))) return `${toEnglishDigits(match[1])} active`;
  if ((match = value.match(/^(.+?) ترک$/))) return `${toEnglishDigits(match[1])} tracks`;
  if ((match = value.match(/^(.+?) دقیقه$/))) return `${toEnglishDigits(match[1])} minutes`;
  if ((match = value.match(/^(.+?) ساعت و (.+?) دقیقه$/))) return `${toEnglishDigits(match[1])} hours ${toEnglishDigits(match[2])} minutes`;
  if ((match = value.match(/^(.+?) • آلبوم$/))) return `${toEnglishDigits(match[1])} • Album`;
  if ((match = value.match(/^پلی‌لیست‌های (.+?)$/))) return `${match[1]}'s playlists`;
  if ((match = value.match(/^به زودی موزیک‌های (.+?) در اینجا قرار می‌گیرد\.?$/))) return `${match[1]}'s music will appear here soon.`;
  if ((match = value.match(/^به زودی آهنگ‌های برتر (.+?) در این قسمت نمایش داده خواهد شد\.?$/))) return `Top songs by ${match[1]} will appear here soon.`;
  if ((match = value.match(/^(.+?) یکی از هنرمندان برجسته‌ای است که با آثار خود شناخته می‌شود\.?$/))) return `${match[1]} is a notable artist known for their music.`;
  if ((match = value.match(/^(.+?) یک هنرمند محبوب است که بیوگرافی او در اینجا نمایش داده می‌شود\.?$/))) return `${match[1]} is a popular artist. Their biography appears here.`;
  if ((match = value.match(/^دنبال شد: (.+?)$/))) return `Followed: ${match[1]}`;
  if ((match = value.match(/^لغو دنبال کردن: (.+?)$/))) return `Unfollowed: ${match[1]}`;
  if ((match = value.match(/^به لایک‌ها اضافه شد: (.+?)$/))) return `Added to likes: ${match[1]}`;
  if ((match = value.match(/^از لایک‌ها حذف شد: (.+?)$/))) return `Removed from likes: ${match[1]}`;
  if ((match = value.match(/^حداقل ۳ هنرمند را دنبال کنید \((.+?)\/۳\)$/))) return `Follow at least 3 artists (${toEnglishDigits(match[1])}/3)`;
  if ((match = value.match(/^(.+?)\/۳ دنبال شده$/))) return `${toEnglishDigits(match[1])}/3 followed`;
  if ((match = value.match(/^آیا از حذف «(.+?)» مطمئن هستید\؟ این عمل قابل بازگشت نیست\.?$/))) return `Delete “${match[1]}”? This action cannot be undone.`;
  if ((match = value.match(/^مشاهده (.+?): (.+?)$/))) return `View ${match[1]}: ${toEnglishDigits(match[2])}`;
  if ((match = value.match(/^مشاهده (.+?)(?: اثر (.+?))?$/))) {
    return match[2] ? `View ${match[1]} by ${match[2]}` : `View ${match[1]}`;
  }
  if ((match = value.match(/^(.+?) • انتخابی تازه برای این لحظه$/))) return `${match[1]} • A fresh pick for this moment`;
  if ((match = value.match(/^(.+?) • بر اساس شنیده‌های اخیرت$/))) return `${match[1]} • Based on your recent listening`;
  if ((match = value.match(/^(.+?) • تازه روی صداباکس$/))) return `${match[1]} • New on SedaBox`;
  if ((match = value.match(/^(.+?) • پیشنهادی برای کشف جدید$/))) return `${match[1]} • A fresh discovery`;
  if ((match = value.match(/^(.+?): (.+?)(?: اثر (.+?))?$/))) {
    return match[3] ? `${match[1]}: ${match[2]} by ${match[3]}` : `${match[1]}: ${match[2]}`;
  }
  if ((match = value.match(/^(.+?) از (.+?)$/))) return `${match[1]} by ${match[2]}`;
  return null;
}

export function translateFaToEnglish(input: unknown): string {
  if (input == null) return "";
  const original = String(input);
  if (!PERSIAN_RE.test(original)) return original;

  const normalized = normalizeFa(original);
  const exact = EXTRA_FA_TO_EN[normalized] ?? EXACT_FA_TO_EN[normalized];
  if (exact) return preserveOuterWhitespace(original, exact);

  const dynamic = dynamicFaToEn(normalized);
  if (dynamic) return preserveOuterWhitespace(original, dynamic);

  // Never fabricate "English" by romanizing Persian. Server-owned content
  // must arrive through explicit *_en fields, and application copy must exist
  // in the exact/dynamic catalog above. Keeping unknown authored text unchanged
  // is safer than displaying broken Finglish.
  return original;
}

let activeLanguage: AppLanguage = DEFAULT_LANGUAGE;

function readStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const domLanguage = document.documentElement.lang?.toLowerCase();
  if (domLanguage === "en" || domLanguage === "fa") return domLanguage;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "fa" ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

activeLanguage = DEFAULT_LANGUAGE;

export function getActiveLanguage(): AppLanguage {
  return activeLanguage;
}

export function translate(input: unknown, language: AppLanguage = activeLanguage): string {
  const value = input == null ? "" : String(input);
  return language === "en" ? translateFaToEnglish(value) : value;
}

export function localizeField<T extends Record<string, any>>(
  object: T | null | undefined,
  field: string,
  language: AppLanguage = activeLanguage,
): string {
  if (!object) return "";
  const fa = object[`${field}_fa`] ?? object[field] ?? "";
  const en = object[`${field}_en`] ?? "";
  if (language === "en") return String(en || translateFaToEnglish(fa));
  return String(fa || object[field] || en);
}

export function directionForValue(value: unknown): "ltr" | "rtl" | "auto" {
  const text = String(value ?? "").trim();
  if (!text) return "auto";
  if (/^(?:https?:\/\/|www\.|mailto:|tel:)/i.test(text)) return "ltr";
  if (/^[\d\s+().,/:\-_@]+$/.test(toEnglishDigits(text))) return "ltr";
  if (/^[^\u0600-\u06ff]*$/.test(text)) return "ltr";
  return "rtl";
}

interface I18nContextValue {
  language: AppLanguage;
  direction: "rtl" | "ltr";
  locale: "fa-IR" | "en-US";
  isRTL: boolean;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (input: unknown) => string;
  localize: <T extends Record<string, any>>(object: T | null | undefined, field: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const TRANSLATABLE_ATTRIBUTES = ["placeholder", "title", "aria-label", "alt", "content"] as const;
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

function isIgnored(node: Node): boolean {
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  return Boolean(element?.closest("[data-i18n-ignore],script,style,code,pre"));
}

function processInputDirection(element: Element): void {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return;
  const type = element instanceof HTMLInputElement ? element.type.toLowerCase() : "textarea";
  const fixedLtr = ["tel", "number", "email", "url", "password"].includes(type)
    || element.inputMode === "numeric"
    || element.inputMode === "decimal"
    || element.autocomplete === "one-time-code"
    || element.dataset.directionFixed === "ltr";
  if (fixedLtr) {
    element.dir = "ltr";
    element.dataset.directionFixed = "ltr";
    element.classList.add("sb-fixed-ltr");
  } else if (!element.dataset.directionFixed) {
    element.dir = "auto";
  }
}

function processElement(element: Element, language: AppLanguage): void {
  if (isIgnored(element)) return;
  processInputDirection(element);

  let attrMap = originalAttributes.get(element);
  if (!attrMap) {
    attrMap = new Map<string, string>();
    originalAttributes.set(element, attrMap);
  }

  for (const attribute of TRANSLATABLE_ATTRIBUTES) {
    const current = element.getAttribute(attribute);
    if (current == null) continue;
    if (language === "en") {
      const stored = attrMap.get(attribute);
      if (PERSIAN_RE.test(current)) {
        attrMap.set(attribute, current);
      } else if (stored != null && current !== translateFaToEnglish(stored)) {
        // React or the API supplied a new native-English value on the same DOM
        // node. Do not overwrite it with the translation of a stale Farsi value.
        attrMap.delete(attribute);
        continue;
      }
      const source = attrMap.get(attribute) ?? current;
      const translated = translateFaToEnglish(source);
      if (translated !== current) element.setAttribute(attribute, translated);
    } else {
      const source = attrMap.get(attribute);
      if (source != null) {
        const translated = translateFaToEnglish(source);
        if (current === translated && source !== current) element.setAttribute(attribute, source);
        else if (current !== translated && current !== source) attrMap.delete(attribute);
      }
    }
  }
}

function processTextNode(node: Text, language: AppLanguage): void {
  if (isIgnored(node)) return;
  const current = node.nodeValue ?? "";
  if (!current.trim()) return;

  if (language === "en") {
    const stored = originalText.get(node);
    if (PERSIAN_RE.test(current)) {
      originalText.set(node, current);
    } else if (stored != null && current !== translateFaToEnglish(stored)) {
      // The same text node was reused with genuine English content.
      originalText.delete(node);
      return;
    }
    const source = originalText.get(node) ?? current;
    const translated = translateFaToEnglish(source);
    if (translated !== current) node.nodeValue = translated;
  } else {
    const source = originalText.get(node);
    if (source != null) {
      const translated = translateFaToEnglish(source);
      if (current === translated && source !== current) node.nodeValue = source;
      else if (current !== translated && current !== source) originalText.delete(node);
    }
  }
}

function localizeDom(root: Node, language: AppLanguage): void {
  if (root.nodeType === Node.TEXT_NODE) {
    processTextNode(root as Text, language);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;

  if (root.nodeType === Node.ELEMENT_NODE) processElement(root as Element, language);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) processTextNode(current as Text, language);
    else processElement(current as Element, language);
    current = walker.nextNode();
  }
}

function applyDocumentLanguage(language: AppLanguage): void {
  activeLanguage = language;
  const direction = RTL_LANGUAGES.has(language) ? "rtl" : "ltr";
  document.documentElement.lang = language;
  document.documentElement.dir = direction;
  document.documentElement.dataset.language = language;
  document.body?.setAttribute("dir", direction);
}

function patchFetchForLanguage(_languageRef: React.MutableRefObject<AppLanguage>): () => void {
  // The singleton guard is installed synchronously from _app before React
  // renders. Calling it here is an idempotent safety net for alternate entry
  // points and tests. It intentionally survives provider/StrictMode remounts.
  return installClientFetchGuard();
}

function patchNativeDialogs(languageRef: React.MutableRefObject<AppLanguage>): () => void {
  const originalAlert = window.alert.bind(window);
  const originalConfirm = window.confirm.bind(window);
  const originalPrompt = window.prompt.bind(window);
  const localizeDialogMessage = (message?: unknown) => {
    const raw = message == null ? "" : String(message);
    const safe = sanitizeUserFacingErrorText(raw, languageRef.current, raw);
    return translate(safe, languageRef.current);
  };
  window.alert = (message?: any) => originalAlert(localizeDialogMessage(message));
  window.confirm = (message?: string) => originalConfirm(localizeDialogMessage(message));
  window.prompt = (message?: string, defaultValue?: string) =>
    originalPrompt(localizeDialogMessage(message), defaultValue);

  const nav = navigator as Navigator & { share?: (data?: ShareData) => Promise<void> };
  const originalShare = typeof nav.share === "function" ? nav.share.bind(nav) : null;
  if (originalShare) {
    try {
      Object.defineProperty(nav, "share", {
        configurable: true,
        value: (data?: ShareData) => originalShare({
          ...data,
          title: data?.title ? translate(data.title, languageRef.current) : data?.title,
          text: data?.text ? translate(data.text, languageRef.current) : data?.text,
        }),
      });
    } catch {
      // Some browsers expose navigator.share as a non-configurable property.
    }
  }

  return () => {
    window.alert = originalAlert;
    window.confirm = originalConfirm;
    window.prompt = originalPrompt;
    if (originalShare) {
      try {
        Object.defineProperty(nav, "share", { configurable: true, value: originalShare });
      } catch {
        // Ignore non-configurable browser implementations.
      }
    }
  };
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE);
  const languageRef = useRef<AppLanguage>(language);
  const languageChangeRevisionRef = useRef(0);

  const setLanguage = useCallback((next: AppLanguage) => {
    if (next !== "fa" && next !== "en") return;
    languageChangeRevisionRef.current += 1;
    languageRef.current = next;
    activeLanguage = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing/storage restrictions should not block language changes.
    }
    if (isNativeAndroid()) {
      // Native Preferences survives WebView storage recreation. Keep the UI
      // update synchronous and mirror the choice durably in the background.
      void nativePreferences.set(STORAGE_KEY, next).catch((error) => {
        console.warn("Could not persist native language preference", error);
      });
    }
    applyDocumentLanguage(next);
    setLanguageState(next);
    window.dispatchEvent(new CustomEvent("sedabox:language-change", { detail: { language: next } }));
  }, []);

  useIsomorphicLayoutEffect(() => {
    let active = true;
    // Hydrate with the same default used on the server, then adopt the value
    // that the pre-hydration script read from localStorage before first paint.
    const initialLanguage = readStoredLanguage();
    languageRef.current = initialLanguage;
    applyDocumentLanguage(initialLanguage);
    localizeDom(document.body, initialLanguage);
    delete document.documentElement.dataset.i18nPending;
    document.documentElement.dataset.i18nReady = "true";
    if (initialLanguage !== language) setLanguageState(initialLanguage);

    if (isNativeAndroid()) {
      const hydrationRevision = languageChangeRevisionRef.current;
      void nativePreferences.get(STORAGE_KEY)
        .then(async (value) => {
          if (!active || languageChangeRevisionRef.current !== hydrationRevision) return;
          if (value === "fa" || value === "en") {
            if (value !== languageRef.current) setLanguage(value);
            return;
          }
          // Migrate the existing WebView choice for users upgrading from older
          // native builds instead of resetting them to the default language.
          await nativePreferences.set(STORAGE_KEY, languageRef.current);
        })
        .catch((error) => {
          console.warn("Could not restore native language preference", error);
        });
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") localizeDom(mutation.target, languageRef.current);
        if (mutation.type === "attributes" && mutation.target instanceof Element) processElement(mutation.target, languageRef.current);
        for (const node of Array.from(mutation.addedNodes)) localizeDom(node, languageRef.current);
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
    });

    const restoreFetch = patchFetchForLanguage(languageRef);
    const restoreDialogs = patchNativeDialogs(languageRef);
    return () => {
      active = false;
      observer.disconnect();
      restoreFetch();
      restoreDialogs();
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    // The initialization effect can choose English while the hydration-safe
    // state is still Farsi. Skip that stale commit and apply the next one.
    if (languageRef.current !== language) return;
    applyDocumentLanguage(language);
    localizeDom(document.body, language);
    delete document.documentElement.dataset.i18nPending;
    document.documentElement.dataset.i18nReady = "true";
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    direction: language === "fa" ? "rtl" : "ltr",
    locale: language === "fa" ? "fa-IR" : "en-US",
    isRTL: language === "fa",
    setLanguage,
    toggleLanguage: () => setLanguage(language === "fa" ? "en" : "fa"),
    t: (input) => translate(input, language),
    localize: (object, field) => localizeField(object, field, language),
  }), [language, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}

import type { AppLanguage } from "./I18nContext";
import { getUserFacingErrorMessage } from "../lib/clientError";

type Copy = { fa: string; en: string };

const ERROR_COPY: Record<string, Copy> = {
  VALIDATION_ERROR: {
    fa: "لطفاً اطلاعات واردشده را بررسی کنید.",
    en: "Please check the information you entered.",
  },
  INVALID_PHONE: {
    fa: "شماره موبایل معتبر وارد کنید.",
    en: "Enter a valid mobile number.",
  },
  USER_EXISTS: {
    fa: "این شماره موبایل قبلاً ثبت شده است.",
    en: "This mobile number is already registered.",
  },
  USER_BANNED: {
    fa: "این حساب کاربری مسدود شده است.",
    en: "This account has been suspended.",
  },
  SMS_FAILED: {
    fa: "ارسال کد تأیید انجام نشد. کمی بعد دوباره تلاش کنید.",
    en: "We could not send the verification code. Please try again shortly.",
  },
  OTP_NOT_FOUND: {
    fa: "کد معتبری پیدا نشد. یک کد جدید درخواست کنید.",
    en: "No valid code was found. Request a new code.",
  },
  OTP_EXCEEDED: {
    fa: "تعداد تلاش‌ها بیش از حد مجاز است. یک کد جدید درخواست کنید.",
    en: "Too many attempts. Request a new verification code.",
  },
  OTP_INVALID: {
    fa: "کد تأیید واردشده درست نیست.",
    en: "The verification code is incorrect.",
  },
  AUTH_FAILED: {
    fa: "شماره موبایل یا رمز عبور نادرست است.",
    en: "The mobile number or password is incorrect.",
  },
  ACCOUNT_LOCKED: {
    fa: "به‌دلیل تلاش‌های ناموفق، ورود موقتاً محدود شده است.",
    en: "Sign-in is temporarily locked after repeated failed attempts.",
  },
  PHONE_NOT_REGISTERED: {
    fa: "حسابی با این شماره موبایل پیدا نشد.",
    en: "No account was found for this mobile number.",
  },
  NOT_FOUND: {
    fa: "مورد درخواستی پیدا نشد.",
    en: "The requested item was not found.",
  },
  TOKEN_INVALID: {
    fa: "نشست ورود معتبر نیست. دوباره وارد حساب شوید.",
    en: "Your sign-in session is invalid. Please log in again.",
  },
  TOKEN_REVOKED: {
    fa: "این نشست منقضی یا لغو شده است. دوباره وارد شوید.",
    en: "This session has expired or was revoked. Please log in again.",
  },
  REFRESH_TOKEN_REQUIRED: {
    fa: "اطلاعات نشست فعلی در دسترس نیست. دوباره وارد شوید.",
    en: "The current session information is unavailable. Please log in again.",
  },
  INVALID_PASSWORD: {
    fa: "رمز عبور فعلی نادرست است.",
    en: "The current password is incorrect.",
  },
  SESSION_NOT_FOUND: {
    fa: "این نشست پیدا نشد یا قبلاً لغو شده است.",
    en: "This session was not found or has already been revoked.",
  },
  CURRENT_SESSION_INVALID: {
    fa: "نشست فعلی نامعتبر یا منقضی شده است. دوباره وارد شوید.",
    en: "Your current session is invalid or expired. Please log in again.",
  },
  ARTIST_ONLY: {
    fa: "این بخش فقط برای حساب هنرمند در دسترس است.",
    en: "This section is available only to artist accounts.",
  },
  SUBMISSION_EXISTS: {
    fa: "درخواست احراز هویت قبلاً ثبت شده است.",
    en: "An authentication submission already exists.",
  },
  ARTIST_AUTH_NOT_FOUND: {
    fa: "درخواست احراز هویت هنرمند پیدا نشد.",
    en: "The artist authentication submission was not found.",
  },
  AUTHENTICATION_REQUIRED: {
    fa: "برای ادامه باید وارد حساب شوید.",
    en: "You need to log in to continue.",
  },
  BAD_REQUEST: {
    fa: "درخواست نامعتبر است.",
    en: "The request is invalid.",
  },
  PERMISSION_DENIED: {
    fa: "اجازه انجام این کار را ندارید.",
    en: "You do not have permission to perform this action.",
  },
  SERVER_ERROR: {
    fa: "سرور نتوانست درخواست را انجام دهد. لطفاً کمی بعد دوباره تلاش کنید.",
    en: "The server could not complete the request. Please try again shortly.",
  },
  INVALID_JSON: {
    fa: "اطلاعات ارسال‌شده معتبر نیست.",
    en: "The submitted request data is not valid.",
  },
  METHOD_NOT_ALLOWED: {
    fa: "این عملیات با روش فعلی پشتیبانی نمی‌شود.",
    en: "This operation is not supported with the current request method.",
  },
  UNSUPPORTED_MEDIA_TYPE: {
    fa: "نوع اطلاعات ارسال‌شده پشتیبانی نمی‌شود.",
    en: "The submitted content type is not supported.",
  },
};

const FIELD_LABELS: Record<string, Copy> = {
  phone: { fa: "شماره موبایل", en: "Mobile number" },
  password: { fa: "رمز عبور", en: "Password" },
  currentPassword: { fa: "رمز عبور فعلی", en: "Current password" },
  newPassword: { fa: "رمز عبور جدید", en: "New password" },
  otp: { fa: "کد تأیید", en: "Verification code" },
  refreshToken: { fa: "نشست ورود", en: "Sign-in session" },
  non_field_errors: { fa: "اطلاعات", en: "Information" },
  auth_type: { fa: "نوع احراز هویت", en: "Authentication type" },
  artist_claimed: { fa: "هنرمند انتخاب‌شده", en: "Selected artist" },
  first_name: { fa: "نام", en: "First name" },
  last_name: { fa: "نام خانوادگی", en: "Last name" },
  stage_name: { fa: "نام هنری", en: "Stage name" },
  birth_date: { fa: "تاریخ تولد", en: "Birth date" },
  national_id: { fa: "کد ملی", en: "National ID" },
  phone_number: { fa: "شماره موبایل", en: "Mobile number" },
  email: { fa: "ایمیل", en: "Email" },
  city: { fa: "شهر", en: "City" },
  address: { fa: "نشانی", en: "Address" },
  biography: { fa: "زندگی‌نامه", en: "Biography" },
  national_id_image: { fa: "تصویر کارت ملی", en: "National ID image" },
};

const FIELD_ERROR_COPY: Record<string, Copy> = {
  required: { fa: "الزامی است.", en: "is required." },
  blank: { fa: "نمی‌تواند خالی باشد.", en: "cannot be empty." },
  null: { fa: "نمی‌تواند خالی باشد.", en: "cannot be empty." },
  invalid_phone: { fa: "معتبر نیست.", en: "is not valid." },
  invalid_otp_format: { fa: "باید ۴ رقم باشد.", en: "must contain 4 digits." },
  min_length: { fa: "بیش از حد کوتاه است.", en: "is too short." },
  max_length: { fa: "بیش از حد طولانی است.", en: "is too long." },
  invalid_password: { fa: "نادرست است.", en: "is incorrect." },
  password_unchanged: {
    fa: "باید با رمز عبور فعلی متفاوت باشد.",
    en: "must be different from the current password.",
  },
  invalid: { fa: "معتبر نیست.", en: "is not valid." },
  invalid_choice: { fa: "انتخاب معتبری نیست.", en: "is not a valid choice." },
  unique: { fa: "قبلاً ثبت شده است.", en: "has already been used." },
  does_not_exist: { fa: "پیدا نشد.", en: "was not found." },
  incorrect_type: { fa: "نوع معتبری ندارد.", en: "has an invalid type." },
  invalid_image: { fa: "تصویر معتبری نیست.", en: "is not a valid image." },
  invalid_extension: { fa: "پسوند فایل مجاز نیست.", en: "has an unsupported file extension." },
};

function asObject(value: unknown): Record<string, any> | null {
  return value && typeof value === "object" ? (value as Record<string, any>) : null;
}

function unwrapError(input: any): Record<string, any> | null {
  const root = input?.body ?? input;
  if (!root) return null;
  if (root instanceof Error) return { message: root.message };
  const object = asObject(root);
  return asObject(object?.error) || object;
}

function firstLeaf(value: any): { code?: string; message?: string } | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstLeaf(item);
      if (found) return found;
    }
    return null;
  }
  const object = asObject(value);
  if (object) {
    if (typeof object.message === "string") {
      return { code: String(object.code || ""), message: object.message };
    }
    for (const item of Object.values(object)) {
      const found = firstLeaf(item);
      if (found) return found;
    }
    return null;
  }
  return value == null ? null : { message: String(value) };
}

function fieldMessage(fields: any, language: AppLanguage): string | null {
  const object = asObject(fields);
  if (!object) return null;
  for (const [field, value] of Object.entries(object)) {
    const leaf = firstLeaf(value);
    if (!leaf) continue;
    const label = FIELD_LABELS[field]?.[language] || (field === "non_field_errors" ? "" : field);
    const copy = leaf.code ? FIELD_ERROR_COPY[leaf.code]?.[language] : undefined;
    if (copy) return `${label}${label ? " " : ""}${copy}`;
    if (leaf.message) {
      const isPersian = /[\u0600-\u06ff]/.test(leaf.message);
      const isEnglish = /[a-z]/i.test(leaf.message);
      if ((language === "fa" && isPersian) || (language === "en" && isEnglish)) {
        return label ? `${label}: ${leaf.message}` : leaf.message;
      }
    }
  }
  return null;
}

export function formatAuthError(
  input: any,
  language: AppLanguage,
  fallback?: Copy,
): string {
  const error = unwrapError(input);
  const generic = fallback?.[language] ||
    (language === "fa"
      ? "خطایی رخ داد. لطفاً دوباره تلاش کنید."
      : "Something went wrong. Please try again.");
  if (!error) return generic;

  const code = String(error.code || "").toUpperCase();
  const seconds = Number(error.retry_after_seconds || error?.meta?.retry_after_seconds || 0);
  if (code === "RATE_LIMIT") {
    return language === "fa"
      ? `لطفاً ${Math.max(1, seconds || 30)} ثانیه صبر کنید و دوباره تلاش کنید.`
      : `Please wait ${Math.max(1, seconds || 30)} seconds and try again.`;
  }
  if (code === "ACCOUNT_LOCKED" && seconds > 0) {
    const minutes = Math.max(1, Math.ceil(seconds / 60));
    return language === "fa"
      ? `ورود موقتاً محدود شده است. حدود ${minutes} دقیقه دیگر دوباره تلاش کنید.`
      : `Sign-in is temporarily locked. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
  }

  const field = fieldMessage(error.fields, language);
  if (field) return field;
  if (code && ERROR_COPY[code]) {
    const copy = ERROR_COPY[code][language];
    const requestId = String(error?.meta?.request_id || "").trim();
    if (code === "SERVER_ERROR" && requestId) {
      return language === "fa"
        ? `${copy} شناسه پیگیری: ${requestId}`
        : `${copy} Reference: ${requestId}`;
    }
    return copy;
  }

  // Browser/network/runtime messages are never suitable UI copy. This final
  // boundary preserves meaningful same-language API messages while replacing
  // strings such as "Failed to fetch", Safari's "Load failed", timeout text,
  // and raw HTTP/status diagnostics with stable localized copy.
  return getUserFacingErrorMessage(error ?? input, language, generic);
}

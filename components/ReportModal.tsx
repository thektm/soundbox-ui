"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ShieldAlert,
  Send,
  X,
  Flag,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";
import { useGuestAccess } from "./GuestAccessContext";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: number | string;
  targetType: "song" | "artist" | "user";
  targetTitle: string;
}

const REPORT_REASONS = [
  { id: "wrong_info", label: "اطلاعات نادرست", icon: "ℹ️" },
  { id: "poor_quality", label: "کیفیت پایین فایل", icon: "🔈" },
  { id: "copyright", label: "نقض کپی‌رایت", icon: "©️" },
  { id: "offensive", label: "محتوای نامناسب", icon: "⚠️" },
  { id: "duplicate", label: "فایل تکراری", icon: "👯" },
  { id: "other", label: "سایر موارد", icon: "📝" },
];

export const ReportModal = ({
  isOpen,
  onClose,
  targetId,
  targetType,
  targetTitle,
}: ReportModalProps) => {
  const { accessToken, authenticatedFetch } = useAuth();
  const { requestAuth } = useGuestAccess();
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const resetForm = useCallback(() => {
    setSelectedReason("");
    setDescription("");
    setIsSubmitting(false);
    setStep(1);
  }, []);

  // When reporting a user we only show a subset of reasons:
  // keep 1st, 3rd, 4th and last entries from REPORT_REASONS
  const reasons = React.useMemo(() => {
    if (targetType === "user") {
      const idx = [0, 2, 3, REPORT_REASONS.length - 1];
      return REPORT_REASONS.filter((_, i) => idx.includes(i));
    }
    return REPORT_REASONS;
  }, [targetType]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!isOpen || accessToken) return;
    requestAuth("برای ثبت گزارش و دریافت نتیجه بررسی وارد شوید.");
    onClose();
  }, [isOpen, accessToken, onClose, requestAuth]);

  const handleSubmit = async () => {
    if (!accessToken) {
      toast.error("برای گزارش دادن ابتدا وارد شوید");
      return;
    }

    if (!description.trim()) {
      toast.error("لطفاً توضیحات خود را وارد کنید");
      return;
    }

    setIsSubmitting(true);
    try {
      const body: any = {
        text: `${selectedReason ? `[${selectedReason}] ` : ""}${description}`,
      };

      if (targetType === "song") {
        body.song = targetId;
      } else if (targetType === "artist") {
        body.artist_id = targetId;
      } else if (targetType === "user") {
        body.reported_user = targetId;
      }

      const response = await authenticatedFetch(
        "https://api.sedabox.com/api/reports/",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );

      if (response.status === 201) {
        toast.success("گزارش شما با موفقیت ثبت شد و در حال بررسی است ");
        handleClose();
      } else {
        const data = await response.json();
        toast.error(data.non_field_errors?.[0] || "خطا در ثبت گزارش");
      }
    } catch (error) {
      console.error("Report error:", error);
      toast.error("خطا در برقراری ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          onClick={handleClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-500/10 flex flex-col"
          dir="rtl"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white leading-tight">
                  گزارش محتوا
                </h3>
                <p className="text-sm text-white/40 mt-1 truncate max-w-[200px]">
                  {targetType === "song"
                    ? "آهنگ"
                    : targetType === "artist"
                      ? "هنرمند"
                      : "کاربر"}
                  : {targetTitle}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-8 pb-10">
            {step === 1 ? (
              <div className="space-y-3 mt-4">
                <p className="text-sm text-white/60 mb-4 font-medium">
                  دلیل گزارش شما چیست؟
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {reasons.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => {
                        setSelectedReason(reason.label);
                        setStep(2);
                      }}
                      className="group flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all duration-300 text-right"
                    >
                      <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">
                        {reason.icon}
                      </span>
                      <span className="flex-1 text-[15px] font-semibold text-white/80 group-hover:text-white">
                        {reason.label}
                      </span>
                      <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-emerald-500 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-6">
                <div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-emerald-500 hover:text-emerald-400 font-bold mb-4 flex items-center gap-1"
                  >
                    <span>← بازگشت به مراحل قبل</span>
                  </button>
                  <label className="block text-sm text-white/60 mb-3 font-medium">
                    توضیحات تکمیلی (اجباری):
                  </label>
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="لطفاً دلیل گزارش خود را به طور کامل شرح دهید..."
                      className="w-full h-40 bg-white/[0.03] border border-white/10 rounded-3xl p-5 text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                    />
                    <div className="absolute bottom-4 left-4 text-[10px] text-white/20">
                      بررسی در کمتر از ۲۴ ساعت
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !description.trim()}
                    className="flex-1 h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center gap-3 text-black font-black text-base shadow-xl shadow-emerald-500/20 active:scale-95 disabled:grayscale disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        ثبت نهایی گزارش
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Luxury decorative element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] pointer-events-none rounded-full" />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

"use client";

import { AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";

export default function ProfileDeleteConfirmModal({
  open,
  onCancel,
  onConfirm,
  busy = false,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/50 p-4 pointer-events-auto">
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl pointer-events-auto dark:bg-zinc-900">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-950">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              حذف تصویر پروفایل
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              آیا از حذف تصویر پروفایل خود مطمئن هستید؟
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            انصراف
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {busy ? "در حال حذف..." : "حذف تصویر"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

"use client";

import React, { useState, useCallback, memo } from "react";
import { ResponsiveSheet } from "./ResponsiveSheet";

const ICONS = {
  plus: "M12 4v16m8-8H4",
  lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  globe:
    "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
};

const Icon = memo(
  ({
    d,
    className = "w-5 h-5",
    filled = false,
  }: {
    d: string;
    className?: string;
    filled?: boolean;
  }) => (
    <svg
      className={className}
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={filled ? 0 : 2}
        d={d}
      />
    </svg>
  ),
);
Icon.displayName = "Icon";

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, isPublic: boolean) => void;
}

export const CreatePlaylistModal = memo(
  ({ isOpen, onClose, onCreate }: CreatePlaylistModalProps) => {
    const [name, setName] = useState("");
    const [isPublic, setIsPublic] = useState(true);

    const handleCreate = useCallback(() => {
      if (name.trim()) {
        onCreate(name.trim(), isPublic);
        setName("");
        setIsPublic(true);
        onClose();
      }
    }, [name, isPublic, onCreate, onClose]);

    return (
      <ResponsiveSheet
        isOpen={isOpen}
        onClose={onClose}
        desktopWidth="w-[450px]"
      >
        <div className="h-full flex flex-col" dir="rtl">
          {/* Header */}
          <div className="relative p-6 pb-4 flex-shrink-0">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Icon d={ICONS.plus} className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white text-center">
              پلی‌لیست جدید
            </h2>
            <p className="text-gray-400 text-sm text-center mt-1">
              یک پلی‌لیست جدید بسازید
            </p>
          </div>

          {/* Form */}
          <div className="px-6 pb-6 space-y-4 flex-1 overflow-y-auto">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                نام پلی‌لیست
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="پلی‌لیست من..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                autoFocus
              />
            </div>

            {/* Privacy Toggle */}
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPublic ? "bg-emerald-500/20" : "bg-gray-500/20"}`}
                >
                  <Icon
                    d={isPublic ? ICONS.globe : ICONS.lock}
                    className={`w-5 h-5 ${isPublic ? "text-emerald-400" : "text-gray-400"}`}
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-white">
                    {isPublic ? "عمومی" : "خصوصی"}
                  </span>
                  <p className="text-xs text-gray-500">
                    {isPublic ? "همه می‌توانند ببینند" : "فقط شما می‌بینید"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${isPublic ? "bg-emerald-500" : "bg-zinc-700"}`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${isPublic ? "right-1" : "right-6"}`}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-gray-400 font-medium rounded-xl hover:bg-white/10 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="flex-1 py-3 bg-emerald-500 text-white font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ایجاد
              </button>
            </div>
          </div>
        </div>
      </ResponsiveSheet>
    );
  },
);

CreatePlaylistModal.displayName = "CreatePlaylistModal";

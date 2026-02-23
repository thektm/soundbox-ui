"use client";

import React, { useEffect, useState } from "react";
import { Drawer } from "vaul";
import * as Dialog from "@radix-ui/react-dialog";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

interface ResponsiveSheetProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  /** When true, optionally dismiss on-screen keyboard on mobile. No-op by default. */
  keyboardDismiss?: boolean;
  desktopWidth?: string;
}

export const ResponsiveSheet = ({
  children,
  isOpen,
  onClose,
  keyboardDismiss,
  desktopWidth = "w-[500px]",
}: ResponsiveSheetProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] transform-gpu animate-fade-in" />
          <Dialog.Content
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${desktopWidth} max-h-[85vh] 
              bg-gradient-to-t from-[#0a0a0a] to-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 
              z-[80] outline-none transform-gpu animate-scale-in overflow-hidden flex flex-col`}
          >
            {children}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[95vh] bg-gradient-to-t from-[#0a0a0a] to-[#1a1a1a] rounded-t-3xl border-t border-white/10 z-[80] flex flex-col outline-none">
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-4 mb-2 flex-shrink-0" />
          <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

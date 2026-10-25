"use client";

import { useEffect, useId } from "react";

import { backClass } from "@/components/ui/form-shell";

export function PixelModal({
  open,
  title,
  onClose,
  wide,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[var(--ink)]/55"
        aria-label="关闭"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`pixel-box relative z-10 max-h-[min(90vh,840px)] w-full overflow-y-auto p-4 shadow-[8px_8px_0_var(--ink)] ${wide ? "max-w-2xl" : "max-w-lg"}`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-base font-semibold">{title}</h2>
          <button type="button" className={backClass} onClick={onClose}>
            取消
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

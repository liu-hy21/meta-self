"use client";

import { useEffect, useId } from "react";

export function VitalModal({
  open,
  kicker,
  title,
  onClose,
  children,
}: {
  open: boolean;
  kicker: string;
  title: string;
  onClose: () => void;
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="presentation">
      <button type="button" className="vital-modal-backdrop absolute inset-0" aria-label="关闭" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="vital-modal relative z-10 max-h-[min(90vh,760px)] w-full max-w-lg overflow-y-auto p-6"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="vital-kicker">{kicker}</p>
            <h2 id={titleId} className="vital-title mt-1 text-lg">
              {title}
            </h2>
          </div>
          <button type="button" className="vital-btn" onClick={onClose}>
            取消
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

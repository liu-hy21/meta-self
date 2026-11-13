"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type FinanceVisibilityContextValue = {
  visible: boolean;
  toggle: () => void;
};

const FinanceVisibilityContext = createContext<FinanceVisibilityContextValue | null>(null);

export function FinanceVisibilityProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <FinanceVisibilityContext.Provider value={{ visible, toggle: () => setVisible((current) => !current) }}>
      {children}
    </FinanceVisibilityContext.Provider>
  );
}

export function useFinanceVisibility() {
  const context = useContext(FinanceVisibilityContext);
  if (!context) throw new Error("useFinanceVisibility must be used inside FinanceVisibilityProvider");
  return context;
}

export function FinanceSensitiveAmount({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { visible } = useFinanceVisibility();
  return <span className={className}>{visible ? children : "*****"}</span>;
}

export function FinanceVisibilityToggle({ className = "" }: { className?: string }) {
  const { visible, toggle } = useFinanceVisibility();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={visible}
      aria-label={visible ? "隐藏资产金额" : "显示资产金额"}
      title={visible ? "隐藏资产金额" : "显示资产金额"}
      className={`grid size-9 place-items-center rounded-full border transition-colors ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
        {!visible ? <path d="m4 4 16 16" /> : null}
      </svg>
    </button>
  );
}

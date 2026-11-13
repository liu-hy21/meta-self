"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";

type Option = { value: string; label: string };

export function FinanceDropdown({
  options,
  value,
  onChange,
  name,
  compact = false,
  label,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  name?: string;
  compact?: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
    const close = (event: PointerEvent) => {
      if (buttonRef.current?.contains(event.target as Node) || menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const closeOnScroll = () => setOpen(false);
    document.addEventListener("pointerdown", close);
    window.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("resize", closeOnScroll);
    return () => {
      document.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("resize", closeOnScroll);
    };
  }, [open]);

  const show = () => {
    setRect(buttonRef.current?.getBoundingClientRect() ?? null);
    setOpen(true);
  };
  const choose = (option: Option) => {
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            show();
          }
        }}
        className={`flex items-center justify-between gap-3 border border-[var(--panel)]/20 bg-[var(--panel)]/10 text-left text-[var(--panel)] transition-colors hover:border-[var(--panel)]/40 focus-visible:border-[var(--gold)] focus-visible:outline-2 focus-visible:outline-[var(--gold)] ${compact ? "h-9 rounded-full px-3 text-xs" : "mt-1 h-10 w-full rounded-xl px-3 text-sm"}`}
      >
        <span className="truncate">{selected?.label}</span>
        <svg viewBox="0 0 20 20" className={`size-4 shrink-0 text-[var(--panel)]/65 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="m5.5 7.5 4.5 5 4.5-5" />
        </svg>
      </button>
      {open && rect && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="listbox"
          aria-label={label}
          onKeyDown={(event) => {
            if (event.key === "Escape") { setOpen(false); buttonRef.current?.focus(); }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const buttons = [...menuRef.current!.querySelectorAll<HTMLButtonElement>("button")];
              const next = (buttons.indexOf(document.activeElement as HTMLButtonElement) + (event.key === "ArrowDown" ? 1 : buttons.length - 1)) % buttons.length;
              buttons[next]?.focus();
            }
          }}
          className="fixed z-50 max-h-60 overflow-y-auto rounded-xl border border-[var(--panel)]/20 bg-[var(--ink)] p-1 text-[var(--panel)] shadow-xl"
          style={{
            left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 120) - 8)),
            top: rect.bottom + Math.min(options.length * 36 + 8, 240) + 8 < window.innerHeight
              ? rect.bottom + 4
              : Math.max(8, rect.top - Math.min(options.length * 36 + 8, 240) - 4),
            minWidth: Math.max(rect.width, 120),
          }}
        >
          {options.map((option) => (
            <button key={option.value} type="button" role="option" aria-selected={option.value === value} onClick={() => choose(option)} className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--panel)]/10 focus-visible:bg-[var(--panel)]/10 focus-visible:outline-none ${option.value === value ? "bg-[var(--panel)]/10" : ""}`}>
              {option.label}
              {option.value === value ? <span aria-hidden>✓</span> : null}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

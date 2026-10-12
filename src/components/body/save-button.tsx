"use client";

import { useFormStatus } from "react-dom";

import { submitClass } from "@/components/ui/form-shell";

export function SaveButton({ label = "保存" }: { label?: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={submitClass()} disabled={pending} aria-busy={pending}>
      {pending ? "保存中…" : label}
    </button>
  );
}

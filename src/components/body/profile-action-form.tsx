"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { saveMainScrollPosition } from "@/components/ui/preserve-scroll-link";

type BodyProfileAction = (formData: FormData) => Promise<{ ok: boolean } | void>;

export function ProfileActionForm({
  action,
  className,
  children,
  afterSuccess = "navigate",
  onSuccess,
  encType,
}: {
  action: BodyProfileAction;
  className?: string;
  children: ReactNode;
  /** navigate：关掉 ?edit= 等查询参数；refresh：仅刷新数据（弹窗记一条） */
  afterSuccess?: "navigate" | "refresh";
  onSuccess?: () => void;
  encType?: string;
}) {
  const router = useRouter();

  async function onAction(formData: FormData) {
    if (afterSuccess === "navigate") saveMainScrollPosition();
    const result = await action(formData);
    if (result?.ok === false) return;
    if (afterSuccess === "navigate") {
      router.replace("/body/profile", { scroll: false });
    } else {
      router.refresh();
    }
    onSuccess?.();
  }

  return (
    <form action={onAction} className={className} encType={encType}>
      {children}
    </form>
  );
}

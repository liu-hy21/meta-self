"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useLayoutEffect } from "react";

import { MAIN_SCROLL_KEY, mainScrollElement } from "@/components/ui/preserve-scroll-link";

function restoreMainScroll() {
  const raw = sessionStorage.getItem(MAIN_SCROLL_KEY);
  if (!raw) return false;
  const y = Number(raw);
  if (!Number.isFinite(y)) {
    sessionStorage.removeItem(MAIN_SCROLL_KEY);
    return false;
  }
  const el = mainScrollElement();
  if (!el) return false;
  el.scrollTop = y;
  if (Math.abs(el.scrollTop - y) <= 2) {
    sessionStorage.removeItem(MAIN_SCROLL_KEY);
    return true;
  }
  return false;
}

export function ProfileScrollRestore() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useLayoutEffect(() => {
    if (pathname !== "/body/profile") return;

    restoreMainScroll();
    requestAnimationFrame(() => {
      restoreMainScroll();
      requestAnimationFrame(restoreMainScroll);
    });
  }, [pathname, query]);

  return null;
}

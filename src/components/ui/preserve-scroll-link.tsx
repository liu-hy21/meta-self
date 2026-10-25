"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

export const MAIN_SCROLL_KEY = "meta-self:main-scroll-y";

export function mainScrollElement() {
  return document.querySelector<HTMLElement>("[data-main-scroll]");
}

export function saveMainScrollPosition() {
  const el = mainScrollElement();
  if (el) sessionStorage.setItem(MAIN_SCROLL_KEY, String(el.scrollTop));
}

export function PreserveScrollLink({ onClick, scroll = false, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      scroll={scroll}
      onClick={(event) => {
        saveMainScrollPosition();
        onClick?.(event);
      }}
    />
  );
}

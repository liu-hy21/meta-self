"use client";

import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/": "看板",
  "/body/profile": "身体",
  "/body/log": "身体日志",
  "/body/advice-log": "AI建议日志",
  "/mind/profile": "心态",
  "/mind/log": "心态日志",
  "/work/profile": "工作",
  "/work/log": "工作日志",
  "/relation/profile": "关系",
  "/relation/log": "关系日志",
  "/finance/profile": "玩转",
  "/finance/log": "财商日志",
  "/library/video": "视频",
  "/library/article": "图文",
};

export function TopBar() {
  const pathname = usePathname();

  return (
    <header className="flex h-14 shrink-0 items-center border-b-4 border-[var(--ink)] bg-[var(--panel)] px-5">
      <h1 className="truncate text-sm font-semibold">{titles[pathname] ?? "身体"}</h1>
    </header>
  );
}

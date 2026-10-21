"use client";

import { usePathname } from "next/navigation";

import { articleTopicLabel } from "@/lib/library-article";
import { drawToolLabel } from "@/lib/library-draw";
import { englishSectionLabel } from "@/lib/library-english";
import { familySectionLabel } from "@/lib/library-family";

const titles: Record<string, string> = {
  "/": "看板",
  "/body/profile": "身体",
  "/body/log": "身体日志",
  "/mind/profile": "心态",
  "/mind/log": "心态日志",
  "/work/profile": "工作",
  "/work/log": "工作日志",
  "/relation/profile": "关系",
  "/relation/log": "关系日志",
  "/finance/profile": "财商",
  "/play": "玩商",
  "/english": "英语",
  "/library/video": "视频",
  "/library/draw": "数据资产",
  "/library/corp": "数据资产",
  "/library/family": "家庭",
  "/library/chat": "聊天记录",
};

function titleFor(pathname: string) {
  if (pathname.startsWith("/library/article/")) {
    const topic = pathname.split("/")[3];
    const label = topic ? articleTopicLabel(topic) : null;
    return label ?? "仓库";
  }
  if (pathname.startsWith("/library/draw/")) {
    const tool = pathname.split("/")[3];
    const label = tool ? drawToolLabel(tool) : null;
    return label ? `数据资产 · 绘制 · ${label}` : "数据资产 · 绘制";
  }
  if (pathname.startsWith("/library/corp")) {
    return "数据资产 · corp";
  }
  if (pathname.startsWith("/english/")) {
    const section = pathname.split("/")[2];
    const label = section ? englishSectionLabel(section) : null;
    return label ? `玩转 · 英语 · ${label}` : "玩转 · 英语";
  }
  if (pathname.startsWith("/library/family/")) {
    const section = pathname.split("/")[3];
    const label = section ? familySectionLabel(section) : null;
    return label ? `家庭 · ${label}` : "家庭";
  }
  return titles[pathname] ?? "身体";
}

export function TopBar() {
  const pathname = usePathname();

  return (
    <header className="flex h-14 shrink-0 items-center border-b-4 border-[var(--ink)] bg-[var(--panel)] px-5">
      <h1 className="truncate text-sm font-semibold">{titleFor(pathname)}</h1>
    </header>
  );
}

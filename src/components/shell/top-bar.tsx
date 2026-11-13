"use client";

import Link from "next/link";
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
    return label ? `知识 · ${label}` : "知识";
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
  if (pathname.startsWith("/relation/people/")) return "关系 · 人物详情";
  if (pathname.startsWith("/relation/chat/")) return "关系 · 原文";
  if (pathname.startsWith("/relation/persona/")) return "关系 · 角色模拟";
  if (pathname.startsWith("/relation/analysis/")) return pathname.endsWith("/ai") ? "关系 · AI 分析" : "关系 · 数据分析";
  return titles[pathname] ?? "身体";
}

export function TopBar() {
  const pathname = usePathname();
  const isRelationPerson = pathname.startsWith("/relation/people/");

  return (
    <header className="flex h-14 shrink-0 items-center border-b-4 border-[var(--ink)] bg-[var(--panel)] px-5">
      <div className="flex min-w-0 items-center gap-2">
        {isRelationPerson ? (
          <Link
            href="/relation/profile"
            aria-label="返回人物管理"
            title="返回人物管理"
            className="grid size-7 shrink-0 place-items-center border-2 border-[var(--ink)] bg-[var(--panel)] text-[var(--ink)] transition-colors hover:bg-[var(--gold)]"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter">
              <path d="M10.5 3 5.5 8l5 5" />
              <path d="M6 8h6" />
            </svg>
          </Link>
        ) : null}
        <h1 className="truncate text-sm font-semibold">{titleFor(pathname)}</h1>
      </div>
    </header>
  );
}

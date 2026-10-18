"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { articleTopics } from "@/lib/library-article";
import { drawTools } from "@/lib/library-draw";
import type { BodyNavItem } from "@/lib/queries/body";

const bodyLogHref = "/body/log";
const adviceLogHref = "/body/advice-log";
const mindLogHref = "/mind/log";
const mindProfileHref = "/mind/profile";
const workLogHref = "/work/log";
const workProfileHref = "/work/profile";
const relationLogHref = "/relation/log";
const relationProfileHref = "/relation/profile";
const financeLogHref = "/finance/log";
const financeProfileHref = "/finance/profile";
const videoHref = "/library/video";
const articleHref = "/library/article";
const drawHref = "/library/draw";
const chatHref = "/library/chat";

export function LeftRail({ items }: { items: BodyNavItem[] }) {
  const pathname = usePathname();
  const byKey = new Map(items.map((item) => [item.key, item]));
  const board = byKey.get("today");
  const profile = byKey.get("profile");
  const logAttention = items.some((item) => item.key !== "today" && item.key !== "profile" && item.status === "attention");
  const logOpen =
    pathname.startsWith(bodyLogHref) ||
    pathname.startsWith(adviceLogHref) ||
    pathname.startsWith(mindLogHref) ||
    pathname.startsWith(workLogHref) ||
    pathname.startsWith(relationLogHref) ||
    pathname.startsWith(financeLogHref);
  const profileOpen =
    pathname.startsWith("/body/profile") ||
    pathname.startsWith(mindProfileHref) ||
    pathname.startsWith(workProfileHref) ||
    pathname.startsWith(relationProfileHref) ||
    pathname.startsWith(financeProfileHref);
  const libraryOpen = pathname.startsWith("/library");
  const articleOpen = pathname.startsWith(articleHref);
  const drawOpen = pathname.startsWith(drawHref);
  const [open, setOpen] = useState({
    log: logOpen,
    profile: profileOpen,
    library: libraryOpen,
    article: articleOpen,
    draw: drawOpen,
  });

  useEffect(() => {
    setOpen({ log: logOpen, profile: profileOpen, library: libraryOpen, article: articleOpen, draw: drawOpen });
  }, [logOpen, profileOpen, libraryOpen, articleOpen, drawOpen]);

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r-4 border-[var(--ink)] bg-[var(--panel)]">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="grid size-8 place-items-center border-2 border-[var(--ink)] bg-[var(--ink)] text-xs text-[var(--panel)]">
          M
        </span>
        <p className="truncate text-sm font-semibold tracking-tight">MetaSelf</p>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-3">
        {board ? (
          <RailLink href={board.href} label="看板" active={pathname === "/"} attention={board.status === "attention"} />
        ) : null}

        <Group
          label="采集"
          open={open.log}
          attention={logAttention}
          onToggle={() => setOpen((current) => ({ ...current, log: !current.log }))}
        >
          <RailLink href={bodyLogHref} label="身体日志" active={pathname.startsWith(bodyLogHref)} attention={logAttention} nested />
          <RailLink href={mindLogHref} label="心态日志" active={pathname.startsWith(mindLogHref)} nested />
          <RailLink href={workLogHref} label="工作日志" active={pathname.startsWith(workLogHref)} nested />
          <RailLink href={relationLogHref} label="关系日志" active={pathname.startsWith(relationLogHref)} nested />
          <RailLink href={financeLogHref} label="财商日志" active={pathname.startsWith(financeLogHref)} nested />
          <RailLink href={adviceLogHref} label="AI建议日志" active={pathname.startsWith(adviceLogHref)} nested />
        </Group>

        {profile ? (
          <Group
            label="我的仓库"
            open={open.profile}
            attention={profile.status === "attention"}
            onToggle={() => setOpen((current) => ({ ...current, profile: !current.profile }))}
          >
            <RailLink
              href={profile.href}
              label="身体"
              active={pathname.startsWith(profile.href)}
              attention={profile.status === "attention"}
              nested
            />
            <RailLink href={mindProfileHref} label="心态" active={pathname.startsWith(mindProfileHref)} nested />
            <RailLink href={workProfileHref} label="工作" active={pathname.startsWith(workProfileHref)} nested />
            <RailLink href={relationProfileHref} label="关系" active={pathname.startsWith(relationProfileHref)} nested />
            <RailLink href={financeProfileHref} label="玩转" active={pathname.startsWith(financeProfileHref)} nested />
          </Group>
        ) : null}

        <Group
          label="仓库"
          open={open.library}
          attention={false}
          onToggle={() => setOpen((current) => ({ ...current, library: !current.library }))}
        >
          <RailLink href={videoHref} label="视频" active={pathname.startsWith(videoHref)} nested />
          <RailLink href={chatHref} label="聊天记录" active={pathname.startsWith(chatHref)} nested />
          <div className="ml-1">
            <Group
              label="图文"
              open={open.article}
              attention={false}
              nested
              onToggle={() => setOpen((current) => ({ ...current, article: !current.article }))}
            >
              {articleTopics.map((topic) => {
                const href = `${articleHref}/${topic.slug}`;
                return (
                  <RailLink key={topic.slug} href={href} label={topic.label} active={pathname.startsWith(href)} deep />
                );
              })}
            </Group>
          </div>
          <div className="ml-1">
            <Group
              label="绘制"
              open={open.draw}
              attention={false}
              nested
              onToggle={() => setOpen((current) => ({ ...current, draw: !current.draw }))}
            >
              {drawTools.map((tool) => {
                const href = `${drawHref}/${tool.slug}`;
                return <RailLink key={tool.slug} href={href} label={tool.label} active={pathname.startsWith(href)} deep />;
              })}
            </Group>
          </div>
        </Group>
      </nav>
    </aside>
  );
}

function Group({
  label,
  open,
  attention,
  nested,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  attention: boolean;
  nested?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className={`flex h-8 w-full items-center justify-between border-2 border-transparent px-2.5 text-left text-sm leading-none hover:bg-[#f3e6cc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] ${nested ? "ml-1" : ""}`}
      >
        <span className="flex items-center gap-2">
          <span className={`size-2 ${attention ? "bg-[var(--gold-deep)]" : "bg-[#d9cbb3]"}`} aria-hidden />
          {label}
        </span>
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="mt-1 flex flex-col gap-1 pl-3">{children}</div> : null}
    </div>
  );
}

function RailLink({
  href,
  label,
  active,
  attention,
  nested,
  deep,
}: {
  href: string;
  label: string;
  active: boolean;
  attention?: boolean;
  nested?: boolean;
  deep?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-8 items-center border-2 px-2.5 text-left leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] ${
        active ? "border-[var(--ink)] bg-[var(--gold)]" : "border-transparent hover:bg-[#f3e6cc]"
      } ${deep ? "ml-4" : nested ? "ml-1" : ""}`}
    >
      <span className="flex items-center gap-2 text-sm">
        <span className={`size-2 ${attention ? "bg-[var(--gold-deep)]" : "bg-[#d9cbb3]"}`} aria-hidden />
        {label}
      </span>
    </Link>
  );
}

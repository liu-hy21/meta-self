"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { articleTopics } from "@/lib/library-article";
import { drawTools } from "@/lib/library-draw";
import { englishSections } from "@/lib/library-english";
import { familySections } from "@/lib/library-family";
import type { BodyNavItem } from "@/lib/queries/body";

const mindProfileHref = "/mind/profile";
const workProfileHref = "/work/profile";
const relationProfileHref = "/relation/profile";
const financeProfileHref = "/finance/profile";
const playHref = "/play";
const videoHref = "/library/video";
const articleHref = "/library/article";
const drawHref = "/library/draw";
const corpHref = "/library/corp";
const englishHref = "/english";
const familyHref = "/library/family";
const chatHref = "/library/chat";

const iconClass = "size-4 shrink-0";

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-[18px] shrink-0 place-items-center text-[var(--ink)]" aria-hidden>
      {children}
    </span>
  );
}

function IconBoard() {
  return (
    <svg className={iconClass} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square">
      <path d="M2 2h5v5H2zM9 2h5v3H9zM9 7h5v7H9zM2 9h5v5H2z" />
    </svg>
  );
}

function IconFamily() {
  return (
    <svg className={iconClass} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square">
      <path d="M2 7 8 2l6 5v7H2V7z" />
      <path d="M6 14v-4h4v4" />
    </svg>
  );
}

/** 立体骰子：玩转 / 玩 */
function IconPlay() {
  return (
    <svg className={iconClass} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M8 3.25 12.75 5.5 12.75 11 8 13.25 3.25 11 3.25 5.5Z" />
      <path d="M8 7.75V13.25M3.25 5.5 8 7.75 12.75 5.5" />
      <circle cx="8" cy="5.6" r="0.65" fill="currentColor" stroke="none" />
      <circle cx="10.9" cy="7.35" r="0.65" fill="currentColor" stroke="none" />
      <circle cx="10.9" cy="9.55" r="0.65" fill="currentColor" stroke="none" />
      <circle cx="5.1" cy="7.35" r="0.65" fill="currentColor" stroke="none" />
      <circle cx="5.85" cy="8.85" r="0.65" fill="currentColor" stroke="none" />
      <circle cx="6.6" cy="10.35" r="0.65" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconMyStore() {
  return (
    <svg className={iconClass} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square">
      <path d="M2 4h12v9H2z" />
      <path d="M2 4l2-2h8l2 2" />
      <circle cx="8" cy="9" r="2" />
    </svg>
  );
}

function IconStore() {
  return (
    <svg className={iconClass} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square">
      <path d="M2 3h12v3H2z" />
      <path d="M3 6v7h10V6" />
      <path d="M6 6V4h4v2" />
    </svg>
  );
}

export function LeftRail({ items }: { items: BodyNavItem[] }) {
  const pathname = usePathname();
  const byKey = new Map(items.map((item) => [item.key, item]));
  const board = byKey.get("today");
  const profile = byKey.get("profile");
  const logAttention = items.some((item) => item.key !== "today" && item.key !== "profile" && item.status === "attention");
  const englishOpen = pathname.startsWith(englishHref);
  const playOpen = pathname.startsWith(financeProfileHref) || pathname.startsWith(playHref) || englishOpen;
  const profileOpen =
    pathname.startsWith("/body/profile") ||
    pathname.startsWith(mindProfileHref) ||
    pathname.startsWith(workProfileHref) ||
    pathname.startsWith(relationProfileHref);
  const libraryOpen = pathname.startsWith("/library") && !pathname.startsWith(familyHref);
  const dataAssetsOpen = pathname.startsWith(drawHref) || pathname.startsWith(corpHref);
  const drawOpen = pathname.startsWith(drawHref);
  const familyOpen = pathname.startsWith(familyHref);
  const [open, setOpen] = useState({
    profile: profileOpen,
    library: libraryOpen,
    dataAssets: dataAssetsOpen,
    draw: drawOpen,
    english: englishOpen,
    family: familyOpen,
    play: playOpen,
  });

  useEffect(() => {
    setOpen({
      profile: profileOpen,
      library: libraryOpen,
      dataAssets: dataAssetsOpen,
      draw: drawOpen,
      english: englishOpen,
      family: familyOpen,
      play: playOpen,
    });
  }, [profileOpen, libraryOpen, dataAssetsOpen, drawOpen, englishOpen, familyOpen, playOpen]);

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r-4 border-[var(--ink)] bg-[var(--panel)]">
      <div className="flex items-center gap-3 border-b-2 border-dashed border-[var(--ink)]/30 px-4 py-4">
        <span className="grid size-9 place-items-center border-2 border-[var(--ink)] bg-[var(--gold)] text-sm font-bold shadow-[3px_3px_0_var(--ink)]">
          M
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight">MetaSelf</p>
          <p className="truncate text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">personal os</p>
        </div>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-3">
        {board ? (
          <RailLink
            href={board.href}
            label="看板"
            icon={<IconBoard />}
            active={pathname === "/"}
            attention={board.status === "attention"}
          />
        ) : null}

        <Group
          label="家庭"
          icon={<IconFamily />}
          open={open.family}
          attention={false}
          onToggle={() => setOpen((current) => ({ ...current, family: !current.family }))}
        >
          {familySections.map((section) => {
            const href = `${familyHref}/${section.slug}`;
            return (
              <RailLink key={section.slug} href={href} label={section.label} active={pathname.startsWith(href)} nested />
            );
          })}
        </Group>

        <Group
          label="玩转"
          icon={<IconPlay />}
          open={open.play}
          attention={false}
          onToggle={() => setOpen((current) => ({ ...current, play: !current.play }))}
        >
          <RailLink href={financeProfileHref} label="财商" active={pathname.startsWith(financeProfileHref)} nested />
          <RailLink href={playHref} label="玩商" active={pathname.startsWith(playHref)} nested />
          <Group
            label="英语"
            open={open.english}
            attention={false}
            nested
            onToggle={() => setOpen((current) => ({ ...current, english: !current.english }))}
          >
            {englishSections.map((section) => {
              const href = `${englishHref}/${section.slug}`;
              return (
                <RailLink key={section.slug} href={href} label={section.label} active={pathname.startsWith(href)} nested />
              );
            })}
          </Group>
        </Group>

        {profile ? (
          <Group
            label="我的仓库"
            icon={<IconMyStore />}
            open={open.profile}
            attention={profile.status === "attention" || logAttention}
            onToggle={() => setOpen((current) => ({ ...current, profile: !current.profile }))}
          >
            <RailLink
              href={profile.href}
              label="身体"
              active={pathname.startsWith(profile.href)}
              attention={profile.status === "attention" || logAttention}
              nested
            />
            <RailLink href={mindProfileHref} label="心态" active={pathname.startsWith(mindProfileHref)} nested />
            <RailLink href={workProfileHref} label="工作" active={pathname.startsWith(workProfileHref)} nested />
            <RailLink href={relationProfileHref} label="关系" active={pathname.startsWith(relationProfileHref)} nested />
          </Group>
        ) : null}

        <Group
          label="仓库"
          icon={<IconStore />}
          open={open.library}
          attention={false}
          onToggle={() => setOpen((current) => ({ ...current, library: !current.library }))}
        >
          <RailLink href={videoHref} label="视频" active={pathname.startsWith(videoHref)} nested />
          <RailLink href={chatHref} label="聊天记录" active={pathname.startsWith(chatHref)} nested />
          {articleTopics.map((topic) => {
            const href = `${articleHref}/${topic.slug}`;
            return (
              <RailLink key={topic.slug} href={href} label={topic.label} active={pathname.startsWith(href)} nested />
            );
          })}
          <Group
            label="数据资产"
            open={open.dataAssets}
            attention={false}
            nested
            onToggle={() => setOpen((current) => ({ ...current, dataAssets: !current.dataAssets }))}
          >
            <Group
              label="绘制"
              open={open.draw}
              attention={false}
              nested
              onToggle={() => setOpen((current) => ({ ...current, draw: !current.draw }))}
            >
              {drawTools.map((tool) => {
                const href = `${drawHref}/${tool.slug}`;
                return (
                  <RailLink key={tool.slug} href={href} label={tool.label} active={pathname.startsWith(href)} nested />
                );
              })}
            </Group>
            <RailLink href={corpHref} label="corp" active={pathname.startsWith(corpHref)} nested />
          </Group>
        </Group>
      </nav>
    </aside>
  );
}

function Group({
  label,
  icon,
  open,
  attention,
  nested,
  onToggle,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  open: boolean;
  attention: boolean;
  nested?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className={`group flex h-9 w-full items-center justify-between gap-2 border-2 px-2.5 text-left leading-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] ${
          nested
            ? "border-transparent text-sm hover:bg-[#f3e6cc]"
            : `text-[13px] font-bold tracking-wide ${
                open ? "border-[var(--ink)] bg-[#f3e6cc]" : "border-transparent hover:border-[var(--ink)] hover:bg-[#f3e6cc]"
              }`
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {icon && !nested ? (
            <NavIcon>{icon}</NavIcon>
          ) : (
            <span
              aria-hidden
              className={`shrink-0 border-[1.5px] border-[var(--ink)] ${nested ? "size-2" : "size-2.5"} ${
                attention ? "bg-[var(--gold-deep)]" : open ? "bg-[var(--gold)]" : "bg-[var(--panel)]"
              }`}
            />
          )}
          <span className="truncate">{label}</span>
        </span>
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className={`size-3 shrink-0 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
        >
          <path d="M4 2l4 4-4 4" />
        </svg>
      </button>
      {open ? (
        <div className="relative mt-1.5 mb-1 flex flex-col items-end gap-1 [&>*]:w-[calc(100%-0.75rem)] before:absolute before:top-1 before:bottom-1 before:left-[0.85rem] before:w-0.5 before:bg-[var(--ink)]/20">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function RailLink({
  href,
  label,
  icon,
  active,
  attention,
  nested,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  attention?: boolean;
  nested?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-9 items-center border-2 px-2.5 text-left leading-none transition-[transform,box-shadow,background-color] duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] ${
        active
          ? "-translate-x-0.5 -translate-y-0.5 border-[var(--ink)] bg-[var(--gold)] font-semibold shadow-[3px_3px_0_var(--ink)]"
          : nested
            ? "h-8 border-transparent text-[var(--ink)]/85 hover:bg-[#f3e6cc] hover:text-[var(--ink)]"
            : "border-transparent text-[13px] font-bold tracking-wide text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[#f3e6cc]"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2 text-sm">
        {icon && !nested ? (
          <span className="relative shrink-0">
            <NavIcon>{icon}</NavIcon>
            {attention ? (
              <span
                aria-hidden
                className="absolute -top-0.5 -right-0.5 size-2 border border-[var(--ink)] bg-[var(--gold-deep)]"
              />
            ) : null}
          </span>
        ) : (
          <span
            aria-hidden
            className={`size-1.5 shrink-0 rounded-full ${
              attention ? "bg-[var(--gold-deep)]" : active ? "bg-[var(--ink)]" : "bg-[var(--ink)]/30"
            }`}
          />
        )}
        <span className="truncate">{label}</span>
      </span>
    </Link>
  );
}

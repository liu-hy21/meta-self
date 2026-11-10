"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { CHAT_PAGE_SIZE } from "@/lib/relation/chat-pagination";
import type { ChatArchivePage, ChatMessageKind, RelationSenderFilter } from "@/lib/relation/types";

const kindLabels: Record<ChatMessageKind, string> = {
  text: "文字",
  image: "图片",
  voice: "语音",
  video: "视频",
  emoji: "表情",
  system: "系统",
  location: "位置",
  card: "名片",
  voip: "通话",
  other: "其他",
};

function buildHref(personId: string, values: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== "") query.set(key, String(value));
  const search = query.toString();
  return `/relation/chat/${personId}${search ? `?${search}` : ""}`;
}

function paginationItems(totalPages: number, currentPage: number): (number | "ellipsis")[] {
  const items: (number | "ellipsis")[] = [];
  for (let page = 1; page <= totalPages; page += 1) {
    if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) continue;
    const previous = items.at(-1);
    if (typeof previous === "number" && page - previous > 1) items.push("ellipsis");
    items.push(page);
  }
  return items;
}

function splitMessages(messages: ChatArchivePage["messages"]) {
  if (messages.length <= 1) return [messages];
  const target = Math.ceil(messages.length / 2);
  let splitIndex = target;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (let index = 1; index < messages.length; index += 1) {
    if (messages[index - 1]?.day === messages[index]?.day) continue;
    const distance = Math.abs(index - target);
    if (distance < closestDistance) {
      splitIndex = index;
      closestDistance = distance;
    }
  }
  return [messages.slice(0, splitIndex), messages.slice(splitIndex)];
}

function groupMessagesByDay(messages: ChatArchivePage["messages"]) {
  const grouped = new Map<string, ChatArchivePage["messages"]>();
  for (const message of messages) grouped.set(message.day, [...(grouped.get(message.day) ?? []), message]);
  return grouped;
}

function useFlashTargetMessage() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    let cleanupFlash: (() => void) | undefined;
    const flashTarget = () => {
      const targetId = window.location.hash.slice(1);
      if (!targetId.startsWith("msg-")) return;
      const target = document.getElementById(targetId);
      if (!target) return;
      cleanupFlash?.();
      target.classList.remove("is-target-flashing");
      void target.offsetWidth;
      target.classList.add("is-target-flashing");
      const original = { animation: target.style.animation, boxShadow: target.style.boxShadow, outline: target.style.outline };
      const highlight = { boxShadow: "0 0 0 6px rgba(233, 130, 104, .46)", outline: "3px solid rgba(233, 130, 104, .88)" };
      let highlighted = true;
      const timers: { intervalId?: number; timeoutId?: number } = {};
      const restore = () => {
        if (timers.intervalId !== undefined) window.clearInterval(timers.intervalId);
        if (timers.timeoutId !== undefined) window.clearTimeout(timers.timeoutId);
        target.style.animation = original.animation;
        target.style.boxShadow = original.boxShadow;
        target.style.outline = original.outline;
        target.classList.remove("is-target-flashing");
        cleanupFlash = undefined;
      };
      const apply = () => {
        target.style.animation = "none";
        target.style.boxShadow = highlighted ? highlight.boxShadow : original.boxShadow;
        target.style.outline = highlighted ? highlight.outline : original.outline;
      };
      cleanupFlash = restore;
      apply();
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        timers.intervalId = window.setInterval(() => {
          highlighted = !highlighted;
          apply();
        }, 260);
      }
      timers.timeoutId = window.setTimeout(restore, 1900);
    };

    const frame = window.requestAnimationFrame(flashTarget);
    window.addEventListener("hashchange", flashTarget);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", flashTarget);
      cleanupFlash?.();
    };
  }, [pathname, search]);
}

function MessageColumn({ messages }: { messages: ChatArchivePage["messages"] }) {
  const grouped = groupMessagesByDay(messages);
  return <div className="relation-timeline-column">{[...grouped.entries()].map(([day, dayMessages]) => (
    <div key={day} className="relation-day-group">
      <div className="relation-day-label"><span>{day.replaceAll("-", ".")}</span><i>{dayMessages.length} 条</i></div>
      <div className="relation-message-stack">
        {dayMessages.map((message) => (
          <article key={message.id} id={message.id} className={`relation-message ${message.isSelf ? "is-self" : ""}`}>
            <div className="relation-message-meta"><span>{message.isSelf ? "我" : message.sender}</span><time>{message.time.slice(11)}</time></div>
            <p>{message.text || "[空消息]"}</p>
            {message.kind !== "text" ? <small>{kindLabels[message.kind]} · {message.id}</small> : null}
          </article>
        ))}
      </div>
    </div>
  ))}</div>;
}

export function ChatReader({ personId, page, filters }: { personId: string; page: ChatArchivePage; filters: { start: string; end: string; search: string; sender: RelationSenderFilter; kind: string; page: number } }) {
  useFlashTargetMessage();
  const messageColumns = splitMessages(page.messages);
  const totalPages = Math.max(1, Math.ceil(page.total / CHAT_PAGE_SIZE));
  const currentPage = Math.min(Math.max(filters.page, 1), totalPages);
  const pageHref = (pageNumber: number) => buildHref(personId, { ...filters, page: pageNumber });
  const pageItems = paginationItems(totalPages, currentPage);

  return (
    <section className="relation-reader">
      <form className="relation-filter-bar" action={`/relation/chat/${personId}`}>
        <label>
          <span>从</span>
          <input type="date" name="start" defaultValue={filters.start} />
        </label>
        <label>
          <span>到</span>
          <input type="date" name="end" defaultValue={filters.end} />
        </label>
        <label className="relation-search-field">
          <span>搜索</span>
          <input name="search" defaultValue={filters.search} placeholder="关键词、原话、主题" />
        </label>
        <label>
          <span>发送者</span>
          <select name="sender" defaultValue={filters.sender}>
            <option value="all">全部</option>
            <option value="self">我</option>
            <option value="other">bc</option>
          </select>
        </label>
        <button type="submit" className="relation-action relation-action--dark">应用筛选</button>
        {page.total > 0 ? <nav className="relation-ledger-pagination relation-chat-pagination relation-chat-pagination--top" aria-label="原文分页">
          {currentPage > 1 ? <Link href={pageHref(currentPage - 1)} className="relation-pagination-control">上一页</Link> : <span className="relation-pagination-control is-disabled" aria-disabled="true">上一页</span>}
          {pageItems.map((item, index) => item === "ellipsis" ? <span key={`ellipsis-${index}`} className="relation-pagination-ellipsis" aria-hidden="true">…</span> : <Link key={item} href={pageHref(item)} className={`relation-pagination-control ${item === currentPage ? "is-active" : ""}`} aria-current={item === currentPage ? "page" : undefined}>{item}</Link>)}
          {currentPage < totalPages ? <Link href={pageHref(currentPage + 1)} className="relation-pagination-control">下一页</Link> : <span className="relation-pagination-control is-disabled" aria-disabled="true">下一页</span>}
          <span>第 {currentPage} / {totalPages} 页</span>
        </nav> : null}
      </form>

      <div className={`relation-timeline ${messageColumns.length > 1 ? "relation-timeline--dual" : ""}`}>
        {messageColumns.map((messages, index) => <MessageColumn key={`column-${index}`} messages={messages} />)}
      </div>

      {page.total === 0 ? <div className="relation-empty relation-empty--large">没有符合当前筛选条件的消息。</div> : null}
    </section>
  );
}

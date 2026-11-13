"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { key: "person", label: "人物详情" },
  { key: "chat", label: "原文查看" },
  { key: "analysis", label: "数据分析" },
  { key: "ai", label: "AI 分析" },
  { key: "persona", label: "角色模拟" },
] as const;

export function RelationWorkbenchNav({ personId, personName }: { personId: string; personName: string }) {
  const pathname = usePathname();
  const base = `/relation/people/${personId}`;
  return (
    <div className="relation-context-bar">
      <nav className="relation-tabs" aria-label={`${personName} 工作台`}>
        {items.map((item) => {
          const href = item.key === "person"
            ? base
            : item.key === "chat"
              ? `/relation/chat/${personId}`
              : item.key === "analysis"
                ? `/relation/analysis/${personId}`
                : item.key === "ai" ? `/relation/analysis/${personId}/ai` : `/relation/persona/${personId}`;
          const active = pathname === href;
          return (
            <Link key={item.key} href={href} className={active ? "is-active" : undefined}>
              <span className="relation-tab-index">0{items.indexOf(item) + 1}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

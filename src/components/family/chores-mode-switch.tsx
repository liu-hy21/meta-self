import Link from "next/link";

import type { ChoresViewMode } from "@/lib/chores";
import { choresPageQuery } from "@/lib/chores";

const options: { mode: ChoresViewMode; label: string }[] = [
  { mode: "board", label: "看板" },
  { mode: "record", label: "记录" },
];

export function ChoresModeSwitch({ mode }: { mode: ChoresViewMode }) {
  return (
    <div
      role="tablist"
      aria-label="家务视图"
      className="inline-flex rounded-full border-[3px] border-[#4a3326] bg-white p-1 shadow-[0_3px_0_#4a3326]"
    >
      {options.map((o) => {
        const active = o.mode === mode;
        return (
          <Link
            key={o.mode}
            role="tab"
            aria-selected={active}
            href={`/library/family/chores${choresPageQuery({ mode: o.mode })}`}
            className={`rounded-full px-4 py-1 text-xs font-bold text-[#4a3326] transition-colors ${
              active ? "bg-[#ffd27a]" : "hover:bg-[#fff1cf]"
            }`}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}

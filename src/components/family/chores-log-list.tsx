import Link from "next/link";

import type { ChoresViewMode } from "@/lib/chores";
import { choresPageQuery } from "@/lib/chores";

export type ChoreLogListItem = {
  id: string;
  text: string;
};

function EditIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 2.5 13.5 5.5 5 14H2v-3L10.5 2.5zM9 4l3 3" />
    </svg>
  );
}

export function ChoresEmpty({ hint }: { hint: string }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-2xl border-[2.5px] border-dashed border-[#4a3326]/30 px-4 text-center">
      <p className="text-xs leading-5 text-[#4a3326]/60">{hint}</p>
    </div>
  );
}

export function ChoresLogList({
  items,
  emptyHint,
  mode = "record",
  showEdit = true,
}: {
  items: ChoreLogListItem[];
  emptyHint: string;
  mode?: ChoresViewMode;
  showEdit?: boolean;
}) {
  if (items.length === 0) return <ChoresEmpty hint={emptyHint} />;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="q-item">
          <div className="flex items-start gap-3">
          <span className="mt-1.5 size-2.5 shrink-0 rounded-full border-2 border-[#4a3326] bg-[var(--q-tone)]" aria-hidden />
          <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-6 text-[#4a3326]">{item.text}</p>
          {showEdit ? (
            <Link
              href={`/library/family/chores${choresPageQuery({ mode, edit: item.id })}`}
              className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-transparent text-[#4a3326]/50 transition-colors hover:border-[#4a3326] hover:bg-white hover:text-[#4a3326] focus-visible:border-[#4a3326] focus-visible:outline-none"
              aria-label="编辑"
            >
              <EditIcon />
            </Link>
          ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

import Link from "next/link";

import { kitchenPageQuery, type KitchenViewMode } from "@/lib/kitchen";

export function KitchenModeSwitch({ mode }: { mode: KitchenViewMode }) {
  const board = mode === "board";
  const next: KitchenViewMode = board ? "record" : "board";

  return (
    <Link
      href={`/library/family/kitchen${kitchenPageQuery({ mode: next })}`}
      scroll={false}
      className="inline-flex items-center p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
      role="switch"
      aria-checked={board}
      aria-label={board ? "看板模式，切换到记录模式" : "记录模式，切换到看板模式"}
    >
      <span className="relative h-5 w-9 shrink-0 rounded-full bg-[#d9cbb3]">
        <span
          aria-hidden
          className={`absolute top-0.5 left-0.5 size-4 rounded-full border-2 border-[var(--ink)] bg-[var(--gold)] transition-transform ${
            board ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </Link>
  );
}

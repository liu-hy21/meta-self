import type { BodyEvidence } from "@/lib/queries/body";

export function EvidenceRail({ evidence }: { evidence: BodyEvidence }) {
  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-l-4 border-[var(--ink)] bg-[var(--panel)]">
      <div className="border-b border-[var(--line)] px-4 py-3">
        <p className="text-sm font-semibold">日志</p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {evidence.recent.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-[var(--muted)]">还没有身体流水</p>
        ) : (
          evidence.recent.map((row) => (
            <div key={row.label} className="pixel-box px-3 py-2.5">
              <p className="text-xs text-[var(--muted)]">{row.label}</p>
              <p className="mt-1 text-sm text-[var(--gold-deep)]">{row.detail}</p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

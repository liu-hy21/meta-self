import { Suspense } from "react";

import { loadBoardAdviceSections } from "@/lib/board/advice";
import { boardAdviceSections, boardAdviceSectionSplitIndex, type BoardAdviceSectionView } from "@/lib/board/advice-sections";
import type { BoardSnapshot } from "@/lib/board/snapshot";

export function BoardView({ snapshot }: { snapshot: BoardSnapshot }) {
  return (
    <div className="q-page">
      <Suspense fallback={<BoardAdviceColumns sections={placeholderSections()} loading />}>
        <BoardAdviceBoard snapshot={snapshot} />
      </Suspense>
    </div>
  );
}

function placeholderSections(): BoardAdviceSectionView[] {
  return boardAdviceSections.map((section) => ({
    id: section.id,
    title: section.title,
    text: null,
  }));
}

async function BoardAdviceBoard({ snapshot }: { snapshot: BoardSnapshot }) {
  const sections = await loadBoardAdviceSections(snapshot);
  return <BoardAdviceColumns sections={sections} />;
}

function BoardAdviceColumns({ sections, loading }: { sections: BoardAdviceSectionView[]; loading?: boolean }) {
  const left = sections.slice(0, boardAdviceSectionSplitIndex);
  const right = sections.slice(boardAdviceSectionSplitIndex);

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="flex flex-col gap-6">
        {left.map((section) => (
          <AdviceCard key={section.id} section={section} loading={loading} />
        ))}
      </div>
      <div className="flex flex-col gap-6">
        {right.map((section) => (
          <AdviceCard key={section.id} section={section} loading={loading} />
        ))}
      </div>
    </div>
  );
}

function AdviceCard({ section, loading }: { section: BoardAdviceSectionView; loading?: boolean }) {
  const body = loading
    ? "建议生成中…"
    : section.text ?? "填写相关档案或日志后，可在此看到建议。";

  return (
    <section className="pixel-box p-4">
      <h2 className="text-sm font-semibold">{section.title}</h2>
      <p className={`mt-3 text-sm leading-6 ${section.text ? "text-[var(--gold-deep)]" : "text-[var(--muted)]"}`}>
        {body}
      </p>
    </section>
  );
}

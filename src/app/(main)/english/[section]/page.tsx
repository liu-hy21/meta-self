import { notFound } from "next/navigation";

import { TravelScenes } from "@/components/english/travel-scenes";
import { pageWrap } from "@/components/ui/form-shell";
import { englishSectionLabel } from "@/lib/library-english";

export default async function EnglishSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const label = englishSectionLabel(section);
  if (!label) notFound();

  if (section === "travel") {
    return (
      <div className={pageWrap}>
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--muted)]">English · Travel</p>
            <h2 className="mt-1 text-base font-semibold">旅行场景口语</h2>
          </div>
        </header>
        <TravelScenes />
      </div>
    );
  }

  return (
    <div className={pageWrap}>
      <section className="pixel-box flex min-h-[min(70vh,40rem)] flex-col">
        <div className="border-b-2 border-[var(--ink)] px-4 py-3">
          <p className="text-sm font-semibold">{label}</p>
        </div>
        <div className="grid min-h-[12rem] flex-1 place-items-center px-4 py-4">
          <p className="max-w-sm text-center text-xs leading-5 text-[var(--muted)]">英语 · {label} 内容会放在这里。</p>
        </div>
      </section>
    </div>
  );
}

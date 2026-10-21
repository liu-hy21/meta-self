import { notFound } from "next/navigation";

import { pageWrap } from "@/components/ui/form-shell";
import { familySectionLabel } from "@/lib/library-family";

export default async function FamilySectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const label = familySectionLabel(section);
  if (!label) notFound();

  return (
    <div className={pageWrap}>
      <section className="pixel-box flex min-h-[min(70vh,40rem)] flex-col">
        <div className="border-b-2 border-[var(--ink)] px-4 py-3">
          <p className="text-sm font-semibold">{label}</p>
        </div>
        <div className="grid min-h-[12rem] flex-1 place-items-center px-4 py-4">
          <p className="max-w-sm text-center text-xs leading-5 text-[var(--muted)]">家庭 · {label} 内容会放在这里。</p>
        </div>
      </section>
    </div>
  );
}

import { notFound } from "next/navigation";

import { drawToolLabel } from "@/lib/library-draw";

export default async function DrawToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const label = drawToolLabel(tool);
  if (!label) notFound();

  return (
    <div className="p-4">
      <section className="pixel-box flex min-h-[min(70vh,40rem)] flex-col">
        <div className="border-b-2 border-[var(--ink)] px-4 py-3">
          <p className="text-sm font-semibold">{label}</p>
        </div>
        <div className="grid min-h-[12rem] flex-1 place-items-center px-4 py-4">
          <p className="max-w-sm text-center text-xs leading-5 text-[var(--muted)]">绘制内容会放在这里。</p>
        </div>
      </section>
    </div>
  );
}

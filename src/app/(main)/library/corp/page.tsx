import { pageWrap } from "@/components/ui/form-shell";

export default function CorpLibraryPage() {
  return (
    <div className={pageWrap}>
      <section className="pixel-box flex min-h-[min(70vh,40rem)] flex-col">
        <div className="border-b-2 border-[var(--ink)] px-4 py-3">
          <p className="text-sm font-semibold">corp</p>
        </div>
        <div className="grid min-h-[12rem] flex-1 place-items-center px-4 py-4">
          <p className="max-w-sm text-center text-xs leading-5 text-[var(--muted)]">数据资产 · corp 内容会放在这里。</p>
        </div>
      </section>
    </div>
  );
}

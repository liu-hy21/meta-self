export default function ArticleLibraryPage() {
  return (
    <div className="p-4">
      <div className="grid items-stretch gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="pixel-box flex min-h-64 flex-col">
          <div className="border-b-2 border-[var(--ink)] px-3 py-2">
            <p className="text-sm font-semibold">目录</p>
          </div>
          <div className="grid flex-1 place-items-center px-3 py-6">
            <p className="text-xs text-[var(--muted)]">还没有图文</p>
          </div>
        </aside>

        <section className="pixel-box flex min-h-64 flex-col">
          <div className="border-b-2 border-[var(--ink)] px-4 py-3">
            <p className="text-sm font-semibold">正文</p>
          </div>
          <div className="grid flex-1 place-items-center px-6 py-10">
            <p className="max-w-sm text-center text-xs leading-5 text-[var(--muted)]">从左边点开一篇，标题和正文会出现在这里。</p>
          </div>
        </section>
      </div>
    </div>
  );
}

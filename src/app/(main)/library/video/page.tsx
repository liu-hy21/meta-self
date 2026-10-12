export default function VideoLibraryPage() {
  return (
    <div className="p-4">
      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
        <section className="flex min-w-0 flex-col gap-3">
          <div className="pixel-box p-3">
            <div className="grid aspect-video w-full place-items-center bg-[var(--ink)]">
              <p className="text-sm text-[var(--panel)]">画面</p>
            </div>
          </div>
          <div className="pixel-box px-4 py-3">
            <p className="text-sm font-semibold">还没有选中的视频</p>
            <p className="mt-1 text-xs text-[var(--muted)]">片单里点一条，画面出现在这里。</p>
          </div>
        </section>

        <aside className="pixel-box flex min-h-48 flex-col">
          <div className="border-b-2 border-[var(--ink)] px-3 py-2">
            <p className="text-sm font-semibold">片单</p>
          </div>
          <div className="grid flex-1 place-items-center px-3 py-6">
            <p className="text-xs text-[var(--muted)]">还没有视频</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

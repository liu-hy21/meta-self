import Link from "next/link";

import { fieldClass, labelClass, submitClass } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";

const errors: Record<string, string> = {
  file: "先选一个视频文件。",
  size: "单个视频不超过 200MB。",
  type: "只收 mp4、webm、mov。",
};

export default async function VideoLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; error?: string }>;
}) {
  const user = await getAppUser();
  const { id, error } = await searchParams;
  const videos = await prisma.libraryVideo.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const current = videos.find((video) => video.id === id) ?? videos[0] ?? null;
  const message = error ? errors[error] : null;

  return (
    <div className="p-4">
      <div className="grid items-stretch gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section className="flex w-full max-w-[20rem] flex-col gap-3">
          <div className="pixel-box p-3">
            <div className="grid aspect-[9/16] w-full place-items-center bg-[var(--ink)]">
              {current ? (
                <video
                  key={current.id}
                  controls
                  playsInline
                  className="h-full w-full bg-black"
                  src={`/api/library/videos/${current.id}`}
                />
              ) : (
                <p className="text-sm text-[var(--panel)]">画面</p>
              )}
            </div>
          </div>
          <div className="pixel-box px-4 py-3">
            <p className="text-sm font-semibold">{current?.title ?? "还没有选中的视频"}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {current ? "手机竖屏播放。" : "片单里点一条，画面出现在这里。"}
            </p>
          </div>
        </section>

        <aside className="pixel-box flex min-h-48 flex-col">
          <div className="border-b-2 border-[var(--ink)] px-3 py-3">
            <p className="text-sm font-semibold">片单</p>
            <form action="/api/library/videos" method="post" encType="multipart/form-data" className="mt-3 grid gap-3">
              <div>
                <label className={labelClass()} htmlFor="title">
                  标题
                </label>
                <input id="title" name="title" placeholder="不填就用文件名" className={fieldClass()} />
              </div>
              <input
                name="file"
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                required
                className="text-xs file:mr-2 file:inline-flex file:h-8 file:items-center file:justify-center file:border-2 file:border-[var(--ink)] file:bg-[var(--panel)] file:px-3 file:leading-none"
              />
              <button type="submit" className={`${submitClass()} w-fit`}>
                上传
              </button>
              {message ? <p className="text-xs text-[var(--gold-deep)]">{message}</p> : null}
            </form>
          </div>
          {videos.length === 0 ? (
            <div className="grid flex-1 place-items-center px-3 py-6">
              <p className="text-xs text-[var(--muted)]">还没有视频</p>
            </div>
          ) : (
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {videos.map((video) => {
                const active = video.id === current?.id;
                return (
                  <li key={video.id} className="border-b-2 border-[var(--ink)] last:border-b-0">
                    <Link
                      href={`/library/video?id=${video.id}`}
                      aria-current={active ? "page" : undefined}
                      className={`block px-3 py-3 text-sm ${active ? "bg-[var(--gold)]" : "bg-[var(--panel)]"}`}
                    >
                      {video.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

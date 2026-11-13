import Link from "next/link";

import { fieldClass, labelClass, pageWrap, submitClass } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { LIBRARY_VIDEO_CATEGORIES, libraryVideoCategory, libraryVideoTitle, type LibraryVideoCategory } from "@/lib/library-video";
import { getAppUser } from "@/lib/user";

const VIDEO_PAGE_SIZE = 10;

const errors: Record<string, string> = {
  file: "先选一个视频文件。",
  size: "单个视频不超过 500MB。",
  type: "只收 mp4、webm、mov。",
  category: "请选择有效分类。",
};

function EditIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10.9 2.2 2.9 2.9" />
      <path d="m3 13 2.5-.5L13 5a1.6 1.6 0 0 0-2.3-2.3L3.2 10.5 3 13Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 8.2 3.2 3.1L13 4.8" />
    </svg>
  );
}

function CancelIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  );
}

const categoryStyles: Record<LibraryVideoCategory, string> = {
  实战: "bg-[#d9e7f8] text-[#1e4d85]",
  稳住: "bg-[#e5dcf5] text-[#5b3a84]",
  理念: "bg-[#f1d6c4] text-[#8a4324]",
};

export default async function VideoLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; error?: string; page?: string; edit?: string }>;
}) {
  const user = await getAppUser();
  const { id, error, page, edit } = await searchParams;
  const requestedPage = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const allVideos = (await prisma.libraryVideo.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })).sort((left, right) => {
    const leftRank = LIBRARY_VIDEO_CATEGORIES.indexOf(libraryVideoCategory(left.title, left.category));
    const rightRank = LIBRARY_VIDEO_CATEGORIES.indexOf(libraryVideoCategory(right.title, right.category));
    return leftRank - rightRank || right.createdAt.getTime() - left.createdAt.getTime();
  });
  const totalVideos = allVideos.length;
  const totalPages = Math.max(1, Math.ceil(totalVideos / VIDEO_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const videos = allVideos.slice((currentPage - 1) * VIDEO_PAGE_SIZE, currentPage * VIDEO_PAGE_SIZE);
  const selectedVideo = id ? allVideos.find((video) => video.id === id) ?? null : null;
  const editingVideo = edit ? allVideos.find((video) => video.id === edit) ?? null : null;
  const current = selectedVideo ?? videos[0] ?? null;
  const message = error ? errors[error] : null;
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams({ page: String(nextPage) });
    if (current?.id) params.set("id", current.id);
    return `/library/video?${params.toString()}`;
  };

  return (
    <div className={`${pageWrap} h-full min-h-0 overflow-hidden`}>
      <div className="grid min-h-0 flex-1 items-stretch gap-4 overflow-hidden lg:grid-cols-[24rem_minmax(0,1fr)]">
        <section className="flex min-h-0 w-full max-w-[24rem] flex-col">
          <div className="pixel-box flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3">
            <div className="grid h-full max-h-full max-w-full aspect-[9/16] place-items-center bg-[var(--ink)]">
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
        </section>

        <aside className="pixel-box flex min-h-0 flex-col overflow-hidden">
          <div className="border-b-2 border-[var(--ink)] px-3 py-3">
            <p className="text-sm font-semibold">片单</p>
            <form action="/api/library/videos" method="post" encType="multipart/form-data" className="mt-3 grid gap-3">
              <div>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                  <div>
                    <label className={labelClass()} htmlFor="title">
                      标题
                    </label>
                    <input id="title" name="title" placeholder="不填就用文件名" className={fieldClass()} />
                  </div>
                  <div>
                    <label className={labelClass()} htmlFor="category">
                      分类
                    </label>
                    <select id="category" name="category" defaultValue="理念" className={fieldClass()}>
                      {LIBRARY_VIDEO_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <button type="submit" className={`${submitClass()} shrink-0`}>
                  上传
                </button>
                <input
                  name="file"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                  required
                  className="min-w-0 flex-1 text-xs file:mr-2 file:inline-flex file:h-8 file:items-center file:justify-center file:border-2 file:border-[var(--ink)] file:bg-[var(--panel)] file:px-3 file:leading-none"
                />
              </div>
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
                const editing = video.id === editingVideo?.id;
                const category = libraryVideoCategory(video.title, video.category);
                const title = libraryVideoTitle(video.title);
                return (
                  <li key={video.id} className="border-b-2 border-[var(--ink)] last:border-b-0">
                    {editing ? (
                      <form action={`/api/library/videos/${video.id}`} method="post" className="flex items-center gap-2 bg-[var(--gold)] p-2">
                        <input type="hidden" name="page" value={currentPage} />
                        <input name="title" defaultValue={title} aria-label={`编辑${title}`} className="min-w-0 flex-1 border-2 border-[var(--ink)] bg-[var(--panel)] px-2 py-1 text-sm" />
                        <select name="category" defaultValue={category} aria-label="视频分类" className="w-20 border-2 border-[var(--ink)] bg-[var(--panel)] px-1 py-1 text-xs">
                          {LIBRARY_VIDEO_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                        </select>
                        <button type="submit" aria-label={`保存${title}`} className="inline-flex size-8 shrink-0 items-center justify-center border-2 border-[var(--ink)] bg-[var(--panel)]">
                          <CheckIcon />
                        </button>
                        <Link href={`/library/video?id=${current?.id ?? video.id}&page=${currentPage}`} aria-label="取消编辑" className="inline-flex size-8 shrink-0 items-center justify-center border-2 border-[var(--ink)] bg-[var(--panel)]">
                          <CancelIcon />
                        </Link>
                      </form>
                    ) : (
                      <div className={`flex items-center ${active ? "bg-[var(--gold)]" : "bg-[var(--panel)]"}`}>
                        <Link
                          href={`/library/video?id=${video.id}&page=${currentPage}`}
                          aria-current={active ? "page" : undefined}
                          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm"
                        >
                          <span className={`inline-flex h-7 min-w-16 shrink-0 items-center justify-center border-2 border-[var(--ink)] px-2 text-sm font-semibold ${categoryStyles[category]}`}>
                            {category}
                          </span>
                          <span className="min-w-0 truncate">{title}</span>
                        </Link>
                        <Link
                          href={`/library/video?id=${video.id}&page=${currentPage}&edit=${video.id}`}
                          aria-label={`编辑${title}`}
                          className="mr-2 inline-flex size-8 shrink-0 items-center justify-center border-2 border-transparent hover:border-[var(--ink)]"
                        >
                          <EditIcon />
                        </Link>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {totalPages > 1 ? (
            <nav className="flex shrink-0 items-center justify-between gap-3 border-t-2 border-[var(--ink)] px-3 py-2 text-xs" aria-label="片单分页">
              {currentPage > 1 ? (
                <Link href={pageHref(currentPage - 1)} className="border-2 border-[var(--ink)] bg-[var(--panel)] px-2 py-1">
                  上一页
                </Link>
              ) : (
                <span className="border-2 border-[var(--ink)] px-2 py-1 opacity-40">上一页</span>
              )}
              <span>第 {currentPage} / {totalPages} 页</span>
              {currentPage < totalPages ? (
                <Link href={pageHref(currentPage + 1)} className="border-2 border-[var(--ink)] bg-[var(--panel)] px-2 py-1">
                  下一页
                </Link>
              ) : (
                <span className="border-2 border-[var(--ink)] px-2 py-1 opacity-40">下一页</span>
              )}
            </nav>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

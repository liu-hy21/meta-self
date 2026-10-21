import Link from "next/link";
import { notFound } from "next/navigation";

import { createLibraryArticleEntry } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { backClass, fieldClass, labelClass, pageWrap, submitClass } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { articleBodyLineCount, articleTopicLabel } from "@/lib/library-article";
import { getAppUser } from "@/lib/user";

export default async function ArticleTopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await getAppUser();
  const [{ topic }, { edit }] = await Promise.all([params, searchParams]);
  const label = articleTopicLabel(topic);
  if (!label) notFound();

  const entries = (
    await prisma.libraryArticleEntry.findMany({
      where: { userId: user.id, topic },
    })
  ).toSorted((a, b) => articleBodyLineCount(a.body) - articleBodyLineCount(b.body));
  const editing = edit === "1";
  const base = `/library/article/${topic}`;

  return (
    <div className={pageWrap}>
      <section className="pixel-box flex min-h-[min(70vh,40rem)] flex-col">
        <div className="flex items-center justify-between gap-3 border-b-2 border-[var(--ink)] px-4 py-3">
          <p className="text-sm font-semibold">{label}</p>
          {editing ? (
            <Link href={base} className={backClass}>
              返回
            </Link>
          ) : (
            <Link href={`${base}?edit=1`} className={submitClass()}>
              记一条
            </Link>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {editing ? (
            <form action={createLibraryArticleEntry} className="grid gap-4">
              <input type="hidden" name="topic" value={topic} />
              <div>
                <label className={labelClass()} htmlFor="body">
                  正文
                </label>
                <textarea id="body" name="body" rows={10} required className={fieldClass()} placeholder="写在这里" />
              </div>
              <SaveButton />
            </form>
          ) : null}

          {entries.length === 0 && !editing ? (
            <div className="grid min-h-[12rem] place-items-center">
              <p className="max-w-sm text-center text-xs leading-5 text-[var(--muted)]">还没有内容。点「记一条」开始写。</p>
            </div>
          ) : (
            <ul className={`grid gap-3 ${editing ? "mt-4" : ""}`}>
              {entries.map((entry) => (
                <li key={entry.id} className="border-2 border-[var(--ink)] bg-[var(--panel)] px-4 py-3">
                  <p className="whitespace-pre-wrap text-sm text-[var(--gold-deep)]">{entry.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

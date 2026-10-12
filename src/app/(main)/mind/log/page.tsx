import Link from "next/link";

import { createMindInfoLog } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { backClass, fieldClass, labelClass, pageWrap, submitClass } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";

export default async function MindLogPage({
  searchParams,
}: {
  searchParams: Promise<{ write?: string }>;
}) {
  const user = await getAppUser();
  const [{ write }, logs] = await Promise.all([
    searchParams,
    prisma.mindInfoLog.findMany({
      where: { userId: user.id },
      orderBy: [{ writtenOn: "desc" }, { createdAt: "desc" }],
      take: 30,
    }),
  ]);
  const writing = write === "1" || logs.length === 0;

  return (
    <div className={pageWrap}>
      <section className="pixel-box p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">心态日志</h2>
          {writing ? (
            logs.length > 0 ? (
              <Link href="/mind/log" className={backClass}>
                返回
              </Link>
            ) : null
          ) : (
            <Link href="/mind/log?write=1" className={submitClass()}>
              写一条
            </Link>
          )}
        </div>
        {writing ? (
          <form action={createMindInfoLog} className="grid gap-4">
            <div>
              <label className={labelClass()} htmlFor="emotion">
                情绪
              </label>
              <textarea id="emotion" name="emotion" rows={3} className={fieldClass()} />
            </div>
            <div>
              <label className={labelClass()} htmlFor="psyche">
                心理
              </label>
              <textarea id="psyche" name="psyche" rows={3} className={fieldClass()} />
            </div>
            <SaveButton label="保存这条" />
          </form>
        ) : (
          <ul className="space-y-3">
            {logs.map((log) => (
              <li key={log.id} className="border-2 border-[var(--ink)] bg-[var(--panel)] px-4 py-3">
                <p className="text-xs text-[var(--muted)]">
                  {log.writtenOn.toLocaleString("zh-CN", {
                    timeZone: "Asia/Shanghai",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div className="mt-2 space-y-2 text-sm">
                  {log.emotion ? (
                    <p className="whitespace-pre-wrap">
                      <span className="text-[var(--gold-deep)]">情绪</span>
                      {" · "}
                      {log.emotion}
                    </p>
                  ) : null}
                  {log.psyche ? (
                    <p className="whitespace-pre-wrap">
                      <span className="text-[var(--gold-deep)]">心理</span>
                      {" · "}
                      {log.psyche}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

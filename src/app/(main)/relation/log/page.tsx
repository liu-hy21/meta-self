import Link from "next/link";

import { createRelationInfoLog } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { backClass, fieldClass, labelClass, pageWrap, submitClass } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";

export default async function RelationLogPage({
  searchParams,
}: {
  searchParams: Promise<{ write?: string }>;
}) {
  const user = await getAppUser();
  const [{ write }, logs] = await Promise.all([
    searchParams,
    prisma.relationInfoLog.findMany({
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
          <h2 className="text-base font-semibold">关系日志</h2>
          {writing ? (
            logs.length > 0 ? (
              <Link href="/relation/log" className={backClass}>
                返回
              </Link>
            ) : null
          ) : (
            <Link href="/relation/log?write=1" className={submitClass()}>
              写一条
            </Link>
          )}
        </div>
        {writing ? (
          <form action={createRelationInfoLog} className="grid gap-4">
            <div>
              <label className={labelClass()} htmlFor="person">
                谁
              </label>
              <input id="person" name="person" className={fieldClass()} />
            </div>
            <div>
              <label className={labelClass()} htmlFor="happened">
                一句
              </label>
              <textarea id="happened" name="happened" rows={3} className={fieldClass()} />
            </div>
            <div className="max-w-xs">
              <label className={labelClass()} htmlFor="feeling">
                我的感受 1–5
              </label>
              <input id="feeling" name="feeling" type="number" min={1} max={5} className={fieldClass()} />
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
                  {log.person ? (
                    <p>
                      <span className="text-[var(--gold-deep)]">谁</span>
                      {" · "}
                      {log.person}
                    </p>
                  ) : null}
                  {log.happened ? (
                    <p className="whitespace-pre-wrap">
                      <span className="text-[var(--gold-deep)]">一句</span>
                      {" · "}
                      {log.happened}
                    </p>
                  ) : null}
                  {log.feeling != null ? (
                    <p>
                      <span className="text-[var(--gold-deep)]">感受</span>
                      {" · "}
                      {log.feeling}
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

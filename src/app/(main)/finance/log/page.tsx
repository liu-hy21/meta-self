import Link from "next/link";

import { createFinanceInfoLog } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { backClass, fieldClass, labelClass, pageWrap, submitClass } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";

export default async function FinanceLogPage({
  searchParams,
}: {
  searchParams: Promise<{ write?: string }>;
}) {
  const user = await getAppUser();
  const [{ write }, logs] = await Promise.all([
    searchParams,
    prisma.financeInfoLog.findMany({
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
          <h2 className="text-base font-semibold">财商日志</h2>
          {writing ? (
            logs.length > 0 ? (
              <Link href="/finance/log" className={backClass}>
                返回
              </Link>
            ) : null
          ) : (
            <Link href="/finance/log?write=1" className={submitClass()}>
              写一条
            </Link>
          )}
        </div>
        {writing ? (
          <form action={createFinanceInfoLog} className="grid gap-4">
            <div>
              <label className={labelClass()} htmlFor="learned">
                学了什么
              </label>
              <textarea id="learned" name="learned" rows={3} className={fieldClass()} />
            </div>
            <div>
              <label className={labelClass()} htmlFor="decision">
                决定
              </label>
              <textarea id="decision" name="decision" rows={3} className={fieldClass()} />
            </div>
            <div>
              <label className={labelClass()} htmlFor="outcome">
                结果
              </label>
              <textarea id="outcome" name="outcome" rows={2} placeholder="还不知道就留空" className={fieldClass()} />
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
                  {log.learned ? (
                    <p className="whitespace-pre-wrap">
                      <span className="text-[var(--gold-deep)]">学了什么</span>
                      {" · "}
                      {log.learned}
                    </p>
                  ) : null}
                  {log.decision ? (
                    <p className="whitespace-pre-wrap">
                      <span className="text-[var(--gold-deep)]">决定</span>
                      {" · "}
                      {log.decision}
                    </p>
                  ) : null}
                  {log.outcome ? (
                    <p className="whitespace-pre-wrap">
                      <span className="text-[var(--gold-deep)]">结果</span>
                      {" · "}
                      {log.outcome}
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

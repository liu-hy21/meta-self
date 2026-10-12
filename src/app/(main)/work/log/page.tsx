import Link from "next/link";

import { createWorkInfoLog } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { backClass, fieldClass, labelClass, pageWrap, submitClass } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";

const fields = [
  ["occasion", "场合"],
  ["outcome", "结果"],
  ["nextChange", "下次"],
] as const;

export default async function WorkLogPage({
  searchParams,
}: {
  searchParams: Promise<{ write?: string }>;
}) {
  const user = await getAppUser();
  const [{ write }, logs] = await Promise.all([
    searchParams,
    prisma.workInfoLog.findMany({
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
          <h2 className="text-base font-semibold">工作日志</h2>
          {writing ? (
            logs.length > 0 ? (
              <Link href="/work/log" className={backClass}>
                返回
              </Link>
            ) : null
          ) : (
            <Link href="/work/log?write=1" className={submitClass()}>
              写一条
            </Link>
          )}
        </div>
        {writing ? (
          <form action={createWorkInfoLog} className="grid gap-4">
            {fields.map(([name, label]) => (
              <div key={name}>
                <label className={labelClass()} htmlFor={name}>
                  {label}
                </label>
                <textarea id={name} name={name} rows={3} className={fieldClass()} />
              </div>
            ))}
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
                  {fields.map(([name, label]) =>
                    log[name] ? (
                      <p key={name} className="whitespace-pre-wrap">
                        <span className="text-[var(--gold-deep)]">{label}</span>
                        {" · "}
                        {log[name]}
                      </p>
                    ) : null,
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

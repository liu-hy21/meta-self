import Link from "next/link";

import { createBodyInfoLog, createMedicalVisitLog } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { backClass, fieldClass, labelClass, pageWrap, submitClass } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";

const sections = [
  ["body", "身体"],
  ["diet", "饮食"],
  ["sleep", "睡眠"],
  ["exam", "体检"],
] as const;

function stamp(date: Date) {
  return date.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

export default async function BodyLogPage({
  searchParams,
}: {
  searchParams: Promise<{ write?: string; medicalWrite?: string }>;
}) {
  const user = await getAppUser();
  const [{ write, medicalWrite }, logs, medicalLogs] = await Promise.all([
    searchParams,
    prisma.bodyInfoLog.findMany({
      where: { userId: user.id },
      orderBy: [{ writtenOn: "desc" }, { createdAt: "desc" }],
      take: 30,
    }),
    prisma.medicalVisitLog.findMany({
      where: { userId: user.id },
      orderBy: [{ visitedOn: "desc" }, { createdAt: "desc" }],
      take: 30,
    }),
  ]);
  const writing = write === "1" || logs.length === 0;
  const medicalWriting = medicalWrite === "1" || medicalLogs.length === 0;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });

  return (
    <div className={pageWrap}>
      <section className="pixel-box p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">身体日志</h2>
          {writing ? (
            logs.length > 0 ? (
              <Link href="/body/log" className={backClass}>
                返回
              </Link>
            ) : null
          ) : (
            <Link href="/body/log?write=1" className={submitClass()}>
              写一条
            </Link>
          )}
        </div>

        {writing ? (
          <form action={createBodyInfoLog} className="grid gap-4">
            {sections.map(([name, label]) => (
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
                <div className="mt-2 space-y-2">
                  {sections.map(([name, label]) =>
                    log[name] ? (
                      <p key={name} className="whitespace-pre-wrap text-sm">
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

      <section className="pixel-box p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">看病记录</h2>
          {medicalWriting ? (
            medicalLogs.length > 0 ? (
              <Link href="/body/log" className={backClass}>
                返回
              </Link>
            ) : null
          ) : (
            <Link href="/body/log?medicalWrite=1" className={submitClass()}>
              记一条
            </Link>
          )}
        </div>

        {medicalWriting ? (
          <form action={createMedicalVisitLog} className="grid gap-4">
            <div>
              <label className={labelClass()} htmlFor="visitedOn">
                就诊日期
              </label>
              <input id="visitedOn" name="visitedOn" type="date" className={fieldClass()} defaultValue={today} />
            </div>
            <div>
              <label className={labelClass()} htmlFor="hospital">
                医院
              </label>
              <input id="hospital" name="hospital" type="text" className={fieldClass()} placeholder="可选" />
            </div>
            <div>
              <label className={labelClass()} htmlFor="department">
                科室
              </label>
              <input id="department" name="department" type="text" className={fieldClass()} placeholder="可选" />
            </div>
            <div>
              <label className={labelClass()} htmlFor="note">
                记录
              </label>
              <textarea
                id="note"
                name="note"
                rows={4}
                className={fieldClass()}
                placeholder="症状、诊断、用药、医嘱、复查等"
              />
            </div>
            <SaveButton label="保存看病记录" />
          </form>
        ) : (
          <ul className="space-y-3">
            {medicalLogs.map((visit) => (
              <li key={visit.id} className="border-2 border-[var(--ink)] bg-[var(--panel)] px-4 py-3">
                <p className="text-xs text-[var(--muted)]">{stamp(visit.visitedOn)}</p>
                <div className="mt-2 space-y-1 text-sm">
                  {visit.hospital ? (
                    <p>
                      <span className="text-[var(--gold-deep)]">医院</span>
                      {" · "}
                      {visit.hospital}
                    </p>
                  ) : null}
                  {visit.department ? (
                    <p>
                      <span className="text-[var(--gold-deep)]">科室</span>
                      {" · "}
                      {visit.department}
                    </p>
                  ) : null}
                  {visit.note ? <p className="whitespace-pre-wrap">{visit.note}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

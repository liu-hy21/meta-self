import Link from "next/link";
import type { BodyInfoLog, MedicalVisitLog } from "@prisma/client";

import { createBodyInfoLog, createMedicalVisitLog } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { backClass, fieldClass, labelClass, submitClass } from "@/components/ui/form-shell";
import { logDay, logStamp } from "@/components/logs/stamp";

const sections = [
  ["body", "身体"],
  ["diet", "饮食"],
  ["sleep", "睡眠"],
  ["exam", "体检"],
] as const;

const base = "/body/profile";

export function BodyLogRail({
  logs,
  medicalLogs,
  writing,
  medicalWriting,
  today,
}: {
  logs: BodyInfoLog[];
  medicalLogs: MedicalVisitLog[];
  writing: boolean;
  medicalWriting: boolean;
  today: string;
}) {
  return (
    <div className="space-y-4">
      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">身体日志</h3>
          {writing ? (
            logs.length > 0 ? (
              <Link href={base} className={backClass}>
                返回
              </Link>
            ) : null
          ) : (
            <Link href={`${base}?write=1`} className={submitClass()}>
              写一条
            </Link>
          )}
        </div>
        {writing ? (
          <form action={createBodyInfoLog} className="grid gap-3">
            {sections.map(([name, label]) => (
              <div key={name}>
                <label className={labelClass()} htmlFor={`body-log-${name}`}>
                  {label}
                </label>
                <textarea id={`body-log-${name}`} name={name} rows={2} className={fieldClass()} />
              </div>
            ))}
            <SaveButton label="保存这条" />
          </form>
        ) : logs.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">还没有身体日志。</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="pixel-box px-3 py-2.5">
                <p className="text-xs text-[var(--muted)]">{logStamp(log.writtenOn)}</p>
                <div className="mt-1 space-y-1">
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

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">看病记录</h3>
          {medicalWriting ? (
            medicalLogs.length > 0 ? (
              <Link href={base} className={backClass}>
                返回
              </Link>
            ) : null
          ) : (
            <Link href={`${base}?medicalWrite=1`} className={submitClass()}>
              记一条
            </Link>
          )}
        </div>
        {medicalWriting ? (
          <form action={createMedicalVisitLog} className="grid gap-3">
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
              <textarea id="note" name="note" rows={3} className={fieldClass()} placeholder="症状、诊断、用药、医嘱" />
            </div>
            <SaveButton label="保存看病记录" />
          </form>
        ) : medicalLogs.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">还没有看病记录。</p>
        ) : (
          <ul className="space-y-2">
            {medicalLogs.map((visit) => (
              <li key={visit.id} className="pixel-box px-3 py-2.5">
                <p className="text-xs text-[var(--muted)]">{logDay(visit.visitedOn)}</p>
                <div className="mt-1 space-y-1 text-sm">
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

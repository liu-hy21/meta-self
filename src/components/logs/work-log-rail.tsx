import Link from "next/link";
import type { WorkInfoLog } from "@prisma/client";

import { createWorkInfoLog } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { logStamp } from "@/components/logs/stamp";
import { backClass, fieldClass, labelClass, submitClass } from "@/components/ui/form-shell";

const fields = [
  ["occasion", "场合"],
  ["outcome", "结果"],
  ["nextChange", "下次"],
] as const;

const base = "/work/profile";

export function WorkLogRail({ logs, writing }: { logs: WorkInfoLog[]; writing: boolean }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">工作日志</h3>
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
        <form action={createWorkInfoLog} className="grid gap-3">
          {fields.map(([name, label]) => (
            <div key={name}>
              <label className={labelClass()} htmlFor={`work-log-${name}`}>
                {label}
              </label>
              <textarea id={`work-log-${name}`} name={name} rows={2} className={fieldClass()} />
            </div>
          ))}
          <SaveButton label="保存这条" />
        </form>
      ) : logs.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">还没有工作日志。</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="pixel-box px-3 py-2.5">
              <p className="text-xs text-[var(--muted)]">{logStamp(log.writtenOn)}</p>
              <div className="mt-1 space-y-1 text-sm">
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
  );
}

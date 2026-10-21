import Link from "next/link";
import type { RelationInfoLog } from "@prisma/client";

import { createRelationInfoLog } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { logStamp } from "@/components/logs/stamp";
import { backClass, fieldClass, labelClass, submitClass } from "@/components/ui/form-shell";

const base = "/relation/profile";

export function RelationLogRail({ logs, writing }: { logs: RelationInfoLog[]; writing: boolean }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">关系日志</h3>
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
        <form action={createRelationInfoLog} className="grid gap-3">
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
          <div>
            <label className={labelClass()} htmlFor="feeling">
              我的感受 1–5
            </label>
            <input id="feeling" name="feeling" type="number" min={1} max={5} className={fieldClass()} />
          </div>
          <SaveButton label="保存这条" />
        </form>
      ) : logs.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">还没有关系日志。</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="pixel-box px-3 py-2.5">
              <p className="text-xs text-[var(--muted)]">{logStamp(log.writtenOn)}</p>
              <div className="mt-1 space-y-1 text-sm">
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
  );
}

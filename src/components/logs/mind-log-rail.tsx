import Link from "next/link";
import type { MindInfoLog } from "@prisma/client";

import { createMindInfoLog } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { logStamp } from "@/components/logs/stamp";
import { backClass, fieldClass, labelClass, submitClass } from "@/components/ui/form-shell";

const base = "/mind/profile";

export function MindLogRail({ logs, writing }: { logs: MindInfoLog[]; writing: boolean }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">心态日志</h3>
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
        <form action={createMindInfoLog} className="grid gap-3">
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
      ) : logs.length === 0 ? (
        <p className="text-xs text-[var(--muted)]">还没有心态日志。</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="pixel-box px-3 py-2.5">
              <p className="text-xs text-[var(--muted)]">{logStamp(log.writtenOn)}</p>
              <div className="mt-1 space-y-1 text-sm">
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
  );
}

import Link from "next/link";
import type { PlayDistrict } from "@prisma/client";

import { createPlayDistrict } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { backClass, fieldClass, labelClass, submitClass } from "@/components/ui/form-shell";

const base = "/finance/profile?tab=play";

export function DistrictBlock({ districts, edit }: { districts: PlayDistrict[]; edit?: string }) {
  const editing = edit === "districts";

  return (
    <section className="pixel-box p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">各大商圈</h2>
        {editing ? (
          <Link href={base} className={backClass}>
            返回
          </Link>
        ) : (
          <Link href={`${base}&edit=districts`} className={submitClass()}>
            记一次
          </Link>
        )}
      </div>

      {editing ? (
        <form action={createPlayDistrict} className="grid gap-4">
          <div>
            <label className={labelClass()} htmlFor="district">
              商圈
            </label>
            <input id="district" name="district" placeholder="解放碑" className={fieldClass()} />
          </div>
          <div>
            <label className={labelClass()} htmlFor="project">
              项目
            </label>
            <input id="project" name="project" placeholder="逛街、吃饭" className={fieldClass()} />
          </div>
          <SaveButton />
        </form>
      ) : null}

      {districts.length === 0 && !editing ? (
        <p className="text-sm text-[var(--gold-deep)]">未填</p>
      ) : districts.length > 0 ? (
        <div className={`grid gap-3 ${editing ? "mt-4" : ""}`}>
          {districts.map((item) => (
            <article key={item.id} className="border-2 border-[var(--ink)] bg-[var(--panel)] px-4 py-3">
              <p className="text-sm font-semibold">{item.district}</p>
              <p className="mt-1 text-sm text-[var(--gold-deep)]">{item.project}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

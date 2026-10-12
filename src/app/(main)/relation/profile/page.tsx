import Link from "next/link";

import { upsertRelationProfile } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { backClass, fieldClass, labelClass, pageWrap, submitClass } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";

const fields = [
  ["friends", "友", "同学、同事"],
  ["romance", "爱", "只写称呼，不写对方原话"],
  ["family", "亲", "父母、兄弟姐妹"],
  ["other", "其他", ""],
] as const;

export default async function RelationProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await getAppUser();
  const [{ edit }, profile] = await Promise.all([
    searchParams,
    prisma.relationProfile.findUnique({ where: { userId: user.id } }),
  ]);
  const editing = edit === "1";

  return (
    <div className={pageWrap}>
      <section className="pixel-box p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">人</h2>
          {editing ? (
            <Link href="/relation/profile" className={backClass}>
              返回
            </Link>
          ) : (
            <Link href="/relation/profile?edit=1" className={submitClass()}>
              修改
            </Link>
          )}
        </div>
        {editing ? (
          <form action={upsertRelationProfile} className="grid gap-4">
            {fields.map(([name, label, placeholder]) => (
              <div key={name}>
                <label className={labelClass()} htmlFor={name}>
                  {label}
                </label>
                <textarea
                  id={name}
                  name={name}
                  rows={2}
                  placeholder={placeholder}
                  className={fieldClass()}
                  defaultValue={profile?.[name] ?? ""}
                />
              </div>
            ))}
            <SaveButton />
          </form>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map(([name, label]) => (
              <article key={name} className="border-2 border-[var(--ink)] bg-[var(--panel)] px-4 py-3">
                <p className="text-xs text-[var(--muted)]">{label}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--gold-deep)]">{profile?.[name] || "未填"}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

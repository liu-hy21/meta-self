import Link from "next/link";

import { upsertMindProfile } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { backClass, fieldClass, labelClass, pageWrap, submitClass } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";

export default async function MindProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await getAppUser();
  const [{ edit }, profile] = await Promise.all([
    searchParams,
    prisma.mindProfile.findUnique({ where: { userId: user.id } }),
  ]);

  return (
    <div className={pageWrap}>
      <Block title="情绪" editing={edit === "emotion"} editHref="/mind/profile?edit=emotion">
        {edit === "emotion" ? (
          <form action={upsertMindProfile} className="grid gap-4">
            <Hidden name="psycheNote" value={profile?.psycheNote} />
            <Hidden name="stressNote" value={profile?.stressNote} />
            <div>
              <label className={labelClass()} htmlFor="emotionWords">
                常见情绪
              </label>
              <textarea
                id="emotionWords"
                name="emotionWords"
                rows={2}
                placeholder="平静、紧、烦"
                className={fieldClass()}
                defaultValue={profile?.emotionWords ?? ""}
              />
            </div>
            <div className="max-w-xs">
              <label className={labelClass()} htmlFor="emotionLevel">
                通常强度 1–5
              </label>
              <input
                id="emotionLevel"
                name="emotionLevel"
                type="number"
                min={1}
                max={5}
                className={fieldClass()}
                defaultValue={profile?.emotionLevel ?? ""}
              />
            </div>
            <SaveButton />
          </form>
        ) : (
          <Cards
            items={[
              ["常见情绪", profile?.emotionWords || "未填"],
              ["通常强度", profile?.emotionLevel != null ? `${profile.emotionLevel}` : "未填"],
            ]}
          />
        )}
      </Block>

      <Block title="心理" editing={edit === "psyche"} editHref="/mind/profile?edit=psyche">
        {edit === "psyche" ? (
          <form action={upsertMindProfile} className="grid gap-4">
            <Hidden name="emotionWords" value={profile?.emotionWords} />
            <Hidden name="emotionLevel" value={profile?.emotionLevel} />
            <div>
              <label className={labelClass()} htmlFor="psycheNote">
                当前状态
              </label>
              <textarea id="psycheNote" name="psycheNote" rows={3} className={fieldClass()} defaultValue={profile?.psycheNote ?? ""} />
            </div>
            <div>
              <label className={labelClass()} htmlFor="stressNote">
                主要压力
              </label>
              <textarea id="stressNote" name="stressNote" rows={3} className={fieldClass()} defaultValue={profile?.stressNote ?? ""} />
            </div>
            <SaveButton />
          </form>
        ) : (
          <Cards
            items={[
              ["当前状态", profile?.psycheNote || "未填"],
              ["主要压力", profile?.stressNote || "未填"],
            ]}
          />
        )}
      </Block>
    </div>
  );
}

function Hidden({ name, value }: { name: string; value?: string | number | null }) {
  return <input type="hidden" name={name} value={value ?? ""} />;
}

function Block({
  title,
  editing,
  editHref,
  children,
}: {
  title: string;
  editing: boolean;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pixel-box p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {editing ? (
          <Link href="/mind/profile" className={backClass}>
            返回
          </Link>
        ) : (
          <Link href={editHref} className={submitClass()}>
            修改
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Cards({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <article key={label} className="border-2 border-[var(--ink)] bg-[var(--panel)] px-4 py-3">
          <p className="text-xs text-[var(--muted)]">{label}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--gold-deep)]">{value}</p>
        </article>
      ))}
    </div>
  );
}

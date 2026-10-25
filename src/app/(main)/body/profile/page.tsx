import { Suspense } from "react";

import { upsertBodyDiet, upsertBodyProfile } from "@/app/actions/data";
import { BodyConsole } from "@/components/body/body-console";
import { ProfileActionForm } from "@/components/body/profile-action-form";
import { ProfileScrollRestore } from "@/components/body/profile-scroll-restore";
import { SaveButton } from "@/components/body/save-button";
import { pageWrap } from "@/components/ui/form-shell";
import { PreserveScrollLink } from "@/components/ui/preserve-scroll-link";
import { resolveSnapshotModalOpen } from "@/lib/body-snapshot-modal";
import { calendarDateInTimezone } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";

const solid = "vital-btn vital-btn--solid";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{
    edit?: string;
    medicalWrite?: string;
    sleepWrite?: string;
    measureWrite?: string;
    examWrite?: string;
  }>;
}) {
  const user = await getAppUser();
  const [{ edit, ...writeFlags }, profile, diet, medicalLogs, sleepLogs, measures, exams] = await Promise.all([
    searchParams,
    prisma.bodyProfile.findUnique({ where: { userId: user.id } }),
    prisma.bodyDiet.findUnique({ where: { userId: user.id } }),
    prisma.medicalVisitLog.findMany({
      where: { userId: user.id },
      orderBy: [{ visitedOn: "desc" }, { createdAt: "desc" }],
      take: 30,
    }),
    prisma.sleepLog.findMany({
      where: { userId: user.id },
      orderBy: [{ logDate: "desc" }, { createdAt: "desc" }],
      take: 30,
    }),
    prisma.bodyMeasureLog.findMany({
      where: { userId: user.id },
      orderBy: [{ logDate: "desc" }, { createdAt: "desc" }],
      take: 30,
    }),
    prisma.bodyExamLog.findMany({
      where: { userId: user.id },
      orderBy: [{ logDate: "desc" }, { createdAt: "desc" }],
      take: 30,
      include: { images: { orderBy: { createdAt: "asc" } } },
    }),
  ]);

  const birthValue = profile?.birthDate ? profile.birthDate.toISOString().slice(0, 10) : "";
  const age = profile?.birthDate ? ageFrom(profile.birthDate) : null;
  const initialModal = resolveSnapshotModalOpen(writeFlags);
  const defaultExamLogDate = calendarDateInTimezone(new Date()).toISOString().slice(0, 10);

  const identity = (
    <section className="vital-panel h-full">
      <PanelHead index="01" kicker="Identity" title="基本信息" editing={edit === "basic"} editHref="/body/profile?edit=basic" />
      {edit === "basic" ? (
        <ProfileActionForm action={upsertBodyProfile} className="grid grid-cols-2 gap-4">
          <label>
            身高 (cm)
            <input name="heightCm" type="number" step="0.1" min={0} defaultValue={profile?.heightCm ?? ""} />
          </label>
          <label>
            生日
            <input name="birthDate" type="date" defaultValue={birthValue} />
          </label>
          <label>
            性别
            <input name="gender" defaultValue={profile?.gender ?? ""} />
          </label>
          <label>
            血型
            <input name="bloodType" defaultValue={profile?.bloodType ?? ""} />
          </label>
          <div className="col-span-2 flex justify-end">
            <SaveButton className={solid} />
          </div>
        </ProfileActionForm>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="vital-num text-5xl">{profile?.heightCm ?? "—"}</span>
            <span className="vital-dim vital-mono text-sm">cm</span>
          </div>
          <p className="vital-faint mt-1 text-xs">身高</p>
          <hr className="vital-rule my-5" />
          <dl className="grid grid-cols-3 gap-3">
            <Spec label="年龄" value={age != null ? `${age}` : "—"} />
            <Spec label="性别" value={profile?.gender || "—"} />
            <Spec label="血型" value={profile?.bloodType || "—"} />
          </dl>
          <p className="vital-faint vital-mono mt-5 text-xs">DOB {birthValue ? birthValue.replaceAll("-", ".") : "未填"}</p>
        </>
      )}
    </section>
  );

  const dietItems: [string, string, string | null | undefined][] = [
    ["proteinFoods", "蛋白质", diet?.proteinFoods],
    ["fatFoods", "脂肪", diet?.fatFoods],
    ["carbFoods", "碳水", diet?.carbFoods],
    ["vitaminFoods", "维生素", diet?.vitaminFoods],
  ];

  const dietPanel = (
    <section className="vital-panel">
      <PanelHead index="07" kicker="Intake" title="饮食习惯" editing={edit === "diet"} editHref="/body/profile?edit=diet" />
      {edit === "diet" ? (
        <ProfileActionForm action={upsertBodyDiet} className="grid gap-4 sm:grid-cols-2">
          {dietItems.map(([name, label, value]) => (
            <label key={name}>
              {label}，平时常吃
              <textarea name={name} rows={2} defaultValue={value ?? ""} />
            </label>
          ))}
          <div className="flex justify-end sm:col-span-2">
            <SaveButton className={solid} />
          </div>
        </ProfileActionForm>
      ) : (
        <div className="grid gap-px overflow-hidden rounded border border-[var(--v-line)] bg-[var(--v-line)] sm:grid-cols-2 xl:grid-cols-4">
          {dietItems.map(([name, label, value]) => (
            <div key={name} className="bg-[var(--v-panel)] p-4">
              <p className="vital-kicker">{label}</p>
              <p className={`mt-2 whitespace-pre-wrap text-sm ${value ? "" : "vital-faint"}`}>{value || "未填"}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className={`${pageWrap} vital`}>
      <Suspense fallback={null}>
        <ProfileScrollRestore />
      </Suspense>
      <BodyConsole
        identity={identity}
        diet={dietPanel}
        heightCm={profile?.heightCm ?? null}
        measures={measures}
        exams={exams}
        sleepLogs={sleepLogs}
        medicalLogs={medicalLogs}
        initialModal={initialModal}
        defaultExamLogDate={defaultExamLogDate}
      />
    </div>
  );
}

function PanelHead({
  index,
  kicker,
  title,
  editing,
  editHref,
}: {
  index: string;
  kicker: string;
  title: string;
  editing: boolean;
  editHref: string;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <p className="vital-kicker">
          {index} · {kicker}
        </p>
        <h2 className="vital-title mt-1">{title}</h2>
      </div>
      <PreserveScrollLink href={editing ? "/body/profile" : editHref} className="vital-btn">
        {editing ? "返回" : "修改"}
      </PreserveScrollLink>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="vital-faint text-xs">{label}</dt>
      <dd className="vital-mono mt-1 text-lg">{value}</dd>
    </div>
  );
}

function ageFrom(birth: Date) {
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

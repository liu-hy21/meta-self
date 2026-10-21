import Link from "next/link";

import { upsertBodyDiet, upsertBodyExam, upsertBodyProfile, upsertBodySleepHabit } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { BodyLogRail } from "@/components/logs/body-log-rail";
import { RailPortal } from "@/components/shell/rail-portal";
import { backClass, fieldClass, labelClass, pageWrap, submitClass } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";

const examGroups = [
  {
    title: "器官",
    fields: [
      ["heart", "心"],
      ["lung", "肺"],
      ["liver", "肝"],
      ["gallbladder", "胆"],
      ["spleen", "脾"],
      ["kidney", "肾"],
      ["thyroid", "甲状腺"],
    ],
  },
  {
    title: "血常规",
    fields: [
      ["wbc", "白细胞"],
      ["rbc", "红细胞"],
      ["hemoglobin", "血红蛋白"],
      ["platelets", "血小板"],
    ],
  },
  {
    title: "尿常规",
    fields: [
      ["urineProtein", "尿蛋白"],
      ["urineGlucose", "尿糖"],
      ["urineBlood", "潜血"],
    ],
  },
  {
    title: "生化",
    fields: [
      ["glucose", "血糖"],
      ["uricAcid", "尿酸"],
      ["cholesterol", "总胆固醇"],
      ["triglycerides", "甘油三酯"],
      ["ldl", "低密度脂蛋白"],
      ["alt", "谷丙转氨酶"],
      ["creatinine", "肌酐"],
    ],
  },
  {
    title: "循环",
    fields: [
      ["systolic", "收缩压"],
      ["diastolic", "舒张压"],
      ["restingHeartRate", "静息心率"],
    ],
  },
] as const;

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; write?: string; medicalWrite?: string }>;
}) {
  const user = await getAppUser();
  const [{ edit, write, medicalWrite }, profile, diet, sleepHabit, exam, logs, medicalLogs] = await Promise.all([
    searchParams,
    prisma.bodyProfile.findUnique({ where: { userId: user.id } }),
    prisma.bodyDiet.findUnique({ where: { userId: user.id } }),
    prisma.bodySleepHabit.findUnique({ where: { userId: user.id } }),
    prisma.bodyExam.findUnique({ where: { userId: user.id } }),
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

  const birthValue = profile?.birthDate ? profile.birthDate.toISOString().slice(0, 10) : "";
  const examDate = exam?.examDate ? exam.examDate.toISOString().slice(0, 10) : "";

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });

  return (
    <div className={pageWrap}>
      <RailPortal>
        <BodyLogRail
          logs={logs}
          medicalLogs={medicalLogs}
          writing={write === "1" || logs.length === 0}
          medicalWriting={medicalWrite === "1" || medicalLogs.length === 0}
          today={today}
        />
      </RailPortal>
      <Block title="基本信息" editing={edit === "basic"} editHref="/body/profile?edit=basic">
        {edit === "basic" ? (
          <form action={upsertBodyProfile} className="grid gap-4 sm:grid-cols-2">
            <NumberField id="heightCm" label="身高 (cm)" defaultValue={profile?.heightCm} />
            <NumberField id="weightKg" label="体重 (kg)" defaultValue={profile?.weightKg} />
            <NumberField id="chestCm" label="胸围 (cm)" defaultValue={profile?.chestCm} />
            <NumberField id="waistCm" label="腰围 (cm)" defaultValue={profile?.waistCm} />
            <NumberField id="thighCm" label="腿围 (cm)" defaultValue={profile?.thighCm} />
            <Field label="生日">
              <input id="birthDate" name="birthDate" type="date" className={fieldClass()} defaultValue={birthValue} />
            </Field>
            <TextField id="gender" label="性别" defaultValue={profile?.gender} />
            <TextField id="bloodType" label="血型" defaultValue={profile?.bloodType} />
            <SaveButton />
          </form>
        ) : (
          <Cards
            items={[
              ["身高", profile?.heightCm != null ? `${profile.heightCm} cm` : "未填"],
              ["体重", profile?.weightKg != null ? `${profile.weightKg} kg` : "未填"],
              ["胸围", profile?.chestCm != null ? `${profile.chestCm} cm` : "未填"],
              ["腰围", profile?.waistCm != null ? `${profile.waistCm} cm` : "未填"],
              ["腿围", profile?.thighCm != null ? `${profile.thighCm} cm` : "未填"],
              ["生日", birthValue || "未填"],
              ["性别", profile?.gender || "未填"],
              ["血型", profile?.bloodType || "未填"],
            ]}
          />
        )}
      </Block>

      <Block title="饮食情况" editing={edit === "diet"} editHref="/body/profile?edit=diet">
        {edit === "diet" ? (
          <form action={upsertBodyDiet} className="grid gap-4">
            <TextArea id="proteinFoods" label="蛋白质，平时常吃" defaultValue={diet?.proteinFoods} placeholder="鸡蛋、鸡胸、牛奶" />
            <TextArea id="fatFoods" label="脂肪，平时常吃" defaultValue={diet?.fatFoods} placeholder="坚果、橄榄油" />
            <TextArea id="carbFoods" label="碳水，平时常吃" defaultValue={diet?.carbFoods} placeholder="米饭、燕麦" />
            <TextArea id="vitaminFoods" label="维生素，平时常吃" defaultValue={diet?.vitaminFoods} placeholder="橙子、菠菜、鱼" />
            <SaveButton />
          </form>
        ) : (
          <Cards
            items={[
              ["蛋白质", diet?.proteinFoods || "未填"],
              ["脂肪", diet?.fatFoods || "未填"],
              ["碳水", diet?.carbFoods || "未填"],
              ["维生素", diet?.vitaminFoods || "未填"],
            ]}
          />
        )}
      </Block>

      <Block title="睡眠情况" editing={edit === "sleep"} editHref="/body/profile?edit=sleep">
        {edit === "sleep" ? (
          <form action={upsertBodySleepHabit} className="grid gap-4 sm:grid-cols-2">
            <NumberField id="durationHours" label="通常时长 (小时)" defaultValue={sleepHabit?.durationHours} />
            <Field label="自感">
              <select id="quality" name="quality" className={fieldClass()} defaultValue={sleepHabit?.quality ?? ""}>
                <option value="">未填</option>
                <option value="好">好</option>
                <option value="一般">一般</option>
                <option value="差">差</option>
              </select>
            </Field>
            <Field label="通常入睡">
              <input id="bedtime" name="bedtime" type="time" className={fieldClass()} defaultValue={sleepHabit?.bedtime ?? ""} />
            </Field>
            <Field label="通常醒来">
              <input id="wakeTime" name="wakeTime" type="time" className={fieldClass()} defaultValue={sleepHabit?.wakeTime ?? ""} />
            </Field>
            <SaveButton />
          </form>
        ) : (
          <Cards
            items={[
              ["通常时长", sleepHabit?.durationHours != null ? `${sleepHabit.durationHours} 小时` : "未填"],
              ["通常入睡", sleepHabit?.bedtime || "未填"],
              ["通常醒来", sleepHabit?.wakeTime || "未填"],
              ["自感", sleepHabit?.quality || "未填"],
            ]}
          />
        )}
      </Block>

      <Block title="体检情况" editing={edit === "exam"} editHref="/body/profile?edit=exam">
        {edit === "exam" ? (
          <form action={upsertBodyExam} className="space-y-5">
            <Field label="检查日期">
              <input id="examDate" name="examDate" type="date" className={fieldClass()} defaultValue={examDate} />
            </Field>
            {examGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {group.fields.map(([name, label]) => (
                    <TextField key={name} id={name} label={label} defaultValue={exam?.[name]} />
                  ))}
                </div>
              </div>
            ))}
            <SaveButton />
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm">检查日期：{examDate || "未填"}</p>
            {examGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs text-[var(--muted)]">{group.title}</h3>
                <div className="mt-2">
                  <Cards items={group.fields.map(([name, label]) => [label, exam?.[name] || "未填"])} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Block>
    </div>
  );
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
          <Link href="/body/profile" className={backClass}>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className={labelClass()}>{label}</span>
      {children}
    </div>
  );
}

function NumberField({ id, label, defaultValue }: { id: string; label: string; defaultValue?: number | null }) {
  return (
    <div>
      <label className={labelClass()} htmlFor={id}>
        {label}
      </label>
      <input id={id} name={id} type="number" step="0.1" min={0} className={fieldClass()} defaultValue={defaultValue ?? ""} />
    </div>
  );
}

function TextField({ id, label, defaultValue }: { id: string; label: string; defaultValue?: string | null }) {
  return (
    <div>
      <label className={labelClass()} htmlFor={id}>
        {label}
      </label>
      <input id={id} name={id} className={fieldClass()} defaultValue={defaultValue ?? ""} />
    </div>
  );
}

function TextArea({
  id,
  label,
  defaultValue,
  placeholder,
}: {
  id: string;
  label: string;
  defaultValue?: string | null;
  placeholder: string;
}) {
  return (
    <div>
      <label className={labelClass()} htmlFor={id}>
        {label}
      </label>
      <textarea id={id} name={id} rows={2} placeholder={placeholder} className={fieldClass()} defaultValue={defaultValue ?? ""} />
    </div>
  );
}

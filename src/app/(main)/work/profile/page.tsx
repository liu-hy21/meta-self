import Link from "next/link";

import { upsertWorkProfile } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { WorkLogRail } from "@/components/logs/work-log-rail";
import { RailPortal } from "@/components/shell/rail-portal";
import { WorkCredentialsPanel } from "@/components/work/work-credentials-panel";
import { backClass, fieldClass, labelClass, pageWrap, submitClass } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";

type WorkTab = "profile" | "credentials";

export default async function WorkProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; tab?: string; error?: string; write?: string }>;
}) {
  const user = await getAppUser();
  const [{ edit, tab: tabRaw, error, write }, profile, credentials, logs] = await Promise.all([
    searchParams,
    prisma.workProfile.findUnique({ where: { userId: user.id } }),
    prisma.workCredential.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workInfoLog.findMany({
      where: { userId: user.id },
      orderBy: [{ writtenOn: "desc" }, { createdAt: "desc" }],
      take: 30,
    }),
  ]);

  const tab: WorkTab = tabRaw === "credentials" ? "credentials" : "profile";

  return (
    <div className={pageWrap}>
      <RailPortal>
        <WorkLogRail logs={logs} writing={write === "1" || logs.length === 0} />
      </RailPortal>
      <div className="flex gap-2">
        <WorkTabLink href="/work/profile?tab=profile" label="档案" active={tab === "profile"} />
        <WorkTabLink href="/work/profile?tab=credentials" label="证件" active={tab === "credentials"} />
      </div>

      {tab === "credentials" ? (
        <WorkCredentialsPanel credentials={credentials} editing={edit === "1"} error={error} />
      ) : (
        <WorkProfileTab profile={profile} edit={edit} />
      )}
    </div>
  );
}

function WorkTabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-8 items-center justify-center border-2 border-[var(--ink)] px-4 text-sm leading-none ${
        active ? "bg-[var(--gold)]" : "bg-[var(--panel)]"
      }`}
    >
      {label}
    </Link>
  );
}

function WorkProfileTab({
  profile,
  edit,
}: {
  profile: Awaited<ReturnType<typeof prisma.workProfile.findUnique>>;
  edit?: string;
}) {
  const base = "/work/profile?tab=profile";

  return (
    <>
      <Block title="公司" editing={edit === "company"} editHref={`${base}&edit=company`}>
        {edit === "company" ? (
          <form action={upsertWorkProfile} className="grid gap-4 sm:grid-cols-2">
            <Hidden name="proficient" value={profile?.proficient} />
            <Hidden name="learning" value={profile?.learning} />
            <Hidden name="retired" value={profile?.retired} />
            <Hidden name="studyHistory" value={profile?.studyHistory} />
            <TextField id="companyName" label="公司" defaultValue={profile?.companyName} />
            <TextField id="department" label="部门" defaultValue={profile?.department} />
            <TextField id="role" label="角色" defaultValue={profile?.role} />
            <TextField id="joinedOn" label="入职时间" defaultValue={profile?.joinedOn} />
            <SaveButton />
          </form>
        ) : (
          <Cards
            items={[
              ["公司", profile?.companyName || "未填"],
              ["部门", profile?.department || "未填"],
              ["角色", profile?.role || "未填"],
              ["入职时间", profile?.joinedOn || "未填"],
            ]}
          />
        )}
      </Block>

      <Block title="技术" editing={edit === "stack"} editHref={`${base}&edit=stack`}>
        {edit === "stack" ? (
          <form action={upsertWorkProfile} className="grid gap-4">
            <Hidden name="companyName" value={profile?.companyName} />
            <Hidden name="department" value={profile?.department} />
            <Hidden name="role" value={profile?.role} />
            <Hidden name="joinedOn" value={profile?.joinedOn} />
            <Hidden name="studyHistory" value={profile?.studyHistory} />
            <Area id="proficient" label="会" defaultValue={profile?.proficient} placeholder="TypeScript、React" />
            <Area id="learning" label="在学" defaultValue={profile?.learning} placeholder="Rust" />
            <Area id="retired" label="不用了" defaultValue={profile?.retired} placeholder="jQuery" />
            <SaveButton />
          </form>
        ) : (
          <Cards
            items={[
              ["会", profile?.proficient || "未填"],
              ["在学", profile?.learning || "未填"],
              ["不用了", profile?.retired || "未填"],
            ]}
          />
        )}
      </Block>

      <Block title="学习经历" editing={edit === "study"} editHref={`${base}&edit=study`}>
        {edit === "study" ? (
          <form action={upsertWorkProfile} className="grid gap-4">
            <Hidden name="companyName" value={profile?.companyName} />
            <Hidden name="department" value={profile?.department} />
            <Hidden name="role" value={profile?.role} />
            <Hidden name="joinedOn" value={profile?.joinedOn} />
            <Hidden name="proficient" value={profile?.proficient} />
            <Hidden name="learning" value={profile?.learning} />
            <Hidden name="retired" value={profile?.retired} />
            <Area id="studyHistory" label="过往" defaultValue={profile?.studyHistory} placeholder="2017–2021 某大学 计算机" />
            <SaveButton />
          </form>
        ) : (
          <Cards wide items={[["过往", profile?.studyHistory || "未填"]]} />
        )}
      </Block>
    </>
  );
}

function Hidden({ name, value }: { name: string; value?: string | null }) {
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
          <Link href="/work/profile?tab=profile" className={backClass}>
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

function Cards({ items, wide }: { items: [string, string][]; wide?: boolean }) {
  return (
    <div className={wide ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"}>
      {items.map(([label, value]) => (
        <article key={label} className="border-2 border-[var(--ink)] bg-[var(--panel)] px-4 py-3">
          <p className="text-xs text-[var(--muted)]">{label}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--gold-deep)]">{value}</p>
        </article>
      ))}
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

function Area({
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

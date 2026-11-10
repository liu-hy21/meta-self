import Link from "next/link";
import { notFound } from "next/navigation";

import { updateRelationPersonProfileAction } from "@/app/actions/data";
import { RelationWorkbenchNav } from "@/components/relation/relation-workbench-nav";
import { getRelationPerson } from "@/lib/relation/people";
import { getAppUser } from "@/lib/user";

function display(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "未填写" : String(value);
}

function dateValue(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function dateDisplay(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "未填写";
}

function ReadField({ label, value }: { label: string; value: string | number | null | undefined }) {
  return <div className="relation-attribute-field"><dt>{label}</dt><dd>{display(value)}</dd></div>;
}

function TextField({ label, name, defaultValue, type = "text", step }: { label: string; name: string; defaultValue: string | number; type?: string; step?: string }) {
  return (
    <label className="relation-edit-field">
      <span>{label}</span>
      <input name={name} type={type} step={step} defaultValue={defaultValue} />
    </label>
  );
}

function TextAreaField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <label className="relation-edit-field relation-edit-field--wide">
      <span>{label}</span>
      <textarea name={name} rows={3} defaultValue={defaultValue} />
    </label>
  );
}

export default async function RelationPersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ personId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await getAppUser();
  const { personId } = await params;
  const { edit } = await searchParams;
  const person = await getRelationPerson(user.id, personId);
  if (!person) notFound();
  const editing = edit === "1";
  const pageHref = `/relation/people/${person.id}`;

  return (
    <div className="relation-workbench">
      <RelationWorkbenchNav personId={person.id} personName={person.name} />

      <section className="relation-shell relation-attributes-shell">
        <div className="relation-attribute-actions">
          <Link href={editing ? pageHref : `${pageHref}?edit=1`} className="relation-action">{editing ? "取消" : "编辑属性"}</Link>
        </div>

        {editing ? (
          <form action={updateRelationPersonProfileAction} className="relation-attribute-form">
            <input type="hidden" name="personId" value={person.id} />
            <div className="relation-attribute-categories">
              <section className="relation-attribute-category">
                <h3>基础资料</h3>
                <div className="relation-edit-grid">
                  <TextField label="名字" name="name" defaultValue={person.name} />
                  <TextField label="生日" name="birthDate" type="date" defaultValue={dateValue(person.birthDate)} />
                  <TextField label="星座" name="zodiac" defaultValue={person.zodiac ?? ""} />
                  <TextField label="MBTI" name="mbti" defaultValue={person.mbti ?? ""} />
                </div>
              </section>
              <section className="relation-attribute-category">
                <h3>生活背景</h3>
                <div className="relation-edit-grid">
                  <TextField label="身高（cm）" name="heightCm" type="number" step="0.1" defaultValue={person.heightCm ?? ""} />
                  <TextField label="体重（kg）" name="weightKg" type="number" step="0.1" defaultValue={person.weightKg ?? ""} />
                  <TextAreaField label="家乡" name="hometown" defaultValue={person.hometown ?? ""} />
                  <TextAreaField label="家庭情况" name="familySituation" defaultValue={person.familySituation ?? ""} />
                </div>
              </section>
              <section className="relation-attribute-category">
                <h3>教育与职业</h3>
                <div className="relation-edit-grid">
                  <TextField label="本科" name="undergraduate" defaultValue={person.undergraduate ?? ""} />
                  <TextField label="研究生" name="graduate" defaultValue={person.graduate ?? ""} />
                  <TextField label="专业" name="major" defaultValue={person.major ?? ""} />
                  <TextField label="公司" name="company" defaultValue={person.company ?? ""} />
                  <TextField label="公司职位" name="jobTitle" defaultValue={person.jobTitle ?? ""} />
                </div>
              </section>
            </div>
            <div className="relation-form-actions"><button type="submit" className="relation-action relation-action--dark">保存属性</button></div>
          </form>
        ) : (
          <div className="relation-attribute-categories">
            <section className="relation-attribute-category">
              <h3>基础资料</h3>
              <dl>
                <ReadField label="名字" value={person.name} />
                <ReadField label="生日" value={dateDisplay(person.birthDate)} />
                <ReadField label="星座" value={person.zodiac} />
                <ReadField label="MBTI" value={person.mbti} />
              </dl>
            </section>
            <section className="relation-attribute-category">
              <h3>生活背景</h3>
              <dl>
                <ReadField label="身高" value={person.heightCm == null ? null : `${person.heightCm} cm`} />
                <ReadField label="体重" value={person.weightKg == null ? null : `${person.weightKg} kg`} />
                <ReadField label="家乡" value={person.hometown} />
                <ReadField label="家庭情况" value={person.familySituation} />
              </dl>
            </section>
            <section className="relation-attribute-category">
              <h3>教育与职业</h3>
              <dl>
                <ReadField label="本科" value={person.undergraduate} />
                <ReadField label="研究生" value={person.graduate} />
                <ReadField label="专业" value={person.major} />
                <ReadField label="公司" value={person.company} />
                <ReadField label="公司职位" value={person.jobTitle} />
              </dl>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

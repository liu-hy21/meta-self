import { PeopleList } from "@/components/relation/people-list";
import { ensureBcPerson, listRelationPeople } from "@/lib/relation/people";
import { getAppUser } from "@/lib/user";

export default async function RelationProfilePage() {
  const user = await getAppUser();
  const bc = await ensureBcPerson(user.id);
  const people = await listRelationPeople(user.id);

  return (
    <div className="relation-workbench">
      <section className="relation-shell relation-shell--people">
        <PeopleList people={people} activeId={bc.id} />
      </section>
    </div>
  );
}

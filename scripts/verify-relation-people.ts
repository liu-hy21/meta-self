import assert from "node:assert/strict";

import { ensureBcPerson, listRelationPeople } from "../src/lib/relation/people";
import { getAppUser } from "../src/lib/user";
import { prisma } from "../src/lib/db";

async function main() {
  const user = await getAppUser();
  const first = await ensureBcPerson(user.id);
  const second = await ensureBcPerson(user.id);
  const people = await listRelationPeople(user.id);

  assert.equal(first.id, second.id);
  assert.equal(first.name, "bc");
  assert.equal(first.archive?.sourceKey, "wxid_en8z2t73paw522");
  assert.equal(people.filter((person) => person.archive?.sourceKey === "wxid_en8z2t73paw522").length, 1);

  console.log(`PASS bc=${first.id} people=${people.length}`);
  await prisma.$disconnect();
}

main();

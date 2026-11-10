import assert from "node:assert/strict";

import { analyzeRelationPerson } from "@/lib/relation/analysis";
import { ensureBcPerson } from "@/lib/relation/people";
import { getAppUser } from "@/lib/user";

async function main() {
  const user = await getAppUser();
  const person = await ensureBcPerson(user.id);
  assert.ok(person.archive);
  const analyzed = await analyzeRelationPerson(user.id, person.id);
  assert.equal(analyzed.analysisStatus, "ANALYZED");
  assert.ok(analyzed.metrics.totalMessages > 0);
  assert.ok(analyzed.analyzedAt);
  console.log(`PASS analysis=${analyzed.analysisStatus} messages=${analyzed.metrics.totalMessages}`);
}

main();

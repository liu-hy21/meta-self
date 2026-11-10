import assert from "node:assert/strict";

import { prisma } from "../src/lib/db";
import { listRelationMetricLedger } from "../src/lib/relation/metric-ledger";
import type { RelationMetrics } from "../src/lib/relation/types";

async function main() {
  const user = await prisma.user.findFirstOrThrow();
  const person = await prisma.relationPerson.findFirstOrThrow({ where: { userId: user.id, name: "bc" }, include: { archives: true } });
  const metrics = person.archives[0]?.metricsJson as RelationMetrics | null;
  const entries = await listRelationMetricLedger(user.id, person.id, metrics);

  assert.ok(entries.length >= 9);
  assert.ok(entries.some((entry) => entry.name === "每日动画表情平均数量"));
  assert.ok(entries.every((entry) => entry.name && entry.calculation));
  const first = entries[0];
  await prisma.relationMetricLedger.update({ where: { id: first.id }, data: { name: first.name, calculation: first.calculation } });

  console.log(`PASS ledger=${entries.length} person=${person.id}`);
  await prisma.$disconnect();
}

main();

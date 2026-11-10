import { Prisma, type RelationKind } from "@prisma/client";

import { prisma } from "@/lib/db";
import { BC_DISPLAY_NAME, BC_SOURCE_KEY, BC_SOURCE_TYPE, resolveRelationArchivePath } from "@/lib/relation/archive-config";
import { getChatArchiveMeta } from "@/lib/relation/chat-archive";
import type { RelationMetrics } from "@/lib/relation/types";

const BC_START = new Date("2026-07-01T00:00:00+08:00");
const BC_END = new Date("2026-10-31T23:59:59.999+08:00");

export type RelationPersonWithArchive = {
  id: string;
  name: string;
  birthDate: Date | null;
  zodiac: string | null;
  mbti: string | null;
  heightCm: number | null;
  weightKg: number | null;
  hometown: string | null;
  familySituation: string | null;
  undergraduate: string | null;
  graduate: string | null;
  major: string | null;
  company: string | null;
  jobTitle: string | null;
  note: string | null;
  kinds: RelationKind[];
  archive: {
    id: string;
    sourceType: string;
    sourceKey: string;
    available: boolean;
    error: string | null;
    periodStart: string;
    periodEnd: string;
    messageCount: number;
    importedAt: Date;
    analysisStatus: "PENDING" | "ANALYZED";
    analyzedAt: Date | null;
    metrics: RelationMetrics | null;
  } | null;
  latestInteraction: { occurredAt: Date; note: string; feelingScore: number } | null;
  recentInteractions: { id: string; occurredAt: Date; note: string; feelingScore: number }[];
};

function personView(person: {
  id: string;
  name: string;
  birthDate: Date | null;
  zodiac: string | null;
  mbti: string | null;
  heightCm: number | null;
  weightKg: number | null;
  hometown: string | null;
  familySituation: string | null;
  undergraduate: string | null;
  graduate: string | null;
  major: string | null;
  company: string | null;
  jobTitle: string | null;
  note: string | null;
  kinds: { kind: RelationKind }[];
  archives: {
    id: string;
    sourceType: string;
    sourceKey: string;
    periodStart: Date;
    periodEnd: Date;
    messageCount: number;
    importedAt: Date;
    analysisStatus: string;
    analyzedAt: Date | null;
    metricsJson: unknown | null;
  }[];
  interactions: { id: string; occurredAt: Date; note: string; feelingScore: number }[];
}): RelationPersonWithArchive {
  const archive = person.archives[0] ?? null;
  const metrics = archive && archive.metricsJson && typeof archive.metricsJson === "object" && (archive.metricsJson as { version?: unknown }).version === "2026-11-v2"
    ? archive.metricsJson as RelationMetrics
    : null;
  return {
    id: person.id,
    name: person.name,
    birthDate: person.birthDate,
    zodiac: person.zodiac,
    mbti: person.mbti,
    heightCm: person.heightCm,
    weightKg: person.weightKg,
    hometown: person.hometown,
    familySituation: person.familySituation,
    undergraduate: person.undergraduate,
    graduate: person.graduate,
    major: person.major,
    company: person.company,
    jobTitle: person.jobTitle,
    note: person.note,
    kinds: person.kinds.map((kind) => kind.kind),
    archive: archive
      ? {
          ...archive,
          available: true,
          error: null,
          periodStart: archive.periodStart.toISOString().slice(0, 10),
          periodEnd: archive.periodEnd.toISOString().slice(0, 10),
          analysisStatus: archive.analysisStatus === "ANALYZED" && metrics ? "ANALYZED" : "PENDING",
          analyzedAt: archive.analyzedAt,
          metrics,
        }
      : null,
    latestInteraction: person.interactions[0] ?? null,
    recentInteractions: person.interactions,
  };
}

async function withArchiveStatus(view: RelationPersonWithArchive) {
  if (!view.archive) return view;
  const meta = await getChatArchiveMeta(view.archive.sourceKey);
  return {
    ...view,
    archive: { ...view.archive, available: meta.available, error: meta.error, messageCount: meta.messageCount },
  };
}

export async function ensureBcPerson(userId: string) {
  const meta = await getChatArchiveMeta(BC_SOURCE_KEY);
  const existingArchive = await prisma.relationChatArchive.findUnique({
    where: { userId_sourceType_sourceKey: { userId, sourceType: BC_SOURCE_TYPE, sourceKey: BC_SOURCE_KEY } },
    include: { person: { include: { kinds: true, archives: true, interactions: { orderBy: { occurredAt: "desc" }, take: 1 } } } },
  });
  const existingPerson = existingArchive?.person ?? (await prisma.relationPerson.findFirst({
    where: { userId, name: BC_DISPLAY_NAME },
    include: { kinds: true, archives: true, interactions: { orderBy: { occurredAt: "desc" }, take: 1 } },
  }));

  const person = existingPerson
    ? existingPerson
    : await prisma.relationPerson.create({
        data: {
          userId,
          name: BC_DISPLAY_NAME,
          note: "微信聊天记录 · 2026 年 7 月至 10 月",
          kinds: { create: [{ kind: "FRIEND" }] },
        },
        include: { kinds: true, archives: true, interactions: { orderBy: { occurredAt: "desc" }, take: 1 } },
      });

  const archiveIsCurrent = Boolean(
    existingArchive &&
      existingArchive.messageCount === meta.messageCount &&
      existingArchive.importedAt.toISOString() === (meta.importedAt ? new Date(meta.importedAt).toISOString() : ""),
  );

  await prisma.relationChatArchive.upsert({
    where: { userId_sourceType_sourceKey: { userId, sourceType: BC_SOURCE_TYPE, sourceKey: BC_SOURCE_KEY } },
    create: {
      userId,
      personId: person.id,
      sourceType: BC_SOURCE_TYPE,
      sourceKey: BC_SOURCE_KEY,
      archivePath: resolveRelationArchivePath(BC_SOURCE_KEY) ?? "",
      periodStart: meta.periodStart ? new Date(`${meta.periodStart}T00:00:00+08:00`) : BC_START,
      periodEnd: meta.periodEnd ? new Date(`${meta.periodEnd}T23:59:59.999+08:00`) : BC_END,
      messageCount: meta.messageCount,
      importedAt: meta.importedAt ? new Date(meta.importedAt) : new Date(),
      ...(archiveIsCurrent ? {} : { analysisStatus: "PENDING", metricsJson: Prisma.JsonNull, analyzedAt: null }),
    },
    update: {
      personId: person.id,
      archivePath: resolveRelationArchivePath(BC_SOURCE_KEY) ?? "",
      periodStart: meta.periodStart ? new Date(`${meta.periodStart}T00:00:00+08:00`) : BC_START,
      periodEnd: meta.periodEnd ? new Date(`${meta.periodEnd}T23:59:59.999+08:00`) : BC_END,
      messageCount: meta.messageCount,
      importedAt: meta.importedAt ? new Date(meta.importedAt) : new Date(),
      ...(archiveIsCurrent ? {} : { analysisStatus: "PENDING", metricsJson: Prisma.JsonNull, analyzedAt: null }),
    },
  });

  const refreshed = await prisma.relationPerson.findUniqueOrThrow({
    where: { id: person.id },
    include: { kinds: true, archives: true, interactions: { orderBy: { occurredAt: "desc" }, take: 1 } },
  });
  return withArchiveStatus(personView(refreshed));
}

export async function listRelationPeople(userId: string) {
  const people = await prisma.relationPerson.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { kinds: true, archives: true, interactions: { orderBy: { occurredAt: "desc" }, take: 1 } },
  });
  return Promise.all(people.map((person) => withArchiveStatus(personView(person))));
}

export async function getRelationPerson(userId: string, personId: string) {
  const person = await prisma.relationPerson.findFirst({
    where: { id: personId, userId },
    include: { kinds: true, archives: true, interactions: { orderBy: { occurredAt: "desc" }, take: 12 } },
  });
  return person ? withArchiveStatus(personView(person)) : null;
}

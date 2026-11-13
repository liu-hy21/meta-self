import { prisma } from "@/lib/db";

export type RangeTrack = {
  min: number;
  max: number;
  low: number;
  high: number;
  source: string;
};

export type BoardMetric = {
  id: string;
  group: "身体" | "睡眠" | "体检" | "心态";
  label: string;
  value: number;
  unit: string;
  href: string;
  recordedAt: Date;
  sourceLabel: string;
  track?: RangeTrack;
};

export type BoardFood = {
  label: string;
  items: string[];
  href: string;
  recordedAt: Date;
};

export type BoardLogLine = {
  id: string;
  at: Date;
  sourceLabel: string;
  text: string;
};

export type BoardMind = {
  recordedAt: Date;
  emotionWords: string[];
  psycheNote: string | null;
  stressNote: string | null;
};

export type BoardWork = {
  recordedAt: Date;
  companyName: string | null;
  department: string | null;
  role: string | null;
  joinedOn: string | null;
  proficient: string[];
  learning: string[];
  retired: string[];
  studyHistory: string | null;
};

export type BoardRelation = {
  recordedAt: Date;
  friends: string[];
  romance: string[];
  family: string[];
  other: string[];
};

export type BoardFinance = {
  recordedAt: Date;
  cashCents: number | null;
  investmentCents: number | null;
  liabilityCents: number | null;
};

export type BoardPlay = {
  recordedAt: Date;
  travel: string | null;
  districts: string | null;
};

export type BoardSnapshot = {
  userId: string;
  metrics: BoardMetric[];
  foods: BoardFood[];
  mind: BoardMind | null;
  work: BoardWork | null;
  relation: BoardRelation | null;
  finance: BoardFinance | null;
  play: BoardPlay | null;
  logs: BoardLogLine[];
};

const TZ = "Asia/Shanghai";

function stamp(date: Date) {
  return date.toLocaleString("zh-CN", {
    timeZone: TZ,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function leadingNumber(raw: string | null | undefined) {
  if (!raw) return null;
  const match = raw.trim().match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

function splitFoods(raw: string | null | undefined) {
  if (!raw) return [];
  return raw
    .split(/[、,，;；/\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function waistTrack(gender: string | null | undefined): RangeTrack | undefined {
  if (gender?.includes("女")) {
    return { min: 50, max: 120, low: 50, high: 80, source: "成年女性腰围对照上限 80 cm" };
  }
  if (gender?.includes("男")) {
    return { min: 50, max: 120, low: 50, high: 90, source: "成年男性腰围对照上限 90 cm" };
  }
  return undefined;
}

export async function loadBoardSnapshot(userId: string): Promise<BoardSnapshot> {
  const [profile, diet, latestSleep, latestMeasure, exam, logs, medicalVisits, mind, mindLogs, work, workLogs, relation, relationLogs, finance, trips, districts] =
    await Promise.all([
    prisma.bodyProfile.findUnique({ where: { userId } }),
    prisma.bodyDiet.findUnique({ where: { userId } }),
    prisma.sleepLog.findFirst({
      where: { userId },
      orderBy: [{ logDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.bodyMeasureLog.findFirst({
      where: { userId },
      orderBy: [{ logDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.bodyExamLog.findFirst({
      where: { userId },
      orderBy: [{ logDate: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { images: true } } },
    }),
    prisma.bodyInfoLog.findMany({
      where: { userId },
      orderBy: { writtenOn: "desc" },
      take: 3,
    }),
    prisma.medicalVisitLog.findMany({
      where: { userId },
      orderBy: { visitedOn: "desc" },
      take: 3,
    }),
    prisma.mindProfile.findUnique({ where: { userId } }),
    prisma.mindInfoLog.findMany({
      where: { userId },
      orderBy: { writtenOn: "desc" },
      take: 3,
    }),
    prisma.workProfile.findUnique({ where: { userId } }),
    prisma.workInfoLog.findMany({
      where: { userId },
      orderBy: { writtenOn: "desc" },
      take: 3,
    }),
    prisma.relationProfile.findUnique({ where: { userId } }),
    prisma.relationInfoLog.findMany({
      where: { userId },
      orderBy: { writtenOn: "desc" },
      take: 3,
    }),
    prisma.financeProfile.findUnique({ where: { userId } }),
    prisma.trip.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { title: true, updatedAt: true },
    }),
    prisma.playDistrict.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { district: true, project: true, createdAt: true },
    }),
  ]);

  const metrics: BoardMetric[] = [];
  const gender = profile?.gender;

  if (latestMeasure?.weightKg != null) {
    metrics.push({
      id: "weight",
      group: "身体",
      label: "体重",
      value: latestMeasure.weightKg,
      unit: "kg",
      href: "/body/profile?measureWrite=1",
      recordedAt: latestMeasure.logDate,
      sourceLabel: "身体测量",
    });
  }
  if (latestMeasure?.waistCm != null) {
    metrics.push({
      id: "waist",
      group: "身体",
      label: "腰围",
      value: latestMeasure.waistCm,
      unit: "cm",
      href: "/body/profile?measureWrite=1",
      recordedAt: latestMeasure.logDate,
      sourceLabel: "身体测量",
      track: waistTrack(gender),
    });
  }
  if (latestSleep) {
    metrics.push({
      id: "sleep",
      group: "睡眠",
      label: "最近睡眠",
      value: latestSleep.durationHours,
      unit: "小时",
      href: "/body/profile?sleepWrite=1",
      recordedAt: latestSleep.logDate ?? latestSleep.occurredAt,
      sourceLabel: "睡眠记录",
      track: { min: 0, max: 14, low: 7, high: 9, source: "成人每晚常用 7–9 小时" },
    });
  }

  const examAt = exam?.logDate;
  if (exam && examAt && exam._count.images > 0) {
    metrics.push({
      id: "exam",
      group: "体检",
      label: "最近体检",
      value: exam._count.images,
      unit: "张",
      href: "/body/profile?examWrite=1",
      recordedAt: examAt,
      sourceLabel: "体检报告图片",
    });
  }

  const foods: BoardFood[] = [];
  if (diet) {
    const groups = [
      ["蛋白质", diet.proteinFoods],
      ["脂肪", diet.fatFoods],
      ["碳水", diet.carbFoods],
      ["维生素", diet.vitaminFoods],
    ] as const;
    for (const [label, raw] of groups) {
      const items = splitFoods(raw);
      if (items.length > 0) {
        foods.push({ label, items, href: "/body/profile?edit=diet", recordedAt: diet.updatedAt });
      }
    }
  }

  const emotionWords = splitFoods(mind?.emotionWords);
  if (mind?.emotionLevel != null) {
    metrics.push({
      id: "emotion-level",
      group: "心态",
      label: "通常强度",
      value: mind.emotionLevel,
      unit: "分",
      href: "/mind/profile?edit=emotion",
      recordedAt: mind.updatedAt,
      sourceLabel: "档案 · 情绪",
    });
  }
  const boardMind: BoardMind | null =
    mind && (emotionWords.length > 0 || mind.psycheNote || mind.stressNote || mind.emotionLevel != null)
      ? {
          recordedAt: mind.updatedAt,
          emotionWords,
          psycheNote: mind.psycheNote,
          stressNote: mind.stressNote,
        }
      : null;

  const logLines: BoardLogLine[] = [
    ...logs.flatMap((log) => {
      const sourceLabel = `日志 · ${stamp(log.writtenOn)}`;
      const parts = [log.body, log.diet, log.sleep, log.exam].filter(Boolean);
      if (parts.length === 0) return [];
      return [{ id: log.id, at: log.writtenOn, sourceLabel, text: parts.join("；") }];
    }),
    ...medicalVisits.flatMap((visit) => {
      const sourceLabel = `看病记录 · ${stamp(visit.visitedOn)}`;
      const head = [visit.hospital, visit.department].filter(Boolean).join(" · ");
      const text = [head, visit.note].filter(Boolean).join("：");
      if (!text) return [];
      return [{ id: visit.id, at: visit.visitedOn, sourceLabel, text }];
    }),
    ...mindLogs.flatMap((log) => {
      const sourceLabel = `心态日志 · ${stamp(log.writtenOn)}`;
      const parts = [log.emotion, log.psyche].filter(Boolean);
      if (parts.length === 0) return [];
      return [{ id: log.id, at: log.writtenOn, sourceLabel, text: parts.join("；") }];
    }),
    ...workLogs.flatMap((log) => {
      const sourceLabel = `工作日志 · ${stamp(log.writtenOn)}`;
      const parts = [log.occasion, log.outcome, log.nextChange].filter(Boolean);
      if (parts.length === 0) return [];
      return [{ id: log.id, at: log.writtenOn, sourceLabel, text: parts.join("；") }];
    }),
    ...relationLogs.flatMap((log) => {
      const sourceLabel = `关系日志 · ${stamp(log.writtenOn)}`;
      const parts = [log.person, log.happened, log.feeling != null ? `感受 ${log.feeling}` : null].filter(Boolean);
      if (parts.length === 0) return [];
      return [{ id: log.id, at: log.writtenOn, sourceLabel, text: parts.join("；") }];
    }),
  ];

  const proficient = splitFoods(work?.proficient);
  const learning = splitFoods(work?.learning);
  const retired = splitFoods(work?.retired);
  const boardWork: BoardWork | null =
    work && (work.companyName || work.department || work.role || work.joinedOn || work.studyHistory || proficient.length || learning.length || retired.length)
      ? {
          recordedAt: work.updatedAt,
          companyName: work.companyName,
          department: work.department,
          role: work.role,
          joinedOn: work.joinedOn,
          proficient,
          learning,
          retired,
          studyHistory: work.studyHistory,
        }
      : null;

  const friends = splitFoods(relation?.friends);
  const romance = splitFoods(relation?.romance);
  const family = splitFoods(relation?.family);
  const other = splitFoods(relation?.other);
  const boardRelation: BoardRelation | null =
    relation && (friends.length || romance.length || family.length || other.length)
      ? { recordedAt: relation.updatedAt, friends, romance, family, other }
      : null;

  const travel = trips.map((trip) => trip.title).join("\n");
  const districtText = districts.map((item) => `${item.district} · ${item.project}`).join("\n");
  const recordedCandidates = [trips[0]?.updatedAt, districts[0]?.createdAt].filter((date): date is Date => date != null);
  const boardPlay: BoardPlay | null =
    districtText || travel
      ? {
          recordedAt: recordedCandidates.reduce((latest, date) => (date > latest ? date : latest)),
          travel: travel || null,
          districts: districtText || null,
        }
      : null;

  const boardFinance: BoardFinance | null =
    finance && (finance.cashCents != null || finance.investmentCents != null || finance.liabilityCents != null)
      ? {
          recordedAt: finance.updatedAt,
          cashCents: finance.cashCents,
          investmentCents: finance.investmentCents,
          liabilityCents: finance.liabilityCents,
        }
      : null;

  return { userId, metrics, foods, mind: boardMind, work: boardWork, relation: boardRelation, finance: boardFinance, play: boardPlay, logs: logLines };
}

export function formatBoardTime(date: Date) {
  return stamp(date);
}

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

function hemoglobinTrack(gender: string | null | undefined, value: number): RangeTrack | undefined {
  if (value < 50 || value > 250) return undefined;
  if (gender?.includes("女")) {
    return { min: 80, max: 200, low: 115, high: 150, source: "成年女性血红蛋白常用区间 115–150 g/L" };
  }
  if (gender?.includes("男")) {
    return { min: 80, max: 200, low: 130, high: 175, source: "成年男性血红蛋白常用区间 130–175 g/L" };
  }
  return undefined;
}

function glucoseTrack(value: number): RangeTrack | undefined {
  if (value >= 2 && value <= 30) {
    return { min: 2, max: 15, low: 3.9, high: 6.1, source: "空腹血糖常用区间 3.9–6.1 mmol/L" };
  }
  if (value >= 40 && value <= 400) {
    return { min: 40, max: 250, low: 70, high: 110, source: "空腹血糖常用区间 70–110 mg/dL" };
  }
  return undefined;
}

export async function loadBoardSnapshot(userId: string): Promise<BoardSnapshot> {
  const [profile, diet, sleepHabit, exam, logs, mind, mindLogs, work, workLogs, relation, relationLogs, finance, financeLogs, trips, districts] =
    await Promise.all([
    prisma.bodyProfile.findUnique({ where: { userId } }),
    prisma.bodyDiet.findUnique({ where: { userId } }),
    prisma.bodySleepHabit.findUnique({ where: { userId } }),
    prisma.bodyExam.findUnique({ where: { userId } }),
    prisma.bodyInfoLog.findMany({
      where: { userId },
      orderBy: { writtenOn: "desc" },
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
    prisma.financeInfoLog.findMany({
      where: { userId },
      orderBy: { writtenOn: "desc" },
      take: 3,
    }),
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

  if (profile?.weightKg != null) {
    metrics.push({
      id: "weight",
      group: "身体",
      label: "体重",
      value: profile.weightKg,
      unit: "kg",
      href: "/body/profile?edit=basic",
      recordedAt: profile.updatedAt,
      sourceLabel: "档案 · 体重",
    });
  }
  if (profile?.waistCm != null) {
    metrics.push({
      id: "waist",
      group: "身体",
      label: "腰围",
      value: profile.waistCm,
      unit: "cm",
      href: "/body/profile?edit=basic",
      recordedAt: profile.updatedAt,
      sourceLabel: "档案 · 腰围",
      track: waistTrack(gender),
    });
  }
  if (sleepHabit?.durationHours != null) {
    metrics.push({
      id: "sleep",
      group: "睡眠",
      label: "通常时长",
      value: sleepHabit.durationHours,
      unit: "小时",
      href: "/body/profile?edit=sleep",
      recordedAt: sleepHabit.updatedAt,
      sourceLabel: "档案 · 睡眠",
      track: { min: 0, max: 14, low: 7, high: 9, source: "成人每晚常用 7–9 小时" },
    });
  }

  const examAt = exam?.updatedAt;
  if (exam && examAt) {
    const systolic = leadingNumber(exam.systolic);
    const diastolic = leadingNumber(exam.diastolic);
    const heart = leadingNumber(exam.restingHeartRate);
    const hemoglobin = leadingNumber(exam.hemoglobin);
    const glucose = leadingNumber(exam.glucose);
    if (systolic != null) {
      metrics.push({
        id: "systolic",
        group: "体检",
        label: "收缩压",
        value: systolic,
        unit: "mmHg",
        href: "/body/profile?edit=exam",
        recordedAt: examAt,
        sourceLabel: "档案 · 收缩压",
        track: { min: 70, max: 180, low: 90, high: 120, source: "诊室收缩压常用区间 90–120 mmHg" },
      });
    }
    if (diastolic != null) {
      metrics.push({
        id: "diastolic",
        group: "体检",
        label: "舒张压",
        value: diastolic,
        unit: "mmHg",
        href: "/body/profile?edit=exam",
        recordedAt: examAt,
        sourceLabel: "档案 · 舒张压",
        track: { min: 40, max: 120, low: 60, high: 80, source: "诊室舒张压常用区间 60–80 mmHg" },
      });
    }
    if (heart != null) {
      metrics.push({
        id: "heart",
        group: "体检",
        label: "静息心率",
        value: heart,
        unit: "次/分",
        href: "/body/profile?edit=exam",
        recordedAt: examAt,
        sourceLabel: "档案 · 静息心率",
        track: { min: 40, max: 140, low: 60, high: 100, source: "成人静息心率常用区间 60–100 次/分" },
      });
    }
    if (hemoglobin != null) {
      metrics.push({
        id: "hemoglobin",
        group: "体检",
        label: "血红蛋白",
        value: hemoglobin,
        unit: "g/L",
        href: "/body/profile?edit=exam",
        recordedAt: examAt,
        sourceLabel: "档案 · 血红蛋白",
        track: hemoglobinTrack(gender, hemoglobin),
      });
    }
    if (glucose != null) {
      metrics.push({
        id: "glucose",
        group: "体检",
        label: "血糖",
        value: glucose,
        unit: glucose <= 30 ? "mmol/L" : "mg/dL",
        href: "/body/profile?edit=exam",
        recordedAt: examAt,
        sourceLabel: "档案 · 血糖",
        track: glucoseTrack(glucose),
      });
    }
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
    ...financeLogs.flatMap((log) => {
      const sourceLabel = `财商日志 · ${stamp(log.writtenOn)}`;
      const parts = [log.learned, log.decision, log.outcome].filter(Boolean);
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

  return { metrics, foods, mind: boardMind, work: boardWork, relation: boardRelation, finance: boardFinance, play: boardPlay, logs: logLines };
}

export function formatBoardTime(date: Date) {
  return stamp(date);
}

import { prisma } from "@/lib/db";

const TZ = "Asia/Shanghai";

function when(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")} ${pick("hour")}:${pick("minute")}`;
}

function day(date: Date) {
  return date.toISOString().slice(0, 10);
}

function yuan(cents: number | null | undefined) {
  if (cents == null) return null;
  return `${(cents / 100).toLocaleString("zh-CN", { maximumFractionDigits: 2 })} 元`;
}

function line(label: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  return `- ${label}：${value}\n`;
}

export async function buildContextMarkdown(userId: string) {
  const [profile, diet, sleepLogs, measures, exams, logs, medicalVisits, mind, mindLogs, work, workLogs, relation, relationLogs, finance, districts, trips] =
    await Promise.all([
    prisma.bodyProfile.findUnique({ where: { userId } }),
    prisma.bodyDiet.findUnique({ where: { userId } }),
    prisma.sleepLog.findMany({
      where: { userId },
      orderBy: [{ logDate: "asc" }, { createdAt: "asc" }],
    }),
    prisma.bodyMeasureLog.findMany({
      where: { userId },
      orderBy: [{ logDate: "asc" }, { createdAt: "asc" }],
    }),
    prisma.bodyExamLog.findMany({
      where: { userId },
      orderBy: [{ logDate: "asc" }, { createdAt: "asc" }],
      include: { images: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.bodyInfoLog.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.medicalVisitLog.findMany({
      where: { userId },
      orderBy: { visitedOn: "asc" },
    }),
    prisma.mindProfile.findUnique({ where: { userId } }),
    prisma.mindInfoLog.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workProfile.findUnique({ where: { userId } }),
    prisma.workInfoLog.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.relationProfile.findUnique({ where: { userId } }),
    prisma.relationInfoLog.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.financeProfile.findUnique({ where: { userId } }),
    prisma.playDistrict.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { entries: { orderBy: [{ sortAt: "asc" }, { createdAt: "asc" }] } },
    }),
  ]);

  const chunks: string[] = [`# MetaSelf 上下文\n\n导出时间：${when(new Date())}\n`];

  chunks.push("\n## 档案\n");
  chunks.push("\n### 基本信息\n\n");
  if (!profile) {
    chunks.push("尚未填写。\n");
  } else {
    chunks.push(`更新时间：${when(profile.updatedAt)}\n\n`);
    chunks.push(line("身高", profile.heightCm != null ? `${profile.heightCm} cm` : null));
    chunks.push(line("生日", profile.birthDate ? day(profile.birthDate) : null));
    chunks.push(line("性别", profile.gender));
    chunks.push(line("血型", profile.bloodType));
  }

  chunks.push("\n### 饮食情况\n\n");
  if (!diet) {
    chunks.push("尚未填写。\n");
  } else {
    chunks.push(`更新时间：${when(diet.updatedAt)}\n\n`);
    chunks.push(line("蛋白质", diet.proteinFoods));
    chunks.push(line("脂肪", diet.fatFoods));
    chunks.push(line("碳水", diet.carbFoods));
    chunks.push(line("维生素", diet.vitaminFoods));
  }

  chunks.push("\n### 睡眠情况\n\n");
  if (sleepLogs.length === 0) {
    chunks.push("还没有记录。\n");
  } else {
    for (const entry of sleepLogs) {
      const loggedOn = entry.logDate ? day(entry.logDate) : day(entry.occurredAt);
      const range =
        entry.sleepStart && entry.wakeTime
          ? `${entry.sleepStart} → ${entry.wakeTime} · ${entry.durationHours} 小时`
          : `${entry.durationHours} 小时`;
      chunks.push(`- ${loggedOn}：${range}\n`);
    }
  }

  chunks.push("\n### 身体测量\n\n");
  if (measures.length === 0) {
    chunks.push("还没有记录。\n");
  } else {
    for (const entry of measures) {
      const parts = [
        entry.weightKg != null ? `体重 ${entry.weightKg} kg` : null,
        entry.bodyFatPct != null ? `体脂 ${entry.bodyFatPct}%` : null,
        entry.chestCm != null ? `胸围 ${entry.chestCm} cm` : null,
        entry.waistCm != null ? `腰围 ${entry.waistCm} cm` : null,
        entry.thighCm != null ? `腿围 ${entry.thighCm} cm` : null,
      ].filter(Boolean);
      chunks.push(`- ${day(entry.logDate)}：${parts.join("，")}\n`);
    }
  }

  chunks.push("\n### 体检情况\n\n");
  if (exams.length === 0) {
    chunks.push("还没有记录。\n");
  } else {
    for (const exam of exams) {
      chunks.push(`\n#### ${day(exam.logDate)}\n\n`);
      if (exam.images.length === 0) {
        chunks.push("（无图片附件）\n");
      } else {
        for (const image of exam.images) {
          chunks.push(`- ${image.originalName}\n`);
        }
      }
    }
  }

  chunks.push("\n## 身体日志\n");
  if (logs.length === 0) {
    chunks.push("\n还没有日志。\n");
  }
  for (const log of logs) {
    chunks.push(`\n### ${when(log.createdAt)}\n\n`);
    chunks.push(`创建时间：${when(log.createdAt)}\n\n`);
    chunks.push(line("身体", log.body));
    chunks.push(line("饮食", log.diet));
    chunks.push(line("睡眠", log.sleep));
    chunks.push(line("体检", log.exam));
  }

  chunks.push("\n## 看病记录\n");
  if (medicalVisits.length === 0) {
    chunks.push("\n还没有记录。\n");
  }
  for (const visit of medicalVisits) {
    chunks.push(`\n### ${day(visit.visitedOn)}\n\n`);
    chunks.push(line("医院", visit.hospital));
    chunks.push(line("科室", visit.department));
    chunks.push(line("记录", visit.note));
  }

  chunks.push("\n## 心态\n");
  chunks.push("\n### 情绪\n\n");
  if (!mind) {
    chunks.push("尚未填写。\n");
  } else {
    chunks.push(`更新时间：${when(mind.updatedAt)}\n\n`);
    chunks.push(line("常见情绪", mind.emotionWords));
    chunks.push(line("通常强度", mind.emotionLevel != null ? `${mind.emotionLevel}` : null));
  }
  chunks.push("\n### 心理\n\n");
  if (!mind) {
    chunks.push("尚未填写。\n");
  } else {
    chunks.push(line("当前状态", mind.psycheNote));
    chunks.push(line("主要压力", mind.stressNote));
  }

  chunks.push("\n## 心态日志\n");
  if (mindLogs.length === 0) {
    chunks.push("\n还没有日志。\n");
  }
  for (const log of mindLogs) {
    chunks.push(`\n### ${when(log.createdAt)}\n\n`);
    chunks.push(`创建时间：${when(log.createdAt)}\n\n`);
    chunks.push(line("情绪", log.emotion));
    chunks.push(line("心理", log.psyche));
  }

  chunks.push("\n## 工作\n");
  chunks.push("\n### 公司\n\n");
  if (!work) {
    chunks.push("尚未填写。\n");
  } else {
    chunks.push(`更新时间：${when(work.updatedAt)}\n\n`);
    chunks.push(line("公司", work.companyName));
    chunks.push(line("部门", work.department));
    chunks.push(line("角色", work.role));
    chunks.push(line("入职时间", work.joinedOn));
  }
  chunks.push("\n### 技术\n\n");
  if (!work) {
    chunks.push("尚未填写。\n");
  } else {
    chunks.push(line("会", work.proficient));
    chunks.push(line("在学", work.learning));
    chunks.push(line("不用了", work.retired));
  }
  chunks.push("\n### 学习经历\n\n");
  if (!work?.studyHistory) {
    chunks.push("尚未填写。\n");
  } else {
    chunks.push(line("过往", work.studyHistory));
  }

  chunks.push("\n## 工作日志\n");
  if (workLogs.length === 0) {
    chunks.push("\n还没有日志。\n");
  }
  for (const log of workLogs) {
    chunks.push(`\n### ${when(log.createdAt)}\n\n`);
    chunks.push(`创建时间：${when(log.createdAt)}\n\n`);
    chunks.push(line("场合", log.occasion));
    chunks.push(line("结果", log.outcome));
    chunks.push(line("下次", log.nextChange));
  }

  chunks.push("\n## 关系\n\n");
  if (!relation) {
    chunks.push("尚未填写。\n");
  } else {
    chunks.push(`更新时间：${when(relation.updatedAt)}\n\n`);
    chunks.push(line("友", relation.friends));
    chunks.push(line("爱", relation.romance));
    chunks.push(line("亲", relation.family));
    chunks.push(line("其他", relation.other));
  }

  chunks.push("\n## 关系日志\n");
  if (relationLogs.length === 0) {
    chunks.push("\n还没有日志。\n");
  }
  for (const log of relationLogs) {
    chunks.push(`\n### ${when(log.createdAt)}\n\n`);
    chunks.push(`创建时间：${when(log.createdAt)}\n\n`);
    chunks.push(line("谁", log.person));
    chunks.push(line("一句", log.happened));
    chunks.push(line("感受", log.feeling != null ? `${log.feeling}` : null));
  }

  chunks.push("\n## 玩转\n\n### 财商\n\n");
  if (!finance) {
    chunks.push("尚未填写。\n");
  } else {
    chunks.push(`更新时间：${when(finance.updatedAt)}\n\n`);
    chunks.push(line("现金", yuan(finance.cashCents)));
    chunks.push(line("投资", yuan(finance.investmentCents)));
    chunks.push(line("负债", yuan(finance.liabilityCents)));
    if (finance.cashCents != null && finance.investmentCents != null && finance.liabilityCents != null) {
      chunks.push(line("净资产", yuan(finance.cashCents + finance.investmentCents - finance.liabilityCents)));
    }
  }
  chunks.push("\n### 玩商\n\n");
  chunks.push("\n#### 旅游\n\n");
  if (trips.length === 0) {
    chunks.push("尚未填写。\n");
  }
  for (const trip of trips) {
    chunks.push(`\n##### ${trip.title}\n\n`);
    chunks.push(`更新时间：${when(trip.updatedAt)}\n\n`);
    chunks.push(line("旅客", trip.traveler));
    chunks.push(line("计价", trip.note));
    let currentDay = "";
    for (const entry of trip.entries) {
      const stamp = entry.kind === "hotel" ? entry.checkIn : entry.happenedOn;
      const stampDay = stamp ? day(stamp) : "";
      if (stampDay !== currentDay) {
        currentDay = stampDay;
        chunks.push(`\n**${stampDay || "未标日期"}**\n\n`);
      }
      chunks.push(`- ${entry.kind === "flight" ? "航班" : entry.kind === "hotel" ? "酒店" : "当天"}`);
      if (entry.kind === "flight") {
        chunks.push(` ${entry.origin ?? ""} → ${entry.destination ?? ""} ${entry.flightNo ?? ""} ${entry.cabin ?? ""} ${entry.departTime ?? ""}–${entry.arriveTime ?? ""} ${entry.terminal ?? ""}`);
        const fare = yuan(entry.fareCents);
        const tax = yuan(entry.taxCents);
        const total = yuan(entry.totalCents);
        if (fare) chunks.push(` 票面 ${fare}`);
        if (tax) chunks.push(` 税 ${tax}`);
        if (total) chunks.push(` 小计 ${total}`);
        chunks.push("\n");
        if (entry.baggage) chunks.push(`  行李：${entry.baggage}\n`);
        if (entry.remark) chunks.push(`  说明：${entry.remark}\n`);
      } else if (entry.kind === "hotel") {
        chunks.push(` ${entry.hotelName ?? ""}`);
        if (entry.checkIn && entry.checkOut) chunks.push(` ${day(entry.checkIn)}–${day(entry.checkOut)}`);
        if (entry.nights != null) chunks.push(` ${entry.nights}晚`);
        const paid = yuan(entry.paidCents);
        if (paid) chunks.push(` 实付 ${paid}`);
        if (entry.includes) chunks.push(` ${entry.includes}`);
        chunks.push("\n");
      } else if (entry.body) {
        chunks.push(` ${entry.body}\n`);
      }
    }
  }
  chunks.push("\n#### 各个地点\n\n");
  if (districts.length === 0) {
    chunks.push("尚未填写。\n");
  }
  for (const item of districts) {
    chunks.push(`- 商圈：${item.district}\n`);
    chunks.push(`  项目：${item.project}\n`);
  }

  return chunks.join("");
}

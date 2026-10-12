import type { ReportType } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  buildReportContext,
  contextToCitations,
} from "@/lib/reports/context";
import { renderTemplateReport } from "@/lib/reports/template";

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );
}

export function periodForReport(type: ReportType, now = new Date()) {
  if (type === "BIWEEKLY") {
    return {
      periodStart: addDays(now, -14),
      periodEnd: now,
      title: `双周提醒 ${now.toISOString().slice(0, 10)}`,
    };
  }
  const periodStart = startOfMonth(now);
  const periodEnd = endOfMonth(now);
  return {
    periodStart,
    periodEnd,
    title: `月报 ${periodStart.getUTCFullYear()}-${String(periodStart.getUTCMonth() + 1).padStart(2, "0")}`,
  };
}

async function renderWithLlm(
  type: ReportType,
  ctx: Awaited<ReturnType<typeof buildReportContext>>,
): Promise<string | null> {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";
  if (!apiKey) return null;

  const system = `你是 MetaSelf 的个人备忘助手。语气简短、像给自己写笔记。五域：身体、精神、工作、社会关系、财务。
输出 Markdown。每域含：现状、改进、下一步（各 1–3 句）。引用数据时写 record id。
身体和财务段落末尾提醒：非诊疗、非投资建议。不要打分排名、不要教练口吻。
类型：${type === "BIWEEKLY" ? "双周短提醒" : "月报"}`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: JSON.stringify(ctx),
        },
      ],
      temperature: 0.4,
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? null;
}

export async function generateReportForUser(
  userId: string,
  type: ReportType,
) {
  const { periodStart, periodEnd, title } = periodForReport(type);
  const ctx = await buildReportContext(userId, periodStart, periodEnd);
  const llm = await renderWithLlm(type, ctx);
  const contentMarkdown =
    llm ?? renderTemplateReport(type, ctx);
  const generatedBy = llm ? "llm" : "template";

  const report = await prisma.report.create({
    data: {
      userId,
      type,
      periodStart,
      periodEnd,
      title,
      contentMarkdown,
      citationsJson: contextToCitations(ctx),
      generatedBy,
      status: "DRAFT",
    },
  });

  const now = new Date();
  const nextBiweekly = addDays(now, 14);
  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  await prisma.reportSchedule.upsert({
    where: { userId },
    create: {
      userId,
      lastBiweeklyAt: type === "BIWEEKLY" ? now : undefined,
      lastMonthlyAt: type === "MONTHLY" ? now : undefined,
      nextBiweeklyDue: type === "BIWEEKLY" ? nextBiweekly : nextBiweekly,
      nextMonthlyDue: nextMonth,
    },
    update: {
      ...(type === "BIWEEKLY"
        ? { lastBiweeklyAt: now, nextBiweeklyDue: nextBiweekly }
        : { lastMonthlyAt: now, nextMonthlyDue: nextMonth }),
    },
  });

  return report;
}

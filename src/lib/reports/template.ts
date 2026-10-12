import type { ReportContext } from "@/lib/reports/context";
import type { ReportType } from "@prisma/client";

const DISCLAIMER =
  "> 说明：以下内容基于你本人录入的数据整理，不构成医疗诊断或投资建议。\n\n";

function section(
  title: string,
 现状: string,
  改进: string,
  下一步: string,
): string {
  return `## ${title}\n\n**现状**\n\n${现状}\n\n**改进**\n\n${改进}\n\n**下一步**\n\n${下一步}\n`;
}

export function renderTemplateReport(
  type: ReportType,
  ctx: ReportContext,
): string {
  const avgMood =
    ctx.mind.length > 0
      ? (
          ctx.mind.reduce((a, m) => a + m.score, 0) / ctx.mind.length
        ).toFixed(1)
      : "—";
  const avgSleep =
    ctx.body.sleep.length > 0
      ? (
          ctx.body.sleep.reduce((a, s) => a + s.durationHours, 0) /
          ctx.body.sleep.length
        ).toFixed(1)
      : "—";

  const intro =
    type === "BIWEEKLY"
      ? `# 双周提醒\n\n周期：${ctx.periodStart.slice(0, 10)} — ${ctx.periodEnd.slice(0, 10)}\n\n`
      : `# 月报\n\n周期：${ctx.periodStart.slice(0, 10)} — ${ctx.periodEnd.slice(0, 10)}\n\n`;

  const gapsBlock =
    ctx.gaps.length > 0
      ? `**记录缺口**：${ctx.gaps.join("；")}\n\n`
      : "";

  return (
    DISCLAIMER +
    intro +
    gapsBlock +
    section(
      "身体",
      `睡眠记录 ${ctx.body.sleep.length} 条，平均 ${avgSleep} 小时；饮食 ${ctx.body.meals.length} 条；体征 ${ctx.body.vitals.length} 条。`,
      ctx.gaps.includes("本周期无睡眠记录")
        ? "先恢复睡眠流水，每天一条即可。"
        : "保持睡眠记录节奏，留意明显偏短的几天。",
      "今晚补记睡眠时长（小时）。",
    ) +
    section(
      "精神",
      `情绪记录 ${ctx.mind.length} 条，均分 ${avgMood}/5。`,
      ctx.mind.length < 7
        ? "本周期情绪点偏少，月报趋势会不准。"
        : "留意低分日的原句记录，不必强行解读。",
      "用 1 分钟记今日情绪分 + 一句话。",
    ) +
    section(
      "工作",
      `当前公司：${ctx.work.company ?? "未填"}；技术栈 ${ctx.work.techCount} 项；表达复盘 ${ctx.work.expressions.length} 条。`,
      "把一次真实场合写进表达复盘（场合 + 下次改什么）。",
      "选一次会议或对话，写 3 行复盘。",
    ) +
    section(
      "社会关系",
      `互动 ${ctx.relations.interactions.length} 条。`,
      "久未互动的人记一条轻量互动（电话、消息、见面均可）。",
      "选一位关系人，记一句互动和你的感受分。",
    ) +
    section(
      "财务",
      ctx.finance.latestNetWorthCents != null
        ? `最近净资产约 ${(ctx.finance.latestNetWorthCents / 100).toFixed(2)} 元（来自你的快照）；财商记录 ${ctx.finance.literacy.length} 条。`
        : `本周期无资产快照；财商记录 ${ctx.finance.literacy.length} 条。`,
      "资产快照不必每天做，但每月至少一次；决策与学习分开记。",
      "更新一版资产快照，或写一条财商学习/决策记录。",
    )
  );
}

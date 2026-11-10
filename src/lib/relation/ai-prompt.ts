import type { RelationMetrics } from "@/lib/relation/types";

export type RelationAiSample = {
  id: string;
  time: string;
  sender: string;
  text: string;
};

export function buildRelationAiPrompt(input: {
  personName: string;
  periodStart: string;
  periodEnd: string;
  metrics: RelationMetrics;
  samples: RelationAiSample[];
}) {
  const { personName, periodStart, periodEnd, metrics, samples } = input;
  const compactMetrics = {
    totalMessages: metrics.totalMessages,
    activeDays: metrics.activeDays,
    sessions: metrics.sessions.length,
    senderTotals: metrics.senderTotals,
    response: metrics.response,
    weeklyTrend: metrics.weeklyTrend,
    temperatureTrend: metrics.temperatureTrend,
    topics: metrics.topics,
    typeCounts: metrics.typeCounts,
  };

  return {
    system: `你是 MetaSelf 的关系研究助手。你要分析一段私人聊天，但必须克制、可复核、避免把行为样本说成医学或人格诊断。
输出中文 Markdown，分成以下小节：
## 关系温度走势
## 双方沟通画像
## 聊天话题
## 可观察的互动模式
## 下一步观察问题

规则：
1. 只依据统计指标和给出的消息样本，不补写不存在的事实。
2. 每个重要判断后标注证据 ID，例如 [msg-000123]；若只有统计依据，写“统计基线”。
3. “性格分析”改写成“沟通画像”，描述表达习惯和互动模式，不给人格类型、心理诊断或道德评价。
4. 温度是行为指标，不是感情真值；解释走势时同时考虑消息量、互惠度、活跃日和回应节奏。
5. 不要整段复述聊天原文，不要暴露隐私，不要建议操控对方。每节 2—5 条短段落或要点。`,
    user: JSON.stringify({
      person: personName,
      period: { start: periodStart, end: periodEnd },
      metrics: compactMetrics,
      sampledMessages: samples,
    }),
  };
}

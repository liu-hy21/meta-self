import type { ChatMessageKind, RelationMetrics } from "@/lib/relation/types";

export type RelationMetricMethodologyItem = {
  key: string;
  label: string;
  value: string;
  calculation: string;
};

export type RelationMetricMethodologySection = {
  key: string;
  title: string;
  note: string;
  items: RelationMetricMethodologyItem[];
};

const kindLabels: Record<ChatMessageKind, string> = {
  text: "文字",
  image: "图片",
  voice: "语音",
  video: "视频",
  emoji: "表情",
  system: "系统",
  location: "位置",
  card: "名片",
  voip: "通话",
  other: "其他",
};

const formatNumber = (value: number) => value.toLocaleString("zh-CN");
const formatRate = (value: number | null) => value == null ? "—" : `${value}%`;
const formatMinutes = (value: number | null) => {
  if (value == null) return "—";
  if (value < 60) return `${value} 分钟`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours} 小时 ${minutes} 分` : `${hours} 小时`;
};
const formatDecimal = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);

function item(key: string, label: string, value: string, calculation: string): RelationMetricMethodologyItem {
  return { key, label, value, calculation };
}

export function buildRelationMetricMethodology(metrics: RelationMetrics): RelationMetricMethodologySection[] {
  const messageTypeSummary = (Object.entries(metrics.typeCounts) as [ChatMessageKind, number][])
    .map(([kind, count]) => `${kindLabels[kind]} ${formatNumber(count)}`)
    .join(" · ");
  const quantity = metrics.quantity;
  const time = metrics.time;
  const pair = (self: string, other: string) => `我 ${self} · bc ${other}`;
  const balance = metrics.senderTotals.self && metrics.senderTotals.other ? `${Math.round((Math.min(metrics.senderTotals.self, metrics.senderTotals.other) / Math.max(metrics.senderTotals.self, metrics.senderTotals.other)) * 100)}%` : "—";
  const senderShare = (value: number) => metrics.coverage.nonSystemMessages ? formatRate(Math.round((value / metrics.coverage.nonSystemMessages) * 100)) : "—";

  return [
    {
      key: "scope",
      title: "数据范围与覆盖",
      note: "所有范围指标来自当前已保存的分析快照。",
      items: [
        item("version", "分析版本", metrics.version, "用于标识指标结构版本；页面只读取当前版本的持久化快照。"),
        item("totalMessages", "消息总量", formatNumber(metrics.totalMessages), "原文中所有可解析消息，包含系统消息。"),
        item("systemMessages", "系统消息", formatNumber(metrics.systemMessages), "消息类型被识别为 system 的记录；不参与会话、轮次和互动节奏计算。"),
        item("nonSystemMessages", "非系统消息", formatNumber(metrics.coverage.nonSystemMessages), "消息总数减去系统消息，作为互动分析的输入集合。"),
        item("period", "时间范围", `${metrics.coverage.start || "—"} — ${metrics.coverage.end || "—"}`, "取非系统消息中最早和最晚消息的本地日期，时区固定为 Asia/Shanghai。"),
        item("coveredDays", "覆盖自然日", `${formatNumber(metrics.coverage.coveredDays)} 天`, "最早日期到最晚日期的自然日跨度，首尾日期均计入。"),
        item("activeDays", "活跃日", `${formatNumber(metrics.coverage.activeDays)} 天`, "至少出现一条非系统消息的自然日数量。"),
        item("activeDayRate", "活跃日覆盖率", formatRate(Math.round(metrics.coverage.activeDayRate * 100)), "活跃日 ÷ 覆盖自然日；结果四舍五入到百分比整数。"),
      ],
    },
    {
      key: "content",
      title: "内容结构",
      note: "先区分内容类型，再统计文字量，避免把媒体消息误当成文字。",
      items: [
        item("textMessages", "文字消息", formatNumber(metrics.content.textMessages), "非系统消息中 kind=text 的记录数量。"),
        item("textChars", "文字字符", formatNumber(metrics.content.textChars), "对文字消息按 Unicode 字符计数；媒体占位符不计入。"),
        item("mediaMessages", "媒体消息", formatNumber(metrics.content.mediaMessages), "非系统消息总数减去文字消息数。"),
        item("mediaRate", "媒体消息占比", formatRate(Math.round(metrics.content.mediaRate * 100)), "媒体消息 ÷ 非系统消息；结果四舍五入到百分比整数。"),
        item("typeCounts", "消息类型分布", messageTypeSummary, "按解析出的消息类型分别计数，类型包括文字、图片、语音、视频、表情、系统、位置、名片、通话和其他。"),
      ],
    },
    {
      key: "structure",
      title: "会话、轮次与发起",
      note: "会话看一次连续互动，轮次看同一方的连续表达。",
      items: [
        item("sessions", "会话", formatNumber(metrics.sessions.length), `相邻非系统消息间隔超过 ${metrics.sessionGapMinutes} 分钟时切开；否则归入同一会话。`),
        item("sessionGap", "会话切分阈值", `${metrics.sessionGapMinutes} 分钟`, "相邻非系统消息时间差大于 45 分钟，开始新会话。"),
        item("sessionDuration", "会话持续时间", "每个会话单独计算", "会话最后一条消息时间减去第一条消息时间，按分钟四舍五入。"),
        item("sessionInitiator", "会话发起数量", `我 ${formatNumber(metrics.initiation.self)} · bc ${formatNumber(metrics.initiation.other)} · 未知 ${formatNumber(metrics.initiation.unknown)}`, "会话中的第一条非系统消息发送者视为发起方；当前数据没有未知发起方。"),
        item("bidirectional", "双向会话", `${formatNumber(metrics.initiation.bidirectional)} / ${formatNumber(metrics.initiation.totalSessions)}`, "同一会话内同时出现我和 bc 的消息，双向会话数 ÷ 会话总数得到双向率。"),
        item("initiationRate", "会话发起占比", `我 ${formatRate(metrics.initiation.selfRate)} · bc ${formatRate(metrics.initiation.otherRate)}`, "各方发起会话数 ÷ 有明确发起方的会话数。"),
        item("rounds", "表达轮次", `${formatNumber(metrics.rounds.total)}（我 ${formatNumber(metrics.rounds.self)} · bc ${formatNumber(metrics.rounds.other)}）`, "同一发送者连续发送且相邻消息间隔不超过 5 分钟，合并为一轮。"),
        item("roundGap", "轮次切分阈值", "5 分钟", "发送者变化，或同一发送者的相邻消息间隔大于 5 分钟，开始新轮次。"),
        item("roundMedian", "每轮消息中位", `${metrics.rounds.medianMessages ?? "—"} 条`, "所有表达轮次的消息数取中位数，降低极长连发对结果的影响。"),
        item("roundTextMedian", "每轮文字中位", `${metrics.rounds.medianTextChars ?? "—"} 字`, "只对包含文字的轮次统计字符数，并取中位数。"),
        item("totalRounds", "总轮次（合计）", formatNumber(metrics.rounds.total), "所有发送者连续表达轮次的总数量。"),
        item("roundCounts", "轮次数量", `我 ${formatNumber(metrics.rounds.self)} · bc ${formatNumber(metrics.rounds.other)}`, "分别统计我和 bc 作为发送者的表达轮次数量。"),
        item("balance", "双方平衡", balance, "发送量较少的一方 ÷ 发送量较多的一方；结果四舍五入到百分比整数。"),
      ],
    },
    {
      key: "response",
      title: "回应与沉默",
      note: "回应只看同一会话内的对向轮次，不把跨天或跨会话等待混入回应速度。",
      items: [
        item("responseSamples", "回复样本数", `我→bc ${formatNumber(metrics.response.selfToOtherSampleCount)} · bc→我 ${formatNumber(metrics.response.otherToSelfSampleCount)}`, "相邻表达轮次发送者发生变化，且两轮之间不超过 45 分钟，记为一次回复样本。"),
        item("responseMedian", "回复速度中位数", `我→bc ${formatMinutes(metrics.response.selfToOtherMedianMinutes)} · bc→我 ${formatMinutes(metrics.response.otherToSelfMedianMinutes)}`, "下一方轮次开始时间减去上一方轮次结束时间，分别取中位数。"),
        item("responseP90", "回复速度 P90", `我→bc ${formatMinutes(metrics.response.selfToOtherP90Minutes)} · bc→我 ${formatMinutes(metrics.response.otherToSelfP90Minutes)}`, "回复时间排序后取 90 分位，用于观察偏慢尾部。"),
        item("silenceMedian", "沉默中位数", formatMinutes(metrics.silence.medianMinutes), `相邻非系统消息间隔大于 ${metrics.sessionGapMinutes} 分钟的时间差取中位数。`),
        item("silenceP90", "沉默 P90", formatMinutes(metrics.silence.p90Minutes), "所有长于会话阈值的相邻消息间隔取 90 分位。"),
        item("silenceLongest", "最长沉默", formatMinutes(metrics.silence.longestMinutes || null), `所有长于 45 分钟的相邻非系统消息间隔中的最大值，扣除每天 ${time.quietHours}；每个区间保留两端原文证据。`),
      ],
    },
    {
      key: "personQuantity",
      title: "单人数量类指标",
      note: `按 ${formatNumber(quantity.coveredDays)} 个覆盖自然日统计；先开口共 ${formatNumber(quantity.openingCount)} 次。`,
      items: [
        item("messageVolume", "消息量", pair(formatNumber(metrics.senderTotals.self), formatNumber(metrics.senderTotals.other)), "按发送者统计非系统消息总量；我和 bc 两方之和等于非系统消息总量。"),
        item("messageShare", "消息量占比", pair(senderShare(metrics.senderTotals.self), senderShare(metrics.senderTotals.other)), "各方消息量 ÷ 非系统消息总量；结果四舍五入到百分比整数。"),
        item("animatedEmojiDailyAverage", "每日动画表情平均数量", pair(`${formatDecimal(quantity.self.animatedEmojiDailyAverage)} 个/日`, `${formatDecimal(quantity.other.animatedEmojiDailyAverage)} 个/日`), "按发送者和自然日统计 [动画表情]，总数 ÷ 覆盖自然日；没有发送的日期按 0 计入。"),
        item("animatedEmojiDailyMax", "每日动画表情最大数量", pair(`${quantity.self.animatedEmojiDailyMax} 个`, `${quantity.other.animatedEmojiDailyMax} 个`), "按发送者统计单日 [动画表情] 数量，取所有覆盖日期中的最大值。"),
        item("imageDailyAverage", "每日图片平均数量", pair(`${formatDecimal(quantity.self.imageDailyAverage)} 张/日`, `${formatDecimal(quantity.other.imageDailyAverage)} 张/日`), "按发送者和自然日统计图片消息，总数 ÷ 覆盖自然日；没有发送的日期按 0 计入。"),
        item("imageDailyMax", "每日图片最大数量", pair(`${quantity.self.imageDailyMax} 张`, `${quantity.other.imageDailyMax} 张`), "按发送者统计单日图片消息数量，取所有覆盖日期中的最大值。"),
        item("messageDailyAverage", "每日聊天信息平均数量", pair(`${formatDecimal(quantity.self.messageDailyAverage)} 条/日`, `${formatDecimal(quantity.other.messageDailyAverage)} 条/日`), "按发送者和自然日统计所有非系统消息，总数 ÷ 覆盖自然日；文字、图片、表情等消息均计入。"),
        item("messageDailyMax", "每日聊天信息最大数量", pair(`${quantity.self.messageDailyMax} 条`, `${quantity.other.messageDailyMax} 条`), "按发送者统计单日所有非系统消息数量，取所有覆盖日期中的最大值。"),
        item("openingShare", "先开口占比", pair(formatRate(quantity.self.initiationShare), formatRate(quantity.other.initiationShare)), `首条消息或与上一条非系统消息间隔超过 ${metrics.time.openingGapMinutes} 分钟时，视为一次新的开口；该方开口次数 ÷ 开口总次数。`),
      ],
    },
    {
      key: "personTime",
      title: "单人时间类指标",
      note: `沉默扣除 ${time.quietHours}；回复从一次先开口后的对向表达轮次开始计算。`,
      items: [
        item("longestSilenceHours", "最长沉默小时数", pair(`${formatDecimal(time.self.longestSilenceHours)} 小时`, `${formatDecimal(time.other.longestSilenceHours)} 小时`), `相邻非系统消息之间的间隔减去每天 ${time.quietHours} 的重叠时间，并按沉默后重新发言的一方归属。`),
        item("replySpeedAverageMinutes", "回复速度平均值", pair(time.self.replySpeedAverageMinutes == null ? "—" : `${formatDecimal(time.self.replySpeedAverageMinutes)} 分钟`, time.other.replySpeedAverageMinutes == null ? "—" : `${formatDecimal(time.other.replySpeedAverageMinutes)} 分钟`), `先确定一次新的开口，之后只有发送者发生变化的对向轮次才算回复；平均值样本数为我 ${time.self.replySampleCount}、bc ${time.other.replySampleCount}。`),
      ],
    },
    {
      key: "rhythm",
      title: "时间节奏",
      note: "所有时间桶使用 Asia/Shanghai 本地时间。",
      items: [
        item("dailyTrend", "每日趋势", `${formatNumber(metrics.dailyTrend.length)} 个日期桶`, "按自然日统计消息总数、双方消息数和会话数；点击柱体可回到该日原文。"),
        item("weeklyTrend", "每周趋势", `${formatNumber(metrics.weeklyTrend.length)} 个周桶`, "按周一作为周起点统计消息量、活跃日、双方共同活跃日、会话数和发起方。"),
        item("hourlyActivity", "24 小时分布", "24 个小时桶", "按消息发生的本地小时统计总量及双方数量。"),
        item("weekdayHourlyActivity", "星期 × 小时", "7 × 24 个桶", "按星期一至星期日和 0 至 23 点交叉统计消息密度，用于热力图展示。"),
      ],
    },
    {
      key: "topics",
      title: "话题与关系温度",
      note: "这是可解释的统计层，不等同于 AI 语义结论。",
      items: [
        item("topics", "高频话题", `${formatNumber(metrics.topics.length)} 个词项`, "只处理文字消息，用中文连续片段或英文单词切词；去除预设停用词，保留前 24 个高频词，并保存最多 5 条原文证据。"),
        item("temperature", "关系温度基线", `${formatNumber(metrics.temperatureTrend.length)} 个周点`, "周温度 = 1 + 4 ×（消息量 35% + 发送平衡 25% + 双方共同活跃日 20% + 回应速度 20%）；结果为 1–5 的相对分数。"),
        item("temperatureResponse", "温度中的回应速度", "1 ÷（1 + 周回应中位数 ÷ 720）", "回应越快，该项越接近 1；没有周回应样本时使用 180 分钟作为基准。"),
        item("evidence", "原文证据", "最多 5 条 / 指标项", "指标保留消息 ID，页面通过聊天阅读器的搜索参数定位对应原文；证据链接不改变指标结果。"),
      ],
    },
  ];
}

import Link from "next/link";

import type { RelationAnalysisView } from "@/components/relation/analysis-tabs";
import { chatPageFromMessageId } from "@/lib/relation/chat-pagination";
import type { RelationMetricLedgerEntry } from "@/lib/relation/metric-ledger";
import type { ChatMessageKind, RelationMetrics, RelationSessionMetric } from "@/lib/relation/types";

const kindLabels: Record<ChatMessageKind, string> = { text: "文字", image: "图片", voice: "语音", video: "视频", emoji: "表情", system: "系统", location: "位置", card: "名片", voip: "通话", other: "其他" };
const weekdayLabels = ["一", "二", "三", "四", "五", "六", "日"];
const SILENCE_DISPLAY_MAX_MINUTES = 30 * 60;

function displaySilenceSegments(metrics: RelationMetrics) {
  return metrics.silence.segments.filter((segment) => segment.minutes <= SILENCE_DISPLAY_MAX_MINUTES);
}

function formatMinutes(value: number | null) {
  if (value == null) return "—";
  if (value < 60) return `${value} 分钟`;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours} 小时 ${minutes} 分` : `${hours} 小时`;
}

function formatNumber(value: number) {
  return value.toLocaleString("zh-CN");
}

function formatPercent(value: number | null) {
  return value == null ? "—" : `${value}%`;
}

function evidenceHref(personId: string, id: string) {
  return `/relation/chat/${personId}?page=${chatPageFromMessageId(id)}#${id}`;
}

function EvidenceLinks({ personId, ids }: { personId: string; ids: string[] }) {
  if (!ids.length) return <span className="relation-evidence-empty">暂无原文证据</span>;
  return <span className="relation-evidence-links">{ids.slice(0, 3).map((id) => <Link key={id} href={evidenceHref(personId, id)}>原文 {id.replace("msg-", "#")}</Link>)}</span>;
}

type LedgerMetricLink = Pick<RelationMetricLedgerEntry, "id" | "name">;

function ledgerMetricRows<T extends { label: string }>(ledger: LedgerMetricLink[], rows: T[]) {
  return rows.flatMap((row) => {
    const entry = ledger.find((item) => item.name === row.label);
    return entry ? [{ ...row, ledgerId: entry.id }] : [];
  });
}

function MetricNameLink({ personId, metricId, name }: { personId: string; metricId: string; name: string }) {
  return <Link className="relation-metric-name-link" href={`/relation/analysis/${personId}?view=ledger&metric=${encodeURIComponent(metricId)}#metric-ledger-${metricId}`} title="查看指标台账中的计算口径">{name}</Link>;
}

function RequiredMetricGroup({ personId, rows }: { personId: string; rows: { label: string; self: string; other: string; ledgerId: string }[] }) {
  return <section className="relation-required-metrics"><div className="relation-required-metrics-head relation-required-metrics-head--columns-only"><div className="relation-required-metrics-columns"><span>我</span><span>bc</span></div></div><div className="relation-required-metrics-body">{rows.map((row) => <div key={row.label} className="relation-required-metric-row"><div><strong><MetricNameLink personId={personId} metricId={row.ledgerId} name={row.label} /></strong></div><b>{row.self}</b><b>{row.other}</b></div>)}</div></section>;
}

function SingleMetricGroup({ personId, rows }: { personId: string; rows: { label: string; value: string; ledgerId: string }[] }) {
  return <section className="relation-required-metrics relation-required-metrics--single-column"><div className="relation-required-metrics-head relation-required-metrics-head--columns-only" aria-hidden="true" /><div className="relation-required-metrics-body">{rows.map((row) => <div key={row.label} className="relation-required-metric-row relation-required-metric-row--single"><div><strong><MetricNameLink personId={personId} metricId={row.ledgerId} name={row.label} /></strong></div><b>{row.value}</b></div>)}</div></section>;
}

function ComparisonMetricsBox({ personId, rows }: { personId: string; rows: { label: string; self: string; other: string; ledgerId: string }[] }) {
  return <section className="relation-required-metrics relation-required-metrics--unified" aria-label="我与 bc 的对比指标"><div className="relation-required-metrics-head relation-required-metrics-head--columns-only"><div className="relation-required-metrics-columns"><span>我</span><span>bc</span></div></div><div className="relation-required-metrics-body">{rows.map((row) => <div key={row.label} className="relation-required-metric-row"><div><strong><MetricNameLink personId={personId} metricId={row.ledgerId} name={row.label} /></strong></div><b>{row.self}</b><b>{row.other}</b></div>)}</div></section>;
}

function WeeklyTrend({ metrics }: { metrics: RelationMetrics }) {
  const points = metrics.weeklyTrend;
  if (!points.length) return <div className="relation-chart-empty">暂无足够趋势数据</div>;
  const max = Math.max(...points.map((point) => Math.max(point.self, point.other)), 1);
  const mid = Math.round(max / 2);
  const toPoints = (key: "self" | "other") => points.map((point, index) => `${(index / Math.max(points.length - 1, 1)) * 100},${92 - (point[key] / max) * 72}`).join(" ");
  return (
    <>
      <div className="relation-trend-chart">
        <div className="relation-trend-y-axis" aria-hidden="true"><span>{max}</span><span>{mid}</span><span>0</span></div>
        <div className="relation-trend-plot">
          <svg className="relation-trend-svg" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="每周双方消息量趋势">
            <path d="M0 20H100M0 56H100M0 92H100" stroke="currentColor" opacity=".16" vectorEffect="non-scaling-stroke" />
            <polyline points={toPoints("self")} fill="none" stroke="#e98268" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
            <polyline points={toPoints("other")} fill="none" stroke="#4f8d78" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>
      <div className="relation-chart-legend"><span><i className="is-self" />我</span><span><i className="is-other" />bc</span></div>
      <div className="relation-chart-labels"><span>{points[0].label.slice(5)}</span><span>{points[Math.floor(points.length / 2)].label.slice(5)}</span><span>{points.at(-1)?.label.slice(5)}</span></div>
    </>
  );
}

function Panel({ title, note, children, wide = false }: { title: string; note?: string; children: React.ReactNode; wide?: boolean }) {
  return <section className={`relation-panel ${wide ? "relation-panel--wide" : ""}`}><div className="relation-panel-heading"><h2>{title}</h2>{note ? <span>{note}</span> : null}</div>{children}</section>;
}

function AnalysisSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="relation-analysis-content-section"><div className="relation-analysis-content-heading"><h2>{title}</h2></div><div className="relation-analysis-content-body">{children}</div></section>;
}

function QuantityView({ metrics, personId, ledger }: { metrics: RelationMetrics; personId: string; ledger: LedgerMetricLink[] }) {
  const reciprocity = metrics.senderTotals.self && metrics.senderTotals.other ? Math.round((Math.min(metrics.senderTotals.self, metrics.senderTotals.other) / Math.max(metrics.senderTotals.self, metrics.senderTotals.other)) * 100) : 0;
  const quantity = metrics.quantity;
  const decimal = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);
  const pairedRows = ledgerMetricRows(ledger, [
    { label: "每日动画表情平均数量", self: `${decimal(quantity.self.animatedEmojiDailyAverage)} 个/日`, other: `${decimal(quantity.other.animatedEmojiDailyAverage)} 个/日` },
    { label: "每日动画表情最大数量", self: `${quantity.self.animatedEmojiDailyMax} 个`, other: `${quantity.other.animatedEmojiDailyMax} 个` },
    { label: "每日图片平均数量", self: `${decimal(quantity.self.imageDailyAverage)} 张/日`, other: `${decimal(quantity.other.imageDailyAverage)} 张/日` },
    { label: "每日图片最大数量", self: `${quantity.self.imageDailyMax} 张`, other: `${quantity.other.imageDailyMax} 张` },
    { label: "每日聊天信息平均数量", self: `${decimal(quantity.self.messageDailyAverage)} 条/日`, other: `${decimal(quantity.other.messageDailyAverage)} 条/日` },
    { label: "每日聊天信息最大数量", self: `${quantity.self.messageDailyMax} 条`, other: `${quantity.other.messageDailyMax} 条` },
    { label: "消息量", self: formatNumber(metrics.senderTotals.self), other: formatNumber(metrics.senderTotals.other) },
    { label: "消息量占比", self: metrics.coverage.nonSystemMessages ? `${Math.round((metrics.senderTotals.self / metrics.coverage.nonSystemMessages) * 100)}%` : "—", other: metrics.coverage.nonSystemMessages ? `${Math.round((metrics.senderTotals.other / metrics.coverage.nonSystemMessages) * 100)}%` : "—" },
    { label: "先开口占比", self: formatPercent(quantity.self.initiationShare), other: formatPercent(quantity.other.initiationShare) },
    { label: "会话发起数量", self: formatNumber(metrics.initiation.self), other: formatNumber(metrics.initiation.other) },
    { label: "会话发起占比", self: formatPercent(metrics.initiation.selfRate), other: formatPercent(metrics.initiation.otherRate) },
  ]);
  const overviewRows = ledgerMetricRows(ledger, [
    { label: "消息总量", value: formatNumber(metrics.totalMessages) },
    { label: "活跃日", value: formatNumber(metrics.coverage.activeDays) },
    { label: "会话", value: formatNumber(metrics.sessions.length) },
    { label: "双向会话", value: formatNumber(metrics.initiation.bidirectional) },
    { label: "表达轮次", value: formatNumber(metrics.rounds.total) },
    { label: "双方平衡", value: `${reciprocity}%` },
    { label: "时间范围", value: `${metrics.coverage.start || "—"} — ${metrics.coverage.end || "—"}` },
    { label: "覆盖自然日", value: `${formatNumber(metrics.coverage.coveredDays)} 天` },
    { label: "文字消息", value: `${formatNumber(metrics.content.textMessages)} 条` },
    { label: "文字字符", value: `${formatNumber(metrics.content.textChars)} 个` },
    { label: "媒体消息占比", value: formatPercent(Math.round(metrics.content.mediaRate * 100)) },
    { label: "最长沉默", value: formatMinutes(metrics.silence.longestMinutes || null) },
  ]);
  return (
    <div className="relation-analysis-view">
      <AnalysisSection title="文字展示">
        <div className="relation-analysis-grid relation-quantity-text-grid">
          <RequiredMetricGroup personId={personId} rows={pairedRows} />
          <SingleMetricGroup personId={personId} rows={overviewRows} />
        </div>
      </AnalysisSection>

      <AnalysisSection title="图展示">
        <div className="relation-analysis-grid">
          <DailyActivityPanel metrics={metrics} personId={personId} />
        </div>
        <div className="relation-analysis-grid">
          <Panel title="每周对话密度" note="双方消息量"><WeeklyTrend metrics={metrics} /></Panel>
          <Panel title="关系温度基线" note="互动活跃度参考">
            <div className="relation-temperature-row">{metrics.temperatureTrend.map((point) => <div key={point.label}><span>{point.label.slice(5)}</span><i style={{ height: `${Math.max(12, point.score * 16)}%` }} /><strong>{point.score.toFixed(1)}</strong></div>)}</div>
          </Panel>
        </div>
        <ContentChartPanels metrics={metrics} />
      </AnalysisSection>
    </div>
  );
}

function DailyActivityPanel({ metrics, personId }: { metrics: RelationMetrics; personId: string }) {
  const maxDay = Math.max(...metrics.dailyTrend.map((point) => point.total), 1);
  return (
    <Panel title="每日活跃轨迹" note="自然日消息量" wide>
      <div className="relation-daily-bars">{metrics.dailyTrend.map((point) => <Link key={point.day} href={`/relation/chat/${personId}?start=${point.day}&end=${point.day}`} className="relation-daily-bar" title={`${point.day} · ${point.total} 条`}><i style={{ height: `${Math.max(4, (point.total / maxDay) * 100)}%` }} /><span>{point.day.slice(5)}</span></Link>)}</div>
    </Panel>
  );
}

function TimeChartPanels({ metrics }: { metrics: RelationMetrics }) {
  const maxHour = Math.max(...metrics.hourlyActivity.map((point) => point.total), 1);
  const maxHeat = Math.max(...metrics.weekdayHourlyActivity.map((point) => point.total), 1);
  return (
    <div className="relation-analysis-grid">
      <Panel title="星期 × 小时" note="消息密度热力图" wide>
        <div className="relation-weekday-scroll"><div className="relation-weekday-labels"><span />{Array.from({ length: 24 }, (_, hour) => <span key={hour}>{hour % 3 === 0 ? String(hour).padStart(2, "0") : ""}</span>)}</div>
        <div className="relation-weekday-heatmap">{weekdayLabels.map((day, weekdayIndex) => <div key={day} className="relation-weekday-row"><b>周{day}</b>{metrics.weekdayHourlyActivity.filter((point) => point.weekday === weekdayIndex + 1).map((point) => <span key={`${point.weekday}-${point.hour}`} title={`周${day} ${point.hour}:00 · ${point.total} 条`} style={{ opacity: point.total ? 0.16 + (point.total / maxHeat) * 0.84 : 0.08 }} />)}</div>)}</div></div>
      </Panel>
      <Panel title="24 小时分布" note="消息数量">
        <div className="relation-hour-bars">{metrics.hourlyActivity.map((point) => <div key={point.hour}><span>{String(point.hour).padStart(2, "0")}</span><i style={{ width: `${Math.max(point.total ? 2 : 0, (point.total / maxHour) * 100)}%` }} /><b>{point.total || ""}</b></div>)}</div>
      </Panel>
    </div>
  );
}

function SilencePanel({ metrics, personId }: { metrics: RelationMetrics; personId: string }) {
  const visibleSilence = displaySilenceSegments(metrics);
  return <Panel title="沉默区间">{visibleSilence.length ? <div className="relation-silence-table"><div className="relation-silence-table-head"><span>时长</span><span>时间范围</span><span>证据</span></div>{visibleSilence.slice(0, 8).map((segment) => <div key={`${segment.start}-${segment.end}`} className="relation-silence-table-row"><strong>{formatMinutes(segment.minutes)}</strong><span>{segment.start} → {segment.end}</span><EvidenceLinks personId={personId} ids={segment.evidenceIds} /></div>)}</div> : <div className="relation-empty">没有 30 小时以内的沉默区间。</div>}</Panel>;
}

function InteractionView({ metrics, personId }: { metrics: RelationMetrics; personId: string }) {
  const topSessions = [...metrics.sessions].sort((left, right) => right.messageCount - left.messageCount).slice(0, 8);
  return (
    <Panel title="密集区间">
      <div className="relation-session-table"><div className="relation-session-table-head"><span>时间</span><span>发起</span><span>消息</span><span>轮次</span><span>证据</span></div>{topSessions.map((session) => <SessionRow key={session.id} session={session} personId={personId} />)}</div>
    </Panel>
  );
}

function TimeView({ metrics, personId, ledger }: { metrics: RelationMetrics; personId: string; ledger: LedgerMetricLink[] }) {
  const time = metrics.time;
  const decimal = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);
  const timeRows = ledgerMetricRows(ledger, [
    { label: "最长沉默小时数", self: `${decimal(time.self.longestSilenceHours)} 小时`, other: `${decimal(time.other.longestSilenceHours)} 小时` },
    { label: "回复速度平均值", self: time.self.replySpeedAverageMinutes == null ? "—" : `${decimal(time.self.replySpeedAverageMinutes)} 分钟`, other: time.other.replySpeedAverageMinutes == null ? "—" : `${decimal(time.other.replySpeedAverageMinutes)} 分钟` },
    { label: "回复速度中位数", self: formatMinutes(metrics.response.selfToOtherMedianMinutes), other: formatMinutes(metrics.response.otherToSelfMedianMinutes) },
    { label: "回复速度 P90", self: formatMinutes(metrics.response.selfToOtherP90Minutes), other: formatMinutes(metrics.response.otherToSelfP90Minutes) },
    { label: "回复样本数", self: `${metrics.response.selfToOtherSampleCount} 个`, other: `${metrics.response.otherToSelfSampleCount} 个` },
    { label: "总轮次（合计）", self: formatNumber(metrics.rounds.total), other: "—" },
    { label: "轮次数量", self: formatNumber(metrics.rounds.self), other: formatNumber(metrics.rounds.other) },
    { label: "每轮消息中位", self: `${metrics.rounds.medianMessages ?? "—"} 条`, other: `${metrics.rounds.medianMessages ?? "—"} 条` },
    { label: "每轮文字中位", self: `${metrics.rounds.medianTextChars ?? "—"} 字`, other: `${metrics.rounds.medianTextChars ?? "—"} 字` },
  ]);
  return (
    <div className="relation-analysis-view">
      <AnalysisSection title="文字展示">
        <div className="relation-required-metrics-grid">
          <ComparisonMetricsBox personId={personId} rows={timeRows} />
        </div>
        <div className="relation-analysis-grid">
          <SilencePanel metrics={metrics} personId={personId} />
          <InteractionView metrics={metrics} personId={personId} />
        </div>
        <AIAnalysisLink personId={personId} />
      </AnalysisSection>
      <AnalysisSection title="图展示">
        <TimeChartPanels metrics={metrics} />
      </AnalysisSection>
    </div>
  );
}

function SessionRow({ session, personId }: { session: RelationSessionMetric; personId: string }) {
  return <div className="relation-session-table-row"><span>{session.start.slice(0, 16)}<small> → {session.end.slice(11, 16)}</small></span><span>{session.initiator === "self" ? "我" : "bc"}</span><strong>{session.messageCount}</strong><span>{session.roundCount}</span><EvidenceLinks personId={personId} ids={session.evidenceIds} /></div>;
}

function ContentChartPanels({ metrics }: { metrics: RelationMetrics }) {
  const typeEntries = Object.entries(metrics.typeCounts) as [ChatMessageKind, number][];
  const maxType = Math.max(...typeEntries.map(([, count]) => count), 1);
  return <div className="relation-analysis-grid">
    <Panel title="消息类型" note="非系统消息结构">
      <div className="relation-type-bars">{typeEntries.filter(([, count]) => count > 0).map(([kind, count]) => <div key={kind}><span>{kindLabels[kind]}</span><i style={{ width: `${Math.max(3, (count / maxType) * 100)}%` }} /><b>{count}</b></div>)}</div>
    </Panel>
  </div>;
}

function AIAnalysisLink({ personId }: { personId: string }) {
  return <section className="relation-analysis-next"><div><h2>语义事件还在 AI 分析层</h2><p>分歧、修复、支持、邀请和共同计划需要上下文语义判断。完成数据分析后，可进入 AI 分析生成带证据的事件观察。</p></div><Link href={`/relation/analysis/${personId}/ai`} className="relation-action relation-action--dark">进入 AI 分析</Link></section>;
}

export function MetricsDashboard({ metrics, personId, ledger, view = "quantity" }: { metrics: RelationMetrics; personId: string; ledger: LedgerMetricLink[]; view?: RelationAnalysisView }) {
  if (view === "time") return <TimeView metrics={metrics} personId={personId} ledger={ledger} />;
  return <QuantityView metrics={metrics} personId={personId} ledger={ledger} />;
}

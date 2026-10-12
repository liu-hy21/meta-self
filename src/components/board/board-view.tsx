import Link from "next/link";
import { Suspense } from "react";

import { loadBoardAdvice } from "@/lib/board/advice";
import { formatBoardTime, type BoardMetric, type BoardSnapshot, type RangeTrack } from "@/lib/board/snapshot";
import { submitClass } from "@/components/ui/form-shell";

export function BoardView({ snapshot }: { snapshot: BoardSnapshot }) {
  const body = snapshot.metrics.filter((metric) => metric.group === "身体");
  const sleep = snapshot.metrics.filter((metric) => metric.group === "睡眠");
  const exam = snapshot.metrics.filter((metric) => metric.group === "体检");
  const mindMetrics = snapshot.metrics.filter((metric) => metric.group === "心态");
  const hasTop =
    body.length > 0 ||
    sleep.length > 0 ||
    snapshot.foods.length > 0 ||
    snapshot.mind != null ||
    snapshot.work != null ||
    snapshot.relation != null ||
    snapshot.finance != null ||
    snapshot.play != null;

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-6 py-5">
      <div className="flex justify-end">
        <a href="/api/context-export" className={submitClass()}>
          上下文导出
        </a>
      </div>
      {hasTop ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {body.length > 0 ? <Column title="身体" metrics={body} /> : null}
          {sleep.length > 0 ? <Column title="睡眠" metrics={sleep} /> : null}
          {snapshot.foods.length > 0 ? (
            <section className="pixel-box p-4">
              <h2 className="text-sm font-semibold">饮食</h2>
              <div className="mt-3 space-y-3">
                {snapshot.foods.map((food) => (
                  <div key={food.label}>
                    <Link href={food.href} className="text-xs text-[var(--muted)] hover:underline">
                      {food.label}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {food.items.map((item) => (
                        <span key={item} className="border-2 border-[var(--ink)] bg-[var(--panel)] px-2 py-1 text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-[var(--muted)]">档案 · {formatBoardTime(snapshot.foods[0].recordedAt)}</p>
            </section>
          ) : null}
        </div>
      ) : (
        <p className="pixel-box px-4 py-3 text-sm text-[var(--muted)]">档案里还没有可对照的数字或常吃食物。</p>
      )}

      {exam.length > 0 ? <Column title="体检" metrics={exam} wide /> : null}

      {snapshot.mind ? (
        <section className="pixel-box p-4">
          <h2 className="text-sm font-semibold">心态</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {mindMetrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
            {snapshot.mind.emotionWords.length > 0 ? (
              <Link href="/mind/profile?edit=emotion" className="block border-2 border-[var(--ink)] bg-[var(--panel)] px-3 py-2">
                <p className="text-xs text-[var(--muted)]">常见情绪</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {snapshot.mind.emotionWords.map((word) => (
                    <span key={word} className="border-2 border-[var(--ink)] px-2 py-1 text-sm">
                      {word}
                    </span>
                  ))}
                </div>
              </Link>
            ) : null}
            {snapshot.mind.psycheNote ? (
              <Link href="/mind/profile?edit=psyche" className="block border-2 border-[var(--ink)] bg-[var(--panel)] px-3 py-2">
                <p className="text-xs text-[var(--muted)]">当前状态</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{snapshot.mind.psycheNote}</p>
              </Link>
            ) : null}
            {snapshot.mind.stressNote ? (
              <Link href="/mind/profile?edit=psyche" className="block border-2 border-[var(--ink)] bg-[var(--panel)] px-3 py-2">
                <p className="text-xs text-[var(--muted)]">主要压力</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{snapshot.mind.stressNote}</p>
              </Link>
            ) : null}
          </div>
          <p className="mt-3 text-[11px] text-[var(--muted)]">档案 · {formatBoardTime(snapshot.mind.recordedAt)}</p>
        </section>
      ) : null}

      {snapshot.work ? (
        <section className="pixel-box p-4">
          <h2 className="text-sm font-semibold">工作</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {snapshot.work.companyName ? (
              <Link href="/work/profile?edit=company" className="block border-2 border-[var(--ink)] bg-[var(--panel)] px-3 py-2">
                <p className="text-xs text-[var(--muted)]">公司</p>
                <p className="mt-1 text-sm">{snapshot.work.companyName}</p>
              </Link>
            ) : null}
            {snapshot.work.department ? (
              <Link href="/work/profile?edit=company" className="block border-2 border-[var(--ink)] bg-[var(--panel)] px-3 py-2">
                <p className="text-xs text-[var(--muted)]">部门</p>
                <p className="mt-1 text-sm">{snapshot.work.department}</p>
              </Link>
            ) : null}
            {snapshot.work.role ? (
              <Link href="/work/profile?edit=company" className="block border-2 border-[var(--ink)] bg-[var(--panel)] px-3 py-2">
                <p className="text-xs text-[var(--muted)]">角色</p>
                <p className="mt-1 text-sm">{snapshot.work.role}</p>
              </Link>
            ) : null}
            {snapshot.work.joinedOn ? (
              <Link href="/work/profile?edit=company" className="block border-2 border-[var(--ink)] bg-[var(--panel)] px-3 py-2">
                <p className="text-xs text-[var(--muted)]">入职时间</p>
                <p className="mt-1 text-sm">{snapshot.work.joinedOn}</p>
              </Link>
            ) : null}
            {(
              [
                ["会", snapshot.work.proficient],
                ["在学", snapshot.work.learning],
                ["不用了", snapshot.work.retired],
              ] as const
            ).map(([label, items]) =>
              items.length > 0 ? (
                <Link key={label} href="/work/profile?edit=stack" className="block border-2 border-[var(--ink)] bg-[var(--panel)] px-3 py-2">
                  <p className="text-xs text-[var(--muted)]">{label}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {items.map((item) => (
                      <span key={item} className="border-2 border-[var(--ink)] px-2 py-1 text-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </Link>
              ) : null,
            )}
            {snapshot.work.studyHistory ? (
              <Link href="/work/profile?edit=study" className="block border-2 border-[var(--ink)] bg-[var(--panel)] px-3 py-2 sm:col-span-2">
                <p className="text-xs text-[var(--muted)]">学习经历</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{snapshot.work.studyHistory}</p>
              </Link>
            ) : null}
          </div>
          <p className="mt-3 text-[11px] text-[var(--muted)]">档案 · {formatBoardTime(snapshot.work.recordedAt)}</p>
        </section>
      ) : null}

      {snapshot.relation ? (
        <section className="pixel-box p-4">
          <h2 className="text-sm font-semibold">关系</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["友", snapshot.relation.friends],
                ["爱", snapshot.relation.romance],
                ["亲", snapshot.relation.family],
                ["其他", snapshot.relation.other],
              ] as const
            ).map(([label, items]) =>
              items.length > 0 ? (
                <Link key={label} href="/relation/profile?edit=1" className="block border-2 border-[var(--ink)] bg-[var(--panel)] px-3 py-2">
                  <p className="text-xs text-[var(--muted)]">{label}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {items.map((item) => (
                      <span key={item} className="border-2 border-[var(--ink)] px-2 py-1 text-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </Link>
              ) : null,
            )}
          </div>
          <p className="mt-3 text-[11px] text-[var(--muted)]">档案 · {formatBoardTime(snapshot.relation.recordedAt)}</p>
        </section>
      ) : null}

      {snapshot.finance || snapshot.play ? (
        <section className="pixel-box p-4">
          <h2 className="text-sm font-semibold">玩转</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["现金", snapshot.finance?.cashCents],
                ["投资", snapshot.finance?.investmentCents],
                ["负债", snapshot.finance?.liabilityCents],
              ] as const
            ).map(([label, cents]) =>
              cents != null ? (
                <Link key={label} href="/finance/profile?edit=1" className="block border-2 border-[var(--ink)] bg-[var(--panel)] px-3 py-2">
                  <p className="text-xs text-[var(--muted)]">{label}</p>
                  <p className="mt-1 text-sm">{yuanText(cents)}</p>
                </Link>
              ) : null,
            )}
            {snapshot.finance?.cashCents != null && snapshot.finance.investmentCents != null && snapshot.finance.liabilityCents != null ? (
              <Link href="/finance/profile?edit=1" className="block border-2 border-[var(--ink)] bg-[var(--panel)] px-3 py-2">
                <p className="text-xs text-[var(--muted)]">净资产</p>
                <p className="mt-1 text-sm">{yuanText(snapshot.finance.cashCents + snapshot.finance.investmentCents - snapshot.finance.liabilityCents)}</p>
              </Link>
            ) : null}
            {(
              [
                ["旅游", snapshot.play?.travel, "travel"],
                ["各个地点", snapshot.play?.districts, "districts"],
              ] as const
            ).map(([label, text, key]) =>
              text ? (
                <Link key={key} href={`/finance/profile?tab=play&edit=${key}`} className="block border-2 border-[var(--ink)] bg-[var(--panel)] px-3 py-2 sm:col-span-2">
                  <p className="text-xs text-[var(--muted)]">{label}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{text}</p>
                </Link>
              ) : null,
            )}
          </div>
          <p className="mt-3 text-[11px] text-[var(--muted)]">
            档案 · {formatBoardTime((snapshot.finance?.recordedAt ?? snapshot.play?.recordedAt)!)}
          </p>
        </section>
      ) : null}

      <Suspense fallback={<AdviceShell>建议生成中</AdviceShell>}>
        <Advice snapshot={snapshot} />
      </Suspense>
    </div>
  );
}

function yuanText(cents: number) {
  return `${(cents / 100).toLocaleString("zh-CN", { maximumFractionDigits: 2 })} 元`;
}

function Column({ title, metrics, wide }: { title: string; metrics: BoardMetric[]; wide?: boolean }) {
  return (
    <section className="pixel-box p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className={wide ? "mt-3 grid gap-3 sm:grid-cols-2" : "mt-3 space-y-3"}>
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    </section>
  );
}

function MetricCard({ metric }: { metric: BoardMetric }) {
  return (
    <Link href={metric.href} className="block border-2 border-[var(--ink)] bg-[var(--panel)] px-3 py-2">
      <p className="text-xs text-[var(--muted)]">{metric.label}</p>
      <p className="mt-1 text-sm text-[var(--gold-deep)]">
        {metric.value} {metric.unit}
      </p>
      <p className="mt-0.5 text-[11px] text-[var(--muted)]">
        {metric.sourceLabel} · {formatBoardTime(metric.recordedAt)}
      </p>
      {metric.track ? <Track track={metric.track} value={metric.value} /> : null}
    </Link>
  );
}

function Track({ track, value }: { track: RangeTrack; value: number }) {
  const span = track.max - track.min;
  const percent = (point: number) => Math.min(100, Math.max(0, ((point - track.min) / span) * 100));
  return (
    <div className="mt-2">
      <div className="relative h-6 border-2 border-[var(--ink)] bg-[var(--bg)]">
        <div
          className="absolute top-0 bottom-0 bg-[#f3e6cc]"
          style={{ left: `${percent(track.low)}%`, width: `${percent(track.high) - percent(track.low)}%` }}
        />
        <div className="absolute top-0 bottom-0 w-0.5 bg-[var(--ink)]" style={{ left: `${percent(value)}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-[var(--muted)]">{track.source}</p>
    </div>
  );
}

function AdviceShell({ children }: { children: React.ReactNode }) {
  return <section className="border-2 border-[var(--gold-deep)] bg-[var(--panel)] px-4 py-3 text-sm">{children}</section>;
}

async function Advice({ snapshot }: { snapshot: BoardSnapshot }) {
  if (!process.env.DEEPSEEK_API_KEY) return null;
  const items = await loadBoardAdvice(snapshot);
  if (items.length === 0) return null;
  return (
    <AdviceShell>
      <h2 className="text-sm font-semibold">建议</h2>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={`${item.source}-${item.text}`}>
            {item.text}
            <span className="ml-2 text-[11px] text-[var(--gold-deep)]">{item.source}</span>
          </li>
        ))}
      </ul>
    </AdviceShell>
  );
}

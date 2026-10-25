"use client";

import type { BodyExamLog, BodyExamLogImage, BodyMeasureLog, MedicalVisitLog, SleepLog } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  createBodyExamLog,
  createBodyMeasureLog,
  createMedicalVisitLog,
  createSleepLog,
} from "@/app/actions/data";
import { ProfileActionForm } from "@/components/body/profile-action-form";
import { SaveButton } from "@/components/body/save-button";
import { VitalModal } from "@/components/body/vital-modal";
import { bodyExamImageMaxFiles } from "@/lib/body-exam-image";
import type { SnapshotModalKind } from "@/lib/body-snapshot-modal";

type BodyExamLogWithImages = BodyExamLog & { images: BodyExamLogImage[] };

const solid = "vital-btn vital-btn--solid";

export function BodyConsole({
  identity,
  diet,
  heightCm,
  measures,
  exams,
  sleepLogs,
  medicalLogs,
  initialModal,
  defaultExamLogDate,
}: {
  identity: React.ReactNode;
  diet: React.ReactNode;
  heightCm: number | null;
  measures: BodyMeasureLog[];
  exams: BodyExamLogWithImages[];
  sleepLogs: SleepLog[];
  medicalLogs: MedicalVisitLog[];
  initialModal: SnapshotModalKind | null;
  defaultExamLogDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<SnapshotModalKind | null>(null);

  useEffect(() => {
    if (!initialModal) return;
    setOpen(initialModal);
    router.replace("/body/profile", { scroll: false });
  }, [initialModal, router]);

  const close = () => setOpen(null);

  const weights = measures.filter((m) => m.weightKg != null);
  const latestWeight = weights[0]?.weightKg ?? null;
  const prevWeight = weights[1]?.weightKg ?? null;
  const weightDelta = latestWeight != null && prevWeight != null ? round1(latestWeight - prevWeight) : null;
  const bmi = latestWeight != null && heightCm ? round1(latestWeight / (heightCm / 100) ** 2) : null;
  const fat = measures.find((m) => m.bodyFatPct != null)?.bodyFatPct ?? null;
  const recentSleep = sleepLogs.slice(0, 7);
  const sleepAvg = recentSleep.length
    ? round1(recentSleep.reduce((sum, log) => sum + log.durationHours, 0) / recentSleep.length)
    : null;

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="vital-kicker">Body Console · 身体监护台</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">身体档案</h1>
          <p className="vital-dim mt-1 text-sm">固定数据随时修改，快照不定期记一条。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="vital-btn" onClick={() => setOpen("measure")}>
            + 测量
          </button>
          <button type="button" className="vital-btn" onClick={() => setOpen("sleep")}>
            + 睡眠
          </button>
          <button type="button" className="vital-btn" onClick={() => setOpen("exam")}>
            + 体检报告
          </button>
          <button type="button" className="vital-btn" onClick={() => setOpen("medical")}>
            + 看病
          </button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">{identity}</div>
        <div className="vital-panel lg:col-span-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="vital-kicker">02 · Vitals</p>
              <h2 className="vital-title mt-1">核心指标</h2>
            </div>
            <Trace />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Tile
              label="体重"
              value={latestWeight}
              unit="kg"
              note={
                weightDelta == null ? (
                  <span className="vital-faint">暂无对比</span>
                ) : (
                  <span className={weightDelta > 0 ? "vital-amber" : "vital-signal"}>
                    {weightDelta > 0 ? "▲" : weightDelta < 0 ? "▼" : "■"} {Math.abs(weightDelta)} kg
                  </span>
                )
              }
              onClick={() => setOpen("measure")}
            />
            <Tile
              label="BMI"
              value={bmi}
              note={<span className={bmiTone(bmi)}>{bmiLabel(bmi)}</span>}
              onClick={() => setOpen("measure")}
            />
            <Tile
              label="体脂率"
              value={fat}
              unit="%"
              note={<span className="vital-faint">最近一次测量</span>}
              onClick={() => setOpen("measure")}
            />
            <Tile
              label="睡眠 · 7 晚均值"
              value={sleepAvg}
              unit="h"
              note={
                <span className={sleepAvg == null ? "vital-faint" : sleepAvg >= 7 && sleepAvg <= 9 ? "vital-signal" : "vital-amber"}>
                  {sleepAvg == null ? "暂无记录" : sleepAvg >= 7 && sleepAvg <= 9 ? "在 7–9h 区间" : "偏离 7–9h"}
                </span>
              }
              onClick={() => setOpen("sleep")}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <Panel index="03" kicker="Sleep" title="睡眠" className="lg:col-span-7" onRecord={() => setOpen("sleep")}>
          <SleepChart logs={sleepLogs.slice(0, 14).toReversed()} />
          <div className="vital-scroll mt-4">
            {sleepLogs.length === 0 ? (
              <Empty text="还没有睡眠记录。" />
            ) : (
              sleepLogs.map((log) => (
                <div key={log.id} className="vital-row grid-cols-[5.5rem_1fr_auto] text-sm">
                  <span className="vital-mono vital-dim">{shortDay(log.logDate ?? log.occurredAt)}</span>
                  <span className="vital-mono">
                    {log.sleepStart && log.wakeTime ? `${log.sleepStart} → ${log.wakeTime}` : "—"}
                  </span>
                  <span className={`vital-mono ${log.durationHours >= 7 && log.durationHours <= 9 ? "vital-signal" : "vital-amber"}`}>
                    {log.durationHours}h
                  </span>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel index="04" kicker="Measure" title="身体测量" className="lg:col-span-5" onRecord={() => setOpen("measure")}>
          <WeightLine values={weights.slice(0, 20).map((m) => m.weightKg as number).toReversed()} />
          <div className="vital-scroll mt-4">
            {measures.length === 0 ? (
              <Empty text="还没有测量记录。" />
            ) : (
              measures.map((log) => (
                <div key={log.id} className="vital-row grid-cols-[5.5rem_1fr] text-sm">
                  <span className="vital-mono vital-dim">{shortDay(log.logDate)}</span>
                  <span className="vital-mono flex flex-wrap gap-x-4 gap-y-1">
                    {log.weightKg != null ? <span>{log.weightKg}<small className="vital-faint"> kg</small></span> : null}
                    {log.bodyFatPct != null ? <span>{log.bodyFatPct}<small className="vital-faint"> %</small></span> : null}
                    {log.chestCm != null ? <span><small className="vital-faint">胸 </small>{log.chestCm}</span> : null}
                    {log.waistCm != null ? <span><small className="vital-faint">腰 </small>{log.waistCm}</span> : null}
                    {log.thighCm != null ? <span><small className="vital-faint">腿 </small>{log.thighCm}</span> : null}
                  </span>
                </div>
              ))
            )}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <Panel
          index="05"
          kicker="Lab Reports"
          title="体检报告"
          tone="amber"
          className="lg:col-span-7"
          onRecord={() => setOpen("exam")}
          recordLabel="上传报告"
        >
          {exams.length === 0 ? (
            <Empty text="还没有体检报告。上传报告照片即可归档。" />
          ) : (
            <div className="vital-scroll space-y-5">
              {exams.map((log) => (
                <div key={log.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="vital-mono text-sm">{fullDay(log.logDate)}</span>
                    <span className="vital-mono vital-faint text-xs">{log.images.length} 张</span>
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {log.images.map((image) => (
                      <li key={image.id}>
                        <a
                          href={`/api/body/exam-images/${image.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={image.originalName}
                          className="block overflow-hidden rounded border border-[var(--v-line-strong)] transition-colors hover:border-[var(--v-amber)]"
                        >
                          <img
                            src={`/api/body/exam-images/${image.id}`}
                            alt={image.originalName}
                            width={96}
                            height={96}
                            loading="lazy"
                            className="size-24 object-cover"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          index="06"
          kicker="Clinic Visits"
          title="看病"
          tone="coral"
          className="lg:col-span-5"
          onRecord={() => setOpen("medical")}
        >
          {medicalLogs.length === 0 ? (
            <Empty text="还没有看病记录。" />
          ) : (
            <ol className="vital-scroll relative ml-1.5 border-l border-[var(--v-line-strong)] pl-5">
              {medicalLogs.map((visit) => (
                <li key={visit.id} className="relative pb-5 last:pb-0">
                  <span className="absolute -left-[1.6rem] top-1.5 size-2.5 rounded-full border-2 border-[var(--v-coral)] bg-[var(--v-bg)]" />
                  <p className="vital-mono vital-dim text-xs">{fullDay(visit.visitedOn)}</p>
                  <p className="mt-1 text-sm font-medium">
                    {[visit.hospital, visit.department].filter(Boolean).join(" · ") || "未填医院"}
                  </p>
                  {visit.note ? <p className="vital-dim mt-1 whitespace-pre-wrap text-sm">{visit.note}</p> : null}
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </section>

      {diet}

      <VitalModal open={open === "measure"} kicker="Measure · 当天" title="记一条身体测量" onClose={close}>
        <ProfileActionForm action={createBodyMeasureLog} afterSuccess="refresh" onSuccess={close} className="grid gap-4 sm:grid-cols-2">
          <NumberField id="weightKg" label="体重 (kg)" />
          <NumberField id="bodyFatPct" label="体脂率 (%)" />
          <NumberField id="chestCm" label="胸围 (cm)" />
          <NumberField id="waistCm" label="腰围 (cm)" />
          <NumberField id="thighCm" label="腿围 (cm)" />
          <ModalFoot note="日期按保存当天记录" />
        </ProfileActionForm>
      </VitalModal>

      <VitalModal open={open === "exam"} kicker="Lab Report" title="上传体检报告" onClose={close}>
        <ProfileActionForm
          action={createBodyExamLog}
          afterSuccess="refresh"
          onSuccess={close}
          encType="multipart/form-data"
          className="grid gap-4"
        >
          <label>
            体检日期
            <input name="logDate" type="date" required defaultValue={defaultExamLogDate} />
          </label>
          <label>
            报告图片
            <input name="images" type="file" accept="image/*" multiple required />
          </label>
          <ModalFoot note={`可多选，最多 ${bodyExamImageMaxFiles()} 张，单张 ≤ 25MB`} />
        </ProfileActionForm>
      </VitalModal>

      <VitalModal open={open === "sleep"} kicker="Sleep · 当天" title="记一条睡眠" onClose={close}>
        <ProfileActionForm action={createSleepLog} afterSuccess="refresh" onSuccess={close} className="grid gap-4 sm:grid-cols-2">
          <label>
            开始睡觉
            <input name="sleepStart" type="time" required />
          </label>
          <label>
            醒来
            <input name="wakeTime" type="time" required />
          </label>
          <ModalFoot note="日期按保存当天记录" />
        </ProfileActionForm>
      </VitalModal>

      <VitalModal open={open === "medical"} kicker="Clinic · 当天" title="记一条看病" onClose={close}>
        <ProfileActionForm action={createMedicalVisitLog} afterSuccess="refresh" onSuccess={close} className="grid gap-4 sm:grid-cols-2">
          <label>
            医院
            <input name="hospital" />
          </label>
          <label>
            科室
            <input name="department" />
          </label>
          <label className="sm:col-span-2">
            记录
            <textarea name="note" rows={4} placeholder="症状、诊断、用药、医嘱" />
          </label>
          <ModalFoot note="日期按保存当天记录" />
        </ProfileActionForm>
      </VitalModal>
    </>
  );
}

function Panel({
  index,
  kicker,
  title,
  tone,
  className,
  onRecord,
  recordLabel = "记一条",
  children,
}: {
  index: string;
  kicker: string;
  title: string;
  tone?: "amber" | "coral";
  className?: string;
  onRecord: () => void;
  recordLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`vital-panel ${className ?? ""}`} data-tone={tone}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="vital-kicker">
            {index} · {kicker}
          </p>
          <h2 className="vital-title mt-1">{title}</h2>
        </div>
        <button type="button" className="vital-btn" onClick={onRecord}>
          {recordLabel}
        </button>
      </div>
      {children}
    </section>
  );
}

function Tile({
  label,
  value,
  unit,
  note,
  onClick,
}: {
  label: string;
  value: number | null;
  unit?: string;
  note: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button type="button" className="vital-tile" onClick={onClick}>
      <span className="vital-dim text-xs">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="vital-num text-3xl sm:text-4xl">{value ?? "—"}</span>
        {unit && value != null ? <span className="vital-dim vital-mono text-sm">{unit}</span> : null}
      </span>
      <span className="vital-mono text-xs">{note}</span>
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="vital-faint py-6 text-center text-sm">{text}</p>;
}

function ModalFoot({ note }: { note: string }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2 sm:col-span-2">
      <span className="vital-faint text-xs">{note}</span>
      <SaveButton className={solid} />
    </div>
  );
}

function NumberField({ id, label }: { id: string; label: string }) {
  return (
    <label htmlFor={id}>
      {label}
      <input id={id} name={id} type="number" step="0.1" min={0} inputMode="decimal" className="vital-mono" />
    </label>
  );
}

function Trace() {
  return (
    <svg viewBox="0 0 160 32" className="h-8 w-40" aria-hidden>
      <path
        className="vital-trace"
        d="M0 16 H46 L52 16 L56 6 L61 27 L66 2 L71 22 L75 16 H112 L116 12 L120 16 H160"
        fill="none"
        stroke="var(--v-signal)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SleepChart({ logs }: { logs: SleepLog[] }) {
  if (logs.length === 0) return null;
  const w = 320;
  const h = 120;
  const max = 12;
  const slot = w / 14;
  const y = (hours: number) => h - (Math.min(hours, max) / max) * h;

  return (
    <figure>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="block h-32 w-full"
        role="img"
        aria-label="最近 14 晚睡眠时长"
      >
        <rect x="0" y={y(9)} width={w} height={y(7) - y(9)} fill="var(--v-signal-soft)" />
        <line x1="0" x2={w} y1={h - 0.5} y2={h - 0.5} stroke="var(--v-line-strong)" />
        {logs.map((log, i) => {
          const good = log.durationHours >= 7 && log.durationHours <= 9;
          const top = y(log.durationHours);
          return (
            <rect
              key={log.id}
              x={i * slot + slot * 0.3}
              y={top}
              width={slot * 0.4}
              height={h - top}
              fill={good ? "var(--v-signal)" : "var(--v-amber)"}
              opacity={0.9}
            />
          );
        })}
      </svg>
      <div className="vital-mono vital-faint mt-1 grid grid-cols-[repeat(14,minmax(0,1fr))] text-center text-[10px]">
        {logs.map((log) => (
          <span key={log.id}>{shortDay(log.logDate ?? log.occurredAt).slice(3)}</span>
        ))}
      </div>
      <figcaption className="vital-faint mt-2 text-xs">绿色带为 7–9 小时参考区间，琥珀色为偏离。</figcaption>
    </figure>
  );
}

function WeightLine({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <p className="vital-faint text-xs">记录两次以上体重后显示趋势。</p>;
  }
  const w = 240;
  const h = 64;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => [(i / (values.length - 1)) * w, h - 6 - ((v - min) / span) * (h - 12)] as const);
  const last = points[points.length - 1];

  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" role="img" aria-label="体重趋势">
        <polyline
          points={points.map(([x, py]) => `${x},${py}`).join(" ")}
          fill="none"
          stroke="var(--v-signal)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx={last[0]} cy={last[1]} r="3" fill="var(--v-signal)" />
      </svg>
      <figcaption className="vital-faint vital-mono mt-1 flex justify-between text-xs">
        <span>min {min}</span>
        <span>max {max}</span>
      </figcaption>
    </figure>
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function bmiLabel(bmi: number | null) {
  if (bmi == null) return "需身高 + 体重";
  if (bmi < 18.5) return "偏瘦 < 18.5";
  if (bmi < 24) return "正常 18.5–24";
  if (bmi < 28) return "超重 24–28";
  return "肥胖 ≥ 28";
}

function bmiTone(bmi: number | null) {
  if (bmi == null) return "vital-faint";
  return bmi >= 18.5 && bmi < 24 ? "vital-signal" : "vital-amber";
}

function shortDay(date: Date) {
  return date.toISOString().slice(5, 10).replace("-", "/");
}

function fullDay(date: Date) {
  return date.toISOString().slice(0, 10).replaceAll("-", ".");
}

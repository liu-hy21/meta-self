import { startOfWeekMondayInTimezone } from "@/lib/dates";

export type ChoresViewMode = "record" | "board";

/** 每周家务：仅当 completedAt 落在当前北京时间周内才算已办 */
export function isWeeklyChoreDone(completedAt: Date | null, now: Date = new Date()): boolean {
  if (!completedAt) return false;
  const weekStart = startOfWeekMondayInTimezone(now);
  return completedAt >= weekStart;
}

export function parseChoresViewMode(raw: string | undefined): ChoresViewMode {
  return raw === "record" ? "record" : "board";
}

export function choresPageQuery(params: { mode?: ChoresViewMode; write?: string; edit?: string }) {
  const q = new URLSearchParams();
  if (params.mode === "record") q.set("mode", "record");
  if (params.write === "1") q.set("write", "1");
  if (params.edit) q.set("edit", params.edit);
  const s = q.toString();
  return s ? `?${s}` : "";
}

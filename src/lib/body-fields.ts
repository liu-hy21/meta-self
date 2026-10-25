export function formatMeasureLine(log: {
  weightKg: number | null;
  bodyFatPct: number | null;
  chestCm: number | null;
  waistCm: number | null;
  thighCm: number | null;
}) {
  const parts: string[] = [];
  if (log.weightKg != null) parts.push(`${log.weightKg} kg`);
  if (log.bodyFatPct != null) parts.push(`体脂 ${log.bodyFatPct}%`);
  if (log.chestCm != null) parts.push(`胸 ${log.chestCm}`);
  if (log.waistCm != null) parts.push(`腰 ${log.waistCm}`);
  if (log.thighCm != null) parts.push(`腿 ${log.thighCm}`);
  return parts.join(" · ") || "已记录";
}

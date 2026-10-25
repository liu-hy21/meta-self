/** 从 HH:mm 计算睡眠时长（小时），跨过午夜时 wake 视为次日 */
export function sleepDurationHours(sleepStart: string, wakeTime: string): number {
  const [sh, sm] = sleepStart.split(":").map((part) => Number(part));
  const [wh, wm] = wakeTime.split(":").map((part) => Number(part));
  if (
    [sh, sm, wh, wm].some((n) => Number.isNaN(n)) ||
    sh < 0 ||
    sh > 23 ||
    wh < 0 ||
    wh > 23 ||
    sm < 0 ||
    sm > 59 ||
    wm < 0 ||
    wm > 59
  ) {
    return 0;
  }
  let startMin = sh * 60 + sm;
  let endMin = wh * 60 + wm;
  if (endMin <= startMin) endMin += 24 * 60;
  return Math.round(((endMin - startMin) / 60) * 10) / 10;
}

export function formatSleepLogLine(log: {
  sleepStart: string | null;
  wakeTime: string | null;
  durationHours: number;
}) {
  if (log.sleepStart && log.wakeTime) {
    return `${log.sleepStart} → ${log.wakeTime} · ${log.durationHours} 小时`;
  }
  return `${log.durationHours} 小时`;
}

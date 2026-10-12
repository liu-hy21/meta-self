const DEFAULT_TZ = process.env.APP_TIMEZONE ?? "Asia/Shanghai";

/** 用户时区下的日历日，归一为 UTC 午夜对应的 Date（仅日期部分入库） */
export function calendarDateInTimezone(
  date: Date = new Date(),
  timeZone: string = DEFAULT_TZ,
): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return new Date(`${parts}T00:00:00.000Z`);
}

export function startOfDayUtcForTimezone(
  date: Date = new Date(),
  timeZone: string = DEFAULT_TZ,
): Date {
  return calendarDateInTimezone(date, timeZone);
}

export function endOfDayUtcForTimezone(
  date: Date = new Date(),
  timeZone: string = DEFAULT_TZ,
): Date {
  const start = calendarDateInTimezone(date, timeZone);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function daysAgo(n: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

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

export function calendarPartsInTimezone(
  date: Date,
  timeZone: string = DEFAULT_TZ,
): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
  };
}

/** 周一为 0，周日为 6 */
export function mondayIndexInTimezone(date: Date, timeZone: string = DEFAULT_TZ): number {
  const short = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  const map: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return map[short] ?? 0;
}

export function addCalendarDays(
  year: number,
  month: number,
  day: number,
  delta: number,
): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(year, month - 1, day + delta));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

/** 该时区日历日 00:00 对应的 UTC 时刻 */
export function startOfCalendarDayInTimezone(
  year: number,
  month: number,
  day: number,
  timeZone: string = DEFAULT_TZ,
): Date {
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${year}-${pad(month)}-${pad(day)}`;
  if (timeZone === "Asia/Shanghai") {
    return new Date(`${dateStr}T00:00:00+08:00`);
  }
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/** 含 date 所在自然周的起始时刻（周一 00:00，默认北京时间） */
export function startOfWeekMondayInTimezone(
  date: Date = new Date(),
  timeZone: string = DEFAULT_TZ,
): Date {
  const { year, month, day } = calendarPartsInTimezone(date, timeZone);
  const monday = addCalendarDays(year, month, day, -mondayIndexInTimezone(date, timeZone));
  return startOfCalendarDayInTimezone(monday.year, monday.month, monday.day, timeZone);
}

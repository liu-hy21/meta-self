const stampOptions: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Shanghai",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

export function logStamp(date: Date) {
  return date.toLocaleString("zh-CN", stampOptions);
}

export function logDay(date: Date) {
  return date.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

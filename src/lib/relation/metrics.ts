import type { ChatMessage, ChatMessageKind, RelationMetrics, RelationRoundMetric, RelationSessionMetric } from "@/lib/relation/types";

const ROUND_GAP_MINUTES = 5;
const SESSION_GAP_MINUTES = 45;
const OPENING_GAP_MINUTES = 120;
const MINUTE = 60_000;
const VERSION = "2026-11-v2" as const;
const STOP_WORDS = new Set(["然后", "但是", "就是", "这个", "那个", "我们", "你们", "可以", "一个", "还是", "已经", "没有", "什么", "感觉", "真的", "哈哈", "好的"]);

function localParts(timestamp: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false }).formatToParts(new Date(timestamp));
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}

function localDateKey(timestamp: number, timeZone: string) {
  const parts = localParts(timestamp, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function localHour(timestamp: number, timeZone: string) {
  return Number(localParts(timestamp, timeZone).hour) % 24;
}

function localWeekday(timestamp: number, timeZone: string) {
  const day = new Date(`${localDateKey(timestamp, timeZone)}T00:00:00Z`).getUTCDay();
  return day || 7;
}

function weekStart(dayKey: string) {
  const date = new Date(`${dayKey}T00:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function coveredDayCount(start: string | null, end: string | null) {
  if (!start || !end) return 0;
  const from = new Date(`${start}T00:00:00Z`).getTime();
  const to = new Date(`${end}T00:00:00Z`).getTime();
  return Math.floor((to - from) / 86_400_000) + 1;
}

function addLocalDays(dayKey: string, amount: number) {
  const date = new Date(`${dayKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function roundToOne(value: number) {
  return Math.round(value * 10) / 10;
}

function quietOverlapMinutes(startTimestamp: number, endTimestamp: number, timeZone: string) {
  if (endTimestamp <= startTimestamp) return 0;
  const startDay = localDateKey(startTimestamp, timeZone);
  const endDay = localDateKey(endTimestamp, timeZone);
  const dayCount = coveredDayCount(startDay, endDay);
  let overlap = 0;
  for (let index = 0; index < dayCount; index += 1) {
    const day = addLocalDays(startDay, index);
    const nextDay = addLocalDays(day, 1);
    const quietStart = Date.parse(`${day}T23:00:00+08:00`);
    const quietEnd = Date.parse(`${nextDay}T07:00:00+08:00`);
    overlap += Math.max(0, Math.min(endTimestamp, quietEnd) - Math.max(startTimestamp, quietStart));
  }
  return Math.round(overlap / MINUTE);
}

function percentile(values: number[], fraction: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return Math.round(sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))]);
}

function median(values: number[]) {
  return percentile(values, 0.5);
}

function average(values: number[]) {
  return values.length ? roundToOne(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

function typeCounts(messages: ChatMessage[]) {
  const kinds: ChatMessageKind[] = ["text", "image", "voice", "video", "emoji", "system", "location", "card", "voip", "other"];
  return Object.fromEntries(kinds.map((kind) => [kind, messages.filter((message) => message.kind === kind).length])) as Record<ChatMessageKind, number>;
}

function topicWords(messages: ChatMessage[]) {
  const counts = new Map<string, { count: number; evidenceIds: string[] }>();
  for (const message of messages.filter((item) => item.kind === "text")) {
    const words = message.text.match(/[\u4e00-\u9fff]{2,8}|[A-Za-z][A-Za-z0-9_-]{2,}/g) ?? [];
    for (const rawWord of words) {
      const word = rawWord.toLocaleLowerCase("zh-CN");
      if (STOP_WORDS.has(word) || word.length < 2) continue;
      const current = counts.get(word) ?? { count: 0, evidenceIds: [] };
      current.count += 1;
      if (current.evidenceIds.length < 5) current.evidenceIds.push(message.id);
      counts.set(word, current);
    }
  }
  return [...counts.entries()].sort(([, left], [, right]) => right.count - left.count).slice(0, 24).map(([word, value]) => ({ word, ...value }));
}

function textLength(message: ChatMessage) {
  return message.kind === "text" ? [...message.text].length : 0;
}

type RoundDraft = RelationRoundMetric & { messageIds: string[] };

function buildRounds(messages: ChatMessage[]) {
  const rounds: RoundDraft[] = [];
  let current: RoundDraft | null = null;
  let previous: ChatMessage | null = null;
  for (const message of messages) {
    const sender = message.isSelf ? "self" : "other";
    const startsNew = !current || !previous || current.sender !== sender || message.timestamp - previous.timestamp > ROUND_GAP_MINUTES * MINUTE;
    if (startsNew) {
      current = { id: `round-${rounds.length + 1}`, start: message.time, end: message.time, sender, messageCount: 0, textChars: 0, evidenceIds: [], messageIds: [] };
      rounds.push(current);
    }
    if (!current) continue;
    current.end = message.time;
    current.messageCount += 1;
    current.textChars += textLength(message);
    current.messageIds.push(message.id);
    if (current.evidenceIds.length < 5) current.evidenceIds.push(message.id);
    previous = message;
  }
  return rounds;
}

function buildSessions(messages: ChatMessage[], roundByMessage: Map<string, string>) {
  const sessions: Array<RelationSessionMetric & { messageIds: string[]; roundIds: string[] }> = [];
  let current: (RelationSessionMetric & { messageIds: string[]; roundIds: string[] }) | null = null;
  let previous: ChatMessage | null = null;
  for (const message of messages) {
    const startsNew = !current || !previous || message.timestamp - previous.timestamp > SESSION_GAP_MINUTES * MINUTE;
    if (startsNew) {
      const initiator = message.isSelf ? "self" : "other";
      current = { id: `session-${sessions.length + 1}`, start: message.time, end: message.time, messageCount: 0, selfCount: 0, otherCount: 0, roundCount: 0, durationMinutes: 0, initiator, bidirectional: false, evidenceIds: [], messageIds: [], roundIds: [] };
      sessions.push(current);
    }
    if (!current) continue;
    current.end = message.time;
    current.messageCount += 1;
    if (message.isSelf) current.selfCount += 1;
    else current.otherCount += 1;
    current.messageIds.push(message.id);
    if (current.evidenceIds.length < 5) current.evidenceIds.push(message.id);
    const roundId = roundByMessage.get(message.id);
    if (roundId && !current.roundIds.includes(roundId)) current.roundIds.push(roundId);
    current.roundCount = current.roundIds.length;
    current.bidirectional = current.selfCount > 0 && current.otherCount > 0;
    current.durationMinutes = Math.max(0, Math.round((message.timestamp - Date.parse(`${current.start.replace(" ", "T")}+08:00`)) / MINUTE));
    previous = message;
  }
  return sessions;
}

export function buildRelationMetrics(messages: ChatMessage[], timeZone = "Asia/Shanghai"): RelationMetrics {
  const sorted = [...messages].sort((left, right) => left.timestamp - right.timestamp || left.index - right.index);
  const systemMessages = sorted.filter((message) => message.kind === "system");
  const conversational = sorted.filter((message) => message.kind !== "system");
  const start = conversational[0] ? localDateKey(conversational[0].timestamp, timeZone) : null;
  const end = conversational.at(-1) ? localDateKey(conversational.at(-1)!.timestamp, timeZone) : null;
  const activeDayKeys = new Set(conversational.map((message) => localDateKey(message.timestamp, timeZone)));
  const coveredDays = coveredDayCount(start, end);
  const senderTotals = {
    self: conversational.filter((message) => message.isSelf).length,
    other: conversational.filter((message) => !message.isSelf).length,
  };
  const textMessages = conversational.filter((message) => message.kind === "text");
  const textChars = textMessages.reduce((sum, message) => sum + textLength(message), 0);
  const mediaMessages = conversational.length - textMessages.length;

  const roundDrafts = buildRounds(conversational);
  const roundByMessage = new Map<string, string>();
  for (const round of roundDrafts) for (const messageId of round.messageIds) roundByMessage.set(messageId, round.id);
  const rounds: RelationRoundMetric[] = roundDrafts.map((round) => ({
    id: round.id,
    start: round.start,
    end: round.end,
    sender: round.sender,
    messageCount: round.messageCount,
    textChars: round.textChars,
    evidenceIds: round.evidenceIds,
  }));

  const sessionDrafts = buildSessions(conversational, roundByMessage);
  const sessions: RelationSessionMetric[] = sessionDrafts.map((session) => ({
    id: session.id,
    start: session.start,
    end: session.end,
    messageCount: session.messageCount,
    selfCount: session.selfCount,
    otherCount: session.otherCount,
    roundCount: session.roundCount,
    durationMinutes: session.durationMinutes,
    initiator: session.initiator,
    bidirectional: session.bidirectional,
    evidenceIds: session.evidenceIds,
  }));

  const responsePairs = { selfToOther: [] as number[], otherToSelf: [] as number[] };
  const responseByWeek = new Map<string, number[]>();
  for (let index = 1; index < roundDrafts.length; index += 1) {
    const previous = roundDrafts[index - 1];
    const current = roundDrafts[index];
    if (previous.sender === current.sender) continue;
    const gap = Math.max(0, Math.round((Date.parse(`${current.start.replace(" ", "T")}+08:00`) - Date.parse(`${previous.end.replace(" ", "T")}+08:00`)) / MINUTE));
    if (gap > SESSION_GAP_MINUTES) continue;
    const key = previous.sender === "self" ? "selfToOther" : "otherToSelf";
    responsePairs[key].push(gap);
    const responseWeek = weekStart(current.start.slice(0, 10));
    responseByWeek.set(responseWeek, [...(responseByWeek.get(responseWeek) ?? []), gap]);
  }

  const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({ hour, total: 0, self: 0, other: 0 }));
  const weekdayHourlyActivity = Array.from({ length: 7 * 24 }, (_, index) => ({ weekday: Math.floor(index / 24) + 1, hour: index % 24, total: 0, self: 0, other: 0 }));
  const daily = new Map<string, { total: number; self: number; other: number; sessionIds: Set<string> }>();
  const weekly = new Map<string, { total: number; self: number; other: number; days: Set<string>; sessionIds: Set<string>; bothActiveDays: number; initiatorSelf: number; initiatorOther: number }>();
  const sessionByMessage = new Map<string, string>();
  for (const session of sessionDrafts) for (const messageId of session.messageIds) sessionByMessage.set(messageId, session.id);
  for (const message of conversational) {
    const hour = hourlyActivity[localHour(message.timestamp, timeZone)];
    hour.total += 1;
    if (message.isSelf) hour.self += 1; else hour.other += 1;
    const weekdayHour = weekdayHourlyActivity[(localWeekday(message.timestamp, timeZone) - 1) * 24 + localHour(message.timestamp, timeZone)];
    weekdayHour.total += 1;
    if (message.isSelf) weekdayHour.self += 1; else weekdayHour.other += 1;
    const day = localDateKey(message.timestamp, timeZone);
    const dayBucket = daily.get(day) ?? { total: 0, self: 0, other: 0, sessionIds: new Set<string>() };
    dayBucket.total += 1;
    if (message.isSelf) dayBucket.self += 1; else dayBucket.other += 1;
    const sessionId = sessionByMessage.get(message.id);
    if (sessionId) dayBucket.sessionIds.add(sessionId);
    daily.set(day, dayBucket);
    const week = weekStart(day);
    const weekBucket = weekly.get(week) ?? { total: 0, self: 0, other: 0, days: new Set<string>(), sessionIds: new Set<string>(), bothActiveDays: 0, initiatorSelf: 0, initiatorOther: 0 };
    weekBucket.total += 1;
    if (message.isSelf) weekBucket.self += 1; else weekBucket.other += 1;
    weekBucket.days.add(day);
    if (sessionId) weekBucket.sessionIds.add(sessionId);
    weekly.set(week, weekBucket);
  }
  for (const bucket of weekly.values()) bucket.bothActiveDays = [...bucket.days].filter((day) => (daily.get(day)?.self ?? 0) > 0 && (daily.get(day)?.other ?? 0) > 0).length;
  for (const session of sessionDrafts) {
    const firstDay = session.start.slice(0, 10);
    const bucket = weekly.get(weekStart(firstDay));
    if (bucket) {
      if (session.initiator === "self") bucket.initiatorSelf += 1;
      if (session.initiator === "other") bucket.initiatorOther += 1;
    }
  }

  const dailyTrend = [...daily.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([day, bucket]) => ({ day, total: bucket.total, self: bucket.self, other: bucket.other, sessionCount: bucket.sessionIds.size }));
  const weeklyTrend = [...weekly.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([label, bucket]) => ({ label, total: bucket.total, self: bucket.self, other: bucket.other, activeDays: bucket.days.size, bothActiveDays: bucket.bothActiveDays, sessionCount: bucket.sessionIds.size, initiatorSelf: bucket.initiatorSelf, initiatorOther: bucket.initiatorOther }));

  const dailyPersonBuckets = new Map<string, { self: { messages: number; animatedEmoji: number; images: number }; other: { messages: number; animatedEmoji: number; images: number } }>();
  for (const message of conversational) {
    const day = localDateKey(message.timestamp, timeZone);
    const bucket = dailyPersonBuckets.get(day) ?? { self: { messages: 0, animatedEmoji: 0, images: 0 }, other: { messages: 0, animatedEmoji: 0, images: 0 } };
    const person = message.isSelf ? bucket.self : bucket.other;
    person.messages += 1;
    if (message.kind === "emoji") person.animatedEmoji += 1;
    if (message.kind === "image") person.images += 1;
    dailyPersonBuckets.set(day, bucket);
  }

  const openingCounts = { self: 0, other: 0 };
  const replyBySender = { self: [] as number[], other: [] as number[] };
  for (let index = 0; index < roundDrafts.length; index += 1) {
    const current = roundDrafts[index];
    const previous = roundDrafts[index - 1];
    const gap = previous ? Math.max(0, Math.round((Date.parse(`${current.start.replace(" ", "T")}+08:00`) - Date.parse(`${previous.end.replace(" ", "T")}+08:00`)) / MINUTE)) : null;
    const isOpening = !previous || (gap ?? 0) > OPENING_GAP_MINUTES;
    if (isOpening) {
      openingCounts[current.sender] += 1;
      continue;
    }
    if (previous.sender !== current.sender && gap != null) replyBySender[current.sender].push(gap);
  }

  const personDays = start && end ? Array.from({ length: coveredDays }, (_, index) => addLocalDays(start, index)) : [];
  const dailyPersonStats = (sender: "self" | "other") => {
    const values = personDays.map((day) => dailyPersonBuckets.get(day)?.[sender] ?? { messages: 0, animatedEmoji: 0, images: 0 });
    const stat = (key: "messages" | "animatedEmoji" | "images") => {
      const dailyValues = values.map((value) => value[key]);
      const total = dailyValues.reduce((sum, value) => sum + value, 0);
      return { average: personDays.length ? roundToOne(total / personDays.length) : 0, max: Math.max(...dailyValues, 0) };
    };
    return { messages: stat("messages"), animatedEmoji: stat("animatedEmoji"), images: stat("images") };
  };
  const selfDailyStats = dailyPersonStats("self");
  const otherDailyStats = dailyPersonStats("other");

  const silenceSegments = [] as RelationMetrics["silence"]["segments"];
  const silenceValues: number[] = [];
  for (let index = 1; index < conversational.length; index += 1) {
    const previous = conversational[index - 1];
    const current = conversational[index];
    const rawMinutes = Math.round((current.timestamp - previous.timestamp) / MINUTE);
    const minutes = Math.max(0, rawMinutes - quietOverlapMinutes(previous.timestamp, current.timestamp, timeZone));
    if (minutes <= SESSION_GAP_MINUTES) continue;
    silenceValues.push(minutes);
    silenceSegments.push({ start: previous.time, end: current.time, minutes, beforeSender: previous.isSelf ? "self" : "other", afterSender: current.isSelf ? "self" : "other", evidenceIds: [previous.id, current.id] });
  }
  silenceSegments.sort((left, right) => right.minutes - left.minutes);

  const longestSilenceBySender = { self: 0, other: 0 };
  for (const segment of silenceSegments) {
    const sender = segment.afterSender;
    longestSilenceBySender[sender] = Math.max(longestSilenceBySender[sender], segment.minutes);
  }

  const maxWeekly = Math.max(...weeklyTrend.map((bucket) => bucket.total), 1);
  const temperatureTrend = weeklyTrend.map((bucket) => {
    const volume = bucket.total / maxWeekly;
    const reciprocity = bucket.total ? 1 - Math.abs(bucket.self - bucket.other) / bucket.total : 0;
    const continuity = Math.min(bucket.bothActiveDays / 7, 1);
    const weekResponse = responseByWeek.get(bucket.label) ?? [];
    const response = 1 / (1 + ((median(weekResponse) ?? 180) / 720));
    const score = Math.round((1 + 4 * (volume * 0.35 + reciprocity * 0.25 + continuity * 0.2 + response * 0.2)) * 10) / 10;
    return { label: bucket.label, score, messageCount: bucket.total, evidenceIds: [] };
  });

  const knownSessions = sessions.filter((session) => session.initiator !== "unknown").length;
  const selfInitiated = sessions.filter((session) => session.initiator === "self").length;
  const otherInitiated = sessions.filter((session) => session.initiator === "other").length;
  const bidirectionalSessions = sessions.filter((session) => session.bidirectional).length;
  return {
    version: VERSION,
    totalMessages: sorted.length,
    systemMessages: systemMessages.length,
    activeDays: activeDayKeys.size,
    sessionGapMinutes: SESSION_GAP_MINUTES,
    coverage: { start, end, coveredDays, activeDays: activeDayKeys.size, activeDayRate: coveredDays ? Math.round((activeDayKeys.size / coveredDays) * 1000) / 1000 : 0, nonSystemMessages: conversational.length, systemMessages: systemMessages.length },
    content: { textMessages: textMessages.length, textChars, mediaMessages, mediaRate: conversational.length ? Math.round((mediaMessages / conversational.length) * 1000) / 1000 : 0 },
    senderTotals,
    typeCounts: typeCounts(sorted),
    rounds: { total: rounds.length, self: rounds.filter((round) => round.sender === "self").length, other: rounds.filter((round) => round.sender === "other").length, medianMessages: median(rounds.map((round) => round.messageCount)), medianTextChars: median(rounds.map((round) => round.textChars).filter((value) => value > 0)), items: rounds },
    response: { selfToOtherMedianMinutes: median(responsePairs.selfToOther), otherToSelfMedianMinutes: median(responsePairs.otherToSelf), selfToOtherP90Minutes: percentile(responsePairs.selfToOther, 0.9), otherToSelfP90Minutes: percentile(responsePairs.otherToSelf, 0.9), selfToOtherSampleCount: responsePairs.selfToOther.length, otherToSelfSampleCount: responsePairs.otherToSelf.length },
    initiation: { totalSessions: sessions.length, self: selfInitiated, other: otherInitiated, unknown: sessions.length - knownSessions, selfRate: knownSessions ? Math.round((selfInitiated / knownSessions) * 1000) / 10 : null, otherRate: knownSessions ? Math.round((otherInitiated / knownSessions) * 1000) / 10 : null, bidirectional: bidirectionalSessions, bidirectionalRate: sessions.length ? Math.round((bidirectionalSessions / sessions.length) * 1000) / 10 : null },
    dailyTrend,
    sessions,
    hourlyActivity,
    weekdayHourlyActivity,
    weeklyTrend,
    silence: { medianMinutes: median(silenceValues), p90Minutes: percentile(silenceValues, 0.9), longestMinutes: silenceValues.length ? Math.max(...silenceValues) : 0, segments: silenceSegments.slice(0, 12) },
    temperatureTrend,
    topics: topicWords(conversational),
    quantity: {
      self: { animatedEmojiDailyAverage: selfDailyStats.animatedEmoji.average, animatedEmojiDailyMax: selfDailyStats.animatedEmoji.max, imageDailyAverage: selfDailyStats.images.average, imageDailyMax: selfDailyStats.images.max, messageDailyAverage: selfDailyStats.messages.average, messageDailyMax: selfDailyStats.messages.max, initiationCount: openingCounts.self, initiationShare: openingCounts.self + openingCounts.other ? roundToOne((openingCounts.self / (openingCounts.self + openingCounts.other)) * 100) : null },
      other: { animatedEmojiDailyAverage: otherDailyStats.animatedEmoji.average, animatedEmojiDailyMax: otherDailyStats.animatedEmoji.max, imageDailyAverage: otherDailyStats.images.average, imageDailyMax: otherDailyStats.images.max, messageDailyAverage: otherDailyStats.messages.average, messageDailyMax: otherDailyStats.messages.max, initiationCount: openingCounts.other, initiationShare: openingCounts.self + openingCounts.other ? roundToOne((openingCounts.other / (openingCounts.self + openingCounts.other)) * 100) : null },
      openingCount: openingCounts.self + openingCounts.other,
      coveredDays,
    },
    time: {
      self: { longestSilenceHours: roundToOne(longestSilenceBySender.self / 60), replySpeedAverageMinutes: average(replyBySender.self), replySampleCount: replyBySender.self.length },
      other: { longestSilenceHours: roundToOne(longestSilenceBySender.other / 60), replySpeedAverageMinutes: average(replyBySender.other), replySampleCount: replyBySender.other.length },
      openingGapMinutes: OPENING_GAP_MINUTES,
      quietHours: "23:00–07:00",
    },
  };
}

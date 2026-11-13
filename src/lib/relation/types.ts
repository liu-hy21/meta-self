export type RelationSenderFilter = "all" | "self" | "other";

export type ChatMessageKind =
  | "text"
  | "image"
  | "voice"
  | "video"
  | "emoji"
  | "system"
  | "location"
  | "card"
  | "voip"
  | "other";

export type DateRange = { start?: string; end?: string };

export type ChatArchiveQuery = DateRange & {
  cursor?: number;
  pageSize?: number;
  search?: string;
  sender?: RelationSenderFilter;
  kind?: ChatMessageKind | "all";
};

export type ChatMessage = {
  id: string;
  sourceId?: string;
  index: number;
  time: string;
  timestamp: number;
  day: string;
  sender: string;
  isSelf: boolean;
  kind: ChatMessageKind;
  text: string;
};

export type ChatArchiveMeta = {
  sourceKey: string;
  displayName: string;
  available: boolean;
  error: string | null;
  messageCount: number;
  periodStart: string | null;
  periodEnd: string | null;
  importedAt: string | null;
};

export type ChatArchivePage = {
  messages: ChatMessage[];
  total: number;
  nextCursor: number | null;
  meta: ChatArchiveMeta;
};

export type RelationRoundMetric = {
  id: string;
  start: string;
  end: string;
  sender: "self" | "other";
  messageCount: number;
  textChars: number;
  evidenceIds: string[];
};

export type RelationSessionMetric = {
  id: string;
  start: string;
  end: string;
  messageCount: number;
  selfCount: number;
  otherCount: number;
  roundCount: number;
  durationMinutes: number;
  initiator: "self" | "other" | "unknown";
  bidirectional: boolean;
  evidenceIds: string[];
};

export type RelationPersonQuantityMetrics = {
  animatedEmojiDailyAverage: number;
  animatedEmojiDailyMax: number;
  imageDailyAverage: number;
  imageDailyMax: number;
  messageDailyAverage: number;
  messageDailyMax: number;
  initiationCount: number;
  initiationShare: number | null;
};

export type RelationPersonTimeMetrics = {
  longestSilenceHours: number;
  replySpeedAverageMinutes: number | null;
  replySampleCount: number;
};

export type RelationMetrics = {
  version: "2026-11-v2";
  totalMessages: number;
  systemMessages: number;
  activeDays: number;
  sessionGapMinutes: number;
  coverage: {
    start: string | null;
    end: string | null;
    coveredDays: number;
    activeDays: number;
    activeDayRate: number;
    nonSystemMessages: number;
    systemMessages: number;
  };
  content: {
    textMessages: number;
    textChars: number;
    mediaMessages: number;
    mediaRate: number;
  };
  senderTotals: { self: number; other: number };
  typeCounts: Record<ChatMessageKind, number>;
  rounds: {
    total: number;
    self: number;
    other: number;
    medianMessages: number | null;
    medianTextChars: number | null;
    items: RelationRoundMetric[];
  };
  response: {
    selfToOtherMedianMinutes: number | null;
    otherToSelfMedianMinutes: number | null;
    selfToOtherP90Minutes: number | null;
    otherToSelfP90Minutes: number | null;
    selfToOtherSampleCount: number;
    otherToSelfSampleCount: number;
  };
  initiation: {
    totalSessions: number;
    self: number;
    other: number;
    unknown: number;
    selfRate: number | null;
    otherRate: number | null;
    bidirectional: number;
    bidirectionalRate: number | null;
  };
  dailyTrend: { day: string; total: number; self: number; other: number; sessionCount: number }[];
  sessions: RelationSessionMetric[];
  hourlyActivity: { hour: number; total: number; self: number; other: number }[];
  weekdayHourlyActivity: { weekday: number; hour: number; total: number; self: number; other: number }[];
  weeklyTrend: { label: string; total: number; self: number; other: number; activeDays: number; bothActiveDays: number; sessionCount: number; initiatorSelf: number; initiatorOther: number }[];
  silence: {
    medianMinutes: number | null;
    p90Minutes: number | null;
    longestMinutes: number;
    segments: { start: string; end: string; minutes: number; beforeSender: "self" | "other"; afterSender: "self" | "other"; evidenceIds: string[] }[];
  };
  temperatureTrend: { label: string; score: number; messageCount: number; evidenceIds: string[] }[];
  topics: { word: string; count: number; evidenceIds: string[] }[];
  quantity: { self: RelationPersonQuantityMetrics; other: RelationPersonQuantityMetrics; openingCount: number; coveredDays: number };
  time: { self: RelationPersonTimeMetrics; other: RelationPersonTimeMetrics; openingGapMinutes: number; quietHours: string };
};

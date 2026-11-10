import { readFile, stat } from "node:fs/promises";

import { BC_DISPLAY_NAME, BC_SOURCE_KEY, resolveRelationArchivePath } from "@/lib/relation/archive-config";
import type {
  ChatArchiveMeta,
  ChatArchivePage,
  ChatArchiveQuery,
  ChatMessage,
  ChatMessageKind,
} from "@/lib/relation/types";

const ARCHIVE_LINE = /^- (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \| ([^|]+) \| (.*)$/;

type CachedArchive = {
  path: string;
  importedAt: string;
  messages: ChatMessage[];
};

const cache = new Map<string, Promise<CachedArchive | null>>();

function archivePathFor(sourceKey: string) {
  return resolveRelationArchivePath(sourceKey);
}

function detectKind(text: string): ChatMessageKind {
  if (text === "[图片]") return "image";
  if (text.startsWith("[语音")) return "voice";
  if (text === "[视频]") return "video";
  if (text === "[动画表情]") return "emoji";
  if (text === "[位置]") return "location";
  if (text.startsWith("[名片]")) return "card";
  if (text === "[音视频通话]") return "voip";
  if (text === "[系统消息]" || text.includes("添加了损友")) return "system";
  return text.startsWith("[") ? "other" : "text";
}

function parseTime(value: string) {
  return Date.parse(`${value.replace(" ", "T")}+08:00`);
}

function parseLine(line: string, index: number): ChatMessage | null {
  const match = line.match(ARCHIVE_LINE);
  if (!match) return null;
  const [, time, sender, encodedText] = match;
  const text = encodedText.replaceAll("<br>", "\n").replaceAll("\\`", "`");
  return {
    id: `msg-${String(index).padStart(6, "0")}`,
    index,
    time,
    timestamp: parseTime(time),
    day: time.slice(0, 10),
    sender: sender.trim(),
    isSelf: sender.trim() === "我",
    kind: detectKind(text),
    text,
  };
}

async function readArchive(sourceKey: string): Promise<CachedArchive | null> {
  const filePath = archivePathFor(sourceKey);
  if (!filePath) return null;
  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat) return null;
  const content = await readFile(filePath, "utf8");
  let messageIndex = 0;
  const messages = content
    .split(/\r?\n/)
    .map((line) => {
      if (!ARCHIVE_LINE.test(line)) return null;
      messageIndex += 1;
      return parseLine(line, messageIndex);
    })
    .filter((message): message is ChatMessage => message !== null);
  return { path: filePath, importedAt: fileStat.mtime.toISOString(), messages };
}

async function getCachedArchive(sourceKey: string) {
  if (!cache.has(sourceKey)) {
    cache.set(sourceKey, readArchive(sourceKey));
  }
  return cache.get(sourceKey)!;
}

function unavailableMeta(sourceKey: string, error: string): ChatArchiveMeta {
  return {
    sourceKey,
    displayName: sourceKey === BC_SOURCE_KEY ? BC_DISPLAY_NAME : sourceKey,
    available: false,
    error,
    messageCount: 0,
    periodStart: null,
    periodEnd: null,
    importedAt: null,
  };
}

function metaFor(sourceKey: string, archive: CachedArchive | null): ChatArchiveMeta {
  if (!archive) {
    return unavailableMeta(sourceKey, "聊天档案不存在或尚未配置");
  }
  return {
    sourceKey,
    displayName: sourceKey === BC_SOURCE_KEY ? BC_DISPLAY_NAME : sourceKey,
    available: true,
    error: null,
    messageCount: archive.messages.length,
    periodStart: archive.messages[0]?.day ?? null,
    periodEnd: archive.messages.at(-1)?.day ?? null,
    importedAt: archive.importedAt,
  };
}

export async function getChatArchiveMeta(sourceKey: string = BC_SOURCE_KEY): Promise<ChatArchiveMeta> {
  return metaFor(sourceKey, await getCachedArchive(sourceKey));
}

export async function loadAllChatMessages(sourceKey: string = BC_SOURCE_KEY): Promise<ChatMessage[]> {
  return (await getCachedArchive(sourceKey))?.messages ?? [];
}

export async function loadChatArchive(
  sourceKey: string = BC_SOURCE_KEY,
  query: ChatArchiveQuery = {},
): Promise<ChatArchivePage> {
  const archive = await getCachedArchive(sourceKey);
  const meta = metaFor(sourceKey, archive);
  if (!archive) return { messages: [], total: 0, nextCursor: null, meta };

  const start = query.start ?? "0000-01-01";
  const end = query.end ?? "9999-12-31";
  const search = query.search?.trim().toLocaleLowerCase("zh-CN");
  const filtered = archive.messages.filter((message) => {
    if (message.day < start || message.day > end) return false;
    if (query.sender === "self" && !message.isSelf) return false;
    if (query.sender === "other" && message.isSelf) return false;
    if (query.kind && query.kind !== "all" && message.kind !== query.kind) return false;
    if (search && !`${message.id} ${message.sender} ${message.text}`.toLocaleLowerCase("zh-CN").includes(search)) return false;
    return true;
  });

  const pageSize = Math.min(Math.max(query.pageSize ?? 60, 1), 20000);
  const cursor = Math.max(query.cursor ?? 0, 0);
  const messages = filtered.slice(cursor, cursor + pageSize);
  const nextCursor = cursor + messages.length < filtered.length ? cursor + messages.length : null;
  return { messages, total: filtered.length, nextCursor, meta };
}

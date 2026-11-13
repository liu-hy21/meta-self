import path from "node:path";

const VIDEO_DIR = path.join(process.cwd(), "storage", "videos");
const MAX_BYTES = 500 * 1024 * 1024;

export const LIBRARY_VIDEO_CATEGORIES = ["实战", "稳住", "理念"] as const;
export type LibraryVideoCategory = (typeof LIBRARY_VIDEO_CATEGORIES)[number];

export function isLibraryVideoCategory(value: string): value is LibraryVideoCategory {
  return (LIBRARY_VIDEO_CATEGORIES as readonly string[]).includes(value);
}

export function libraryVideoCategory(title: string, category: string): LibraryVideoCategory {
  const prefix = /^(实战|稳住|理念|防守)[:：]\s*/u.exec(title)?.[1];
  if (prefix === "实战" || prefix === "稳住" || prefix === "理念") return prefix;
  if (prefix === "防守") return "稳住";
  return isLibraryVideoCategory(category) ? category : "理念";
}

export function libraryVideoTitle(title: string) {
  return title.replace(/^(实战|稳住|理念|防守)[:：]\s*/u, "");
}

const MIME_BY_EXT = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
} as const;

export function libraryVideoDir() {
  return VIDEO_DIR;
}

export function libraryVideoLimit() {
  return MAX_BYTES;
}

export function libraryVideoFile(storedName: string) {
  if (!/^[\w-]+\.(mp4|webm|mov)$/.test(storedName)) return null;
  return path.join(VIDEO_DIR, storedName);
}

export function libraryVideoMime(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "mp4" || ext === "webm" || ext === "mov") return { ext, mime: MIME_BY_EXT[ext] };
  return null;
}

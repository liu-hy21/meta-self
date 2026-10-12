import path from "node:path";

const VIDEO_DIR = path.join(process.cwd(), "storage", "videos");
const MAX_BYTES = 200 * 1024 * 1024;

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

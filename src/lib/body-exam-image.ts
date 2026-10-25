import path from "node:path";

const EXAM_IMAGE_DIR = path.join(process.cwd(), "storage", "body-exam-images");
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_FILES_PER_LOG = 12;

const EXT_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
};

const ALLOWED_EXT = new Set(Object.keys(EXT_MIME));

export function bodyExamImageDir() {
  return EXAM_IMAGE_DIR;
}

export function bodyExamImageLimit() {
  return MAX_BYTES;
}

export function bodyExamImageMaxFiles() {
  return MAX_FILES_PER_LOG;
}

export function bodyExamImageExt(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXT.has(ext)) return null;
  return ext;
}

export function bodyExamImageMime(ext: string) {
  return EXT_MIME[ext] ?? "application/octet-stream";
}

export function bodyExamImageFile(storedName: string) {
  if (!/^[\w-]+\.[\w]+$/.test(storedName)) return null;
  const ext = storedName.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXT.has(ext)) return null;
  return path.join(EXAM_IMAGE_DIR, storedName);
}

import path from "node:path";

const CREDENTIAL_DIR = path.join(process.cwd(), "storage", "work-credentials");
const MAX_BYTES = 25 * 1024 * 1024;

const EXT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  zip: "application/zip",
};

const ALLOWED_EXT = new Set(Object.keys(EXT_MIME));

export function workCredentialDir() {
  return CREDENTIAL_DIR;
}

export function workCredentialLimit() {
  return MAX_BYTES;
}

export function workCredentialExt(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXT.has(ext)) return null;
  return ext;
}

export function workCredentialMime(ext: string) {
  return EXT_MIME[ext] ?? "application/octet-stream";
}

export function workCredentialFile(storedName: string) {
  if (!/^[\w-]+\.[\w]+$/.test(storedName)) return null;
  const ext = storedName.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXT.has(ext)) return null;
  return path.join(CREDENTIAL_DIR, storedName);
}

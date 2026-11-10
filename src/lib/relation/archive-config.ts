import path from "node:path";

export const BC_SOURCE_TYPE = "WECHAT";
export const BC_SOURCE_KEY = "wxid_en8z2t73paw522";
export const BC_DISPLAY_NAME = "bc";
export const BC_ARCHIVE_FILE = "bc_chat_2026-07_to-2026-10.md";

export function resolveRelationArchivePath(sourceKey: string) {
  if (sourceKey === BC_SOURCE_KEY) {
    return process.env.RELATION_BC_ARCHIVE_PATH || path.join(process.cwd(), BC_ARCHIVE_FILE);
  }
  return null;
}

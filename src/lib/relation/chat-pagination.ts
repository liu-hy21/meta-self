export const CHAT_PAGE_SIZE = 80;

export function chatPageFromMessageId(messageId: string) {
  const sourceId = messageId.replace(/-part-\d+$/u, "");
  const index = Number(sourceId.replace(/^msg-/, ""));
  return Number.isInteger(index) && index > 0 ? Math.ceil(index / CHAT_PAGE_SIZE) : 1;
}

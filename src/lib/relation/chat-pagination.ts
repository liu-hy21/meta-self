export const CHAT_PAGE_SIZE = 80;

export function chatPageFromMessageId(messageId: string) {
  const index = Number(messageId.replace(/^msg-/, ""));
  return Number.isInteger(index) && index > 0 ? Math.ceil(index / CHAT_PAGE_SIZE) : 1;
}

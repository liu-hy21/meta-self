import type { ChatMessage } from "./types";

/** The simulated counterpart sends short, separately visible chat bubbles. */
export const PERSONA_MAX_MESSAGE_CHARS = 7;

function codePointLength(value: string) {
  return Array.from(value).length;
}

function hardSplit(value: string) {
  const chars = Array.from(value);
  const parts: string[] = [];
  for (let index = 0; index < chars.length; index += PERSONA_MAX_MESSAGE_CHARS) {
    parts.push(chars.slice(index, index + PERSONA_MAX_MESSAGE_CHARS).join(""));
  }
  return parts;
}

function shortMessageParts(value: string) {
  const clauses = value
    .split(/(?<=[。！？!?；;])/u)
    .map((part) => part.trim())
    .filter(Boolean);
  return clauses.flatMap((clause) => codePointLength(clause) <= PERSONA_MAX_MESSAGE_CHARS ? [clause] : hardSplit(clause));
}

/**
 * Double spaces and line breaks in the archive represent separate counterpart
 * bubbles. Self-authored messages intentionally remain intact.
 */
export function splitPersonaMessageText(text: string) {
  return text
    .split(/(?:\r?\n|\s{2,})/u)
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap(shortMessageParts);
}

export function normalizePersonaMessages(messages: ChatMessage[]) {
  return messages.flatMap((message) => {
    if (message.isSelf || message.kind !== "text") return [message];
    const parts = splitPersonaMessageText(message.text);
    if (parts.length <= 1) return [message];
    const sourceId = message.sourceId ?? message.id;
    return parts.map((text, partIndex) => ({
      ...message,
      id: partIndex === 0 ? message.id : `${message.id}-part-${partIndex + 1}`,
      index: message.index + partIndex / 1000,
      sourceId,
      text,
    }));
  });
}

/** Parse model output into the individual bubbles the chat UI renders. */
export function normalizePersonaReply(text: string) {
  return splitPersonaMessageText(text.replace(/^\s*[-*•]\s*/gm, ""));
}

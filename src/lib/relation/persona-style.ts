import type { ChatMessage } from "./types";
import { normalizePersonaMessages } from "./persona-message-shape";

export type PersonaSpeakerStyle = {
  total: number;
  textMessages: number;
  averageLength: number;
  questionRate: number;
  mediaRate: number;
  labels: string[];
  detail: string;
};

export type PersonaSpeakerStats = {
  self: PersonaSpeakerStyle;
  other: PersonaSpeakerStyle;
};

function describe(messages: ChatMessage[]): PersonaSpeakerStyle {
  const textMessages = messages.filter((message) => message.kind === "text" && message.text.trim());
  const averageLength = textMessages.length
    ? Math.round(textMessages.reduce((total, message) => total + message.text.length, 0) / textMessages.length)
    : 0;
  const questionRate = textMessages.length
    ? textMessages.filter((message) => message.text.includes("?") || message.text.includes("？")).length / textMessages.length
    : 0;
  const mediaRate = messages.length
    ? messages.filter((message) => message.kind !== "text").length / messages.length
    : 0;
  const shortRate = textMessages.length
    ? textMessages.filter((message) => message.text.length < 8).length / textMessages.length
    : 0;
  const labels: string[] = [];

  if (!textMessages.length) labels.push("暂无文字样本");
  else if (averageLength <= 8 || shortRate >= 0.7) labels.push("短句为主");
  else if (averageLength <= 18) labels.push("中短句");
  else labels.push("表达较完整");

  if (questionRate >= 0.18) labels.push("提问较多");
  else if (questionRate <= 0.05) labels.push("少提问");
  else labels.push("问答均衡");

  if (mediaRate >= 0.12) labels.push("图像/表情较多");
  else labels.push("文字为主");

  return {
    total: messages.length,
    textMessages: textMessages.length,
    averageLength,
    questionRate,
    mediaRate,
    labels: labels.slice(0, 3),
    detail: `${messages.length.toLocaleString("zh-CN")} 条 · 平均 ${averageLength} 字 · 提问 ${Math.round(questionRate * 100)}%`,
  };
}

export function summarizePersonaSpeakers(messages: ChatMessage[]): PersonaSpeakerStats {
  const eligible = normalizePersonaMessages(messages).filter((message) => message.kind !== "system");
  return {
    self: describe(eligible.filter((message) => message.isSelf)),
    other: describe(eligible.filter((message) => !message.isSelf)),
  };
}

export const PERSONA_VIEW_TABS = [
  { key: "试聊", label: "对话" },
  { key: "资料", label: "资料" },
  { key: "评测", label: "评测" },
] as const;

export const CHAT_SUGGESTIONS = ["早", "bc在干嘛", "上次我们说过的", "我们经历过什么"] as const;

export function getMessageSide(role: "user" | "assistant") {
  return role === "assistant" ? "incoming" : "outgoing";
}

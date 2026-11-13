import { getAppUserId } from "@/lib/user";
import { askFinanceExpenseAgent, type ExpenseChatMessage } from "@/lib/finance-expense-agent";

export async function POST(request: Request) {
  let input: { year?: unknown; history?: unknown };
  try { input = await request.json(); } catch { return Response.json({ error: "请求格式无效。" }, { status: 400 }); }
  const { year, history } = input;
  if ((year !== null && (!Number.isInteger(year) || Number(year) < 1900 || Number(year) > 2200)) ||
    !Array.isArray(history) || !history.length || history.length > 16 || history.some((item: ExpenseChatMessage) =>
      !item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string" || !item.content.trim() || item.content.length > 2000
    ) || history.at(-1)?.role !== "user") return Response.json({ error: "对话内容无效。" }, { status: 400 });

  const userId = await getAppUserId();
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: object) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        const reply = await askFinanceExpenseAgent(userId, year as number | null, history as ExpenseChatMessage[], (text) => send({ type: "delta", text }));
        send({ type: "done", toolSteps: reply.toolSteps });
      } catch (cause) {
        send({ type: "error", message: cause instanceof Error ? cause.message : "分析失败，请重试。" });
      } finally { controller.close(); }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform" } });
}

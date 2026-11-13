import { prisma } from "@/lib/db";
import { getLlmSettings } from "@/lib/llm-config";

export type ExpenseChatMessage = { role: "user" | "assistant"; content: string };
export type ExpenseAgentReply = { content: string; model: string; toolSteps: string[] };

const labels: Record<string, string> = {
  TRAVEL: "旅游", ITEM: "物件", OUTFIT: "穿搭", DATE: "约会", MEDICAL: "医疗", DAILY: "基本日常",
};

const tool = {
  type: "function",
  function: {
    name: "read_large_expenses",
    description: "读取当前选定年份的历史大额消费记录与类型金额分布。只能访问历史大额消费。",
    parameters: { type: "object", properties: {}, additionalProperties: false },
  },
};

async function readLargeExpenses(userId: string, year: number | null) {
  const expenses = await prisma.financeLargeExpense.findMany({
    where: { userId, ...(year == null ? {} : { occurredOn: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } }) },
    orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
    select: { title: true, amountMinor: true, occurredOn: true, type: true },
  });
  const totalMinor = expenses.reduce((sum, item) => sum + item.amountMinor, 0);
  const byType = Object.entries(labels).map(([type, label]) => {
    const matching = expenses.filter((item) => item.type === type);
    const amountMinor = matching.reduce((sum, item) => sum + item.amountMinor, 0);
    return { label, count: matching.length, amountMinor, sharePercent: totalMinor ? Number((amountMinor / totalMinor * 100).toFixed(1)) : 0 };
  }).filter((item) => item.count);
  return JSON.stringify({ scope: year == null ? "全部年份" : `${year}年`, count: expenses.length, totalMinor, byType,
    expenses: expenses.map((item) => ({ title: item.title, type: labels[item.type], amountMinor: item.amountMinor, date: item.occurredOn.toISOString().slice(0, 10) })) });
}

type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
type AgentMessage = { role: "system" | "user" | "assistant" | "tool"; content: string | null; reasoning_content?: string; tool_calls?: ToolCall[]; tool_call_id?: string };

export async function askFinanceExpenseAgent(userId: string, year: number | null, history: ExpenseChatMessage[], onDelta?: (text: string) => void): Promise<ExpenseAgentReply> {
  const settings = await getLlmSettings(userId);
  if (!settings) throw new Error("请先在左下角设置中配置 DeepSeek 模型。");
  const messages: AgentMessage[] = [
    { role: "system", content: `你是历史大额消费的取舍顾问。仅可调用 read_large_expenses 读取消费记录，绝不能读取、推断或引用资产、持仓、现金、收入、负债或其他数据。每轮先读取工具数据，再回答。金额单位是人民币分，展示时换算为元。用户最想知道下一次该怎么花：请直接给出按优先级排序的2至3条可执行决定，每条先写“保留/减少/暂停/改变购买方式”中的动作，再指出对应的具体消费、记录中的依据，以及下次遇到同类消费时的执行规则。可以依据重复发生的模式提出优先筛选活动、考虑合并行程、续费前核对使用情况或购买前确认同类物品是否已足够等低后悔建议；不要把“再补充信息”“先拆账”当成主要建议。记录不足以断言过去一笔钱已经浪费时，就把建议写成面向未来的条件规则，简短说明需要核实的条件，但仍要给出现在能做的动作。不要凭空设定每月或每季度次数、冷静期、金额额度，也不要把整个消费类别一概暂停或认定浪费。任何未记录的使用频率、现有物品缺口、行程目的与体验都不能作为已知事实。高金额或高占比本身不是浪费证据，不得臆测个人体验、收入或预算；医疗开支不作必要性判断，也不提供延迟治疗、就诊、比价等医疗安排建议。只在支持决策时引用金额和频次，不逐类罗列、不制作类型分布表、不写报告式前言和总结。不编造节省金额或消费上限。用户具体追问优先于默认格式。中文简洁直接，不反复说“无法判断”。当前范围：${year == null ? "全部年份" : `${year}年`}。` },
    ...history.map((item) => ({ role: item.role, content: item.content })),
  ];
  const toolSteps: string[] = [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    for (let step = 0; step < 4; step++) {
      const effort = step === 0 ? "none" : settings.reasoningEffort;
      const response = await fetch(`${settings.baseUrl}/chat/completions`, {
        method: "POST", signal: controller.signal,
        headers: { Authorization: `Bearer ${settings.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: settings.model, messages, ...(effort === "auto" ? {} : { reasoning_effort: effort }), max_tokens: 1800, tools: [tool], tool_choice: step === 0 ? "required" : "auto", stream: step > 0 && Boolean(onDelta) }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(`模型请求失败（HTTP ${response.status}）：${data.error?.message ?? "请稍后重试。"}`);
      }
      let reply: { content?: string | null; reasoning_content?: string | null; tool_calls?: ToolCall[] } | undefined;
      if (step > 0 && onDelta) {
        if (!response.body) throw new Error("模型没有返回流式内容。");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const calls: ToolCall[] = [];
        let content = "";
        let reasoning = "";
        let buffer = "";
        const consume = (line: string) => {
          if (!line.startsWith("data: ") || line === "data: [DONE]") return;
          const chunk = JSON.parse(line.slice(6)) as { choices?: Array<{ delta?: { content?: string; reasoning_content?: string; tool_calls?: Array<{ index: number; id?: string; type?: "function"; function?: { name?: string; arguments?: string } }> } }> };
          const delta = chunk.choices?.[0]?.delta;
          if (delta?.content) { content += delta.content; onDelta(delta.content); }
          if (delta?.reasoning_content) reasoning += delta.reasoning_content;
          for (const call of delta?.tool_calls ?? []) {
            const current = calls[call.index] ?? { id: "", type: "function" as const, function: { name: "", arguments: "" } };
            current.id += call.id ?? "";
            current.function.name += call.function?.name ?? "";
            current.function.arguments += call.function?.arguments ?? "";
            calls[call.index] = current;
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? "";
          for (const line of lines) consume(line);
        }
        buffer += decoder.decode();
        if (buffer) consume(buffer);
        reply = { content, reasoning_content: reasoning, tool_calls: calls.length ? calls : undefined };
      } else {
        const data = await response.json() as { choices?: Array<{ message?: typeof reply }> };
        reply = data.choices?.[0]?.message;
      }
      if (!reply) throw new Error("模型没有返回可用内容。");
      if (!reply.tool_calls?.length) {
        if (!toolSteps.length) throw new Error("模型未读取消费数据，请检查模型是否支持工具调用。");
        if (!reply.content?.trim()) throw new Error("模型没有返回可用内容。");
        return { content: reply.content.trim(), model: settings.model, toolSteps };
      }
      messages.push({ role: "assistant", content: reply.content ?? null, reasoning_content: reply.reasoning_content ?? "", tool_calls: reply.tool_calls });
      for (const call of reply.tool_calls) {
        if (call.function.name !== "read_large_expenses") throw new Error("模型请求了未授权工具。");
        toolSteps.push("读取历史大额消费");
        messages.push({ role: "tool", tool_call_id: call.id, content: await readLargeExpenses(userId, year) });
      }
    }
    throw new Error("分析步骤过多，请缩小问题范围后重试。");
  } finally {
    clearTimeout(timeout);
  }
}

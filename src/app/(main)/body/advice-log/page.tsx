import { pageWrap, submitClass } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";

function when(date: Date) {
  return date.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdviceLogPage() {
  const user = await getAppUser();
  const logs = await prisma.aiAdviceLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className={pageWrap}>
      <section className="pixel-box p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">AI建议日志</h2>
          <form action="/api/ai-advice-import" method="post" encType="multipart/form-data" className="flex items-center gap-2">
            <input
              name="file"
              type="file"
              accept=".md,text/markdown,text/plain"
              required
              className="max-w-52 text-xs file:mr-2 file:inline-flex file:h-8 file:items-center file:justify-center file:border-2 file:border-[var(--ink)] file:bg-[var(--panel)] file:px-3 file:leading-none"
            />
            <button type="submit" className={submitClass()}>
              导入
            </button>
          </form>
        </div>
        {logs.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">还没有导入的建议。</p>
        ) : (
          <ul className="space-y-3">
            {logs.map((log) => (
              <li key={log.id} className="border-2 border-[var(--ink)] bg-[var(--panel)] px-4 py-3">
                <p className="text-xs text-[var(--muted)]">{when(log.createdAt)}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{log.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

import { buildContextMarkdown } from "@/lib/board/export-markdown";
import { getAppUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAppUser();
  const markdown = await buildContextMarkdown(user.id);
  const filename = `metaself-context-${new Date().toISOString().slice(0, 10)}.md`;

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { prisma } from "@/lib/db";
import { workCredentialFile } from "@/lib/work-credential";
import { getAppUserId } from "@/lib/user";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getAppUserId();
  const { id } = await context.params;
  const row = await prisma.workCredential.findFirst({ where: { id, userId } });
  const filePath = row ? workCredentialFile(row.storedName) : null;
  if (!row || !filePath) return new Response("找不到", { status: 404 });

  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat) return new Response("找不到", { status: 404 });

  const encoded = encodeURIComponent(row.originalName).replace(/'/g, "%27");
  return new Response(Readable.toWeb(createReadStream(filePath)) as ReadableStream, {
    headers: {
      "Content-Type": row.mime,
      "Content-Length": String(fileStat.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encoded}`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

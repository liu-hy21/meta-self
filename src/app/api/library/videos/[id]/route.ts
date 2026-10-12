import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { prisma } from "@/lib/db";
import { libraryVideoFile } from "@/lib/library-video";
import { getAppUserId } from "@/lib/user";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getAppUserId();
  const { id } = await context.params;
  const video = await prisma.libraryVideo.findFirst({ where: { id, userId } });
  const filePath = video ? libraryVideoFile(video.storedName) : null;
  if (!video || !filePath) return new Response("找不到", { status: 404 });

  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat) return new Response("找不到", { status: 404 });

  const total = fileStat.size;
  const range = request.headers.get("range");
  const headers = {
    "Content-Type": video.mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
  };

  if (!range) {
    return new Response(Readable.toWeb(createReadStream(filePath)) as ReadableStream, {
      headers: { ...headers, "Content-Length": String(total) },
    });
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });

  const start = match[1] ? Number(match[1]) : 0;
  let end = match[2] ? Number(match[2]) : total - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= total || start > end) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
  }
  end = Math.min(end, total - 1);

  return new Response(Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream, {
    status: 206,
    headers: {
      ...headers,
      "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${total}`,
    },
  });
}

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isLibraryVideoCategory, libraryVideoFile } from "@/lib/library-video";
import { getAppUserId } from "@/lib/user";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getAppUserId();
  const { id } = await context.params;
  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim().slice(0, 80);
  const category = String(form.get("category") ?? "");
  const page = Math.max(1, Number.parseInt(String(form.get("page") ?? "1"), 10) || 1);

  if (!title || !isLibraryVideoCategory(category)) {
    return Response.json({ error: "标题和分类不能为空。" }, { status: 400 });
  }

  const updated = await prisma.libraryVideo.updateMany({
    where: { id, userId },
    data: { title, category },
  });
  if (updated.count === 0) return new Response("找不到", { status: 404 });

  revalidatePath("/library/video");
  redirect(`/library/video?id=${id}&page=${page}`);
}

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

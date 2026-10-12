import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { libraryVideoDir, libraryVideoLimit, libraryVideoMime } from "@/lib/library-video";
import { getAppUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getAppUser();
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) redirect("/library/video?error=file");
  if (file.size > libraryVideoLimit()) redirect("/library/video?error=size");

  const kind = libraryVideoMime(file);
  if (!kind) redirect("/library/video?error=type");

  const rawTitle = String(form.get("title") ?? "").trim();
  const title = (rawTitle || file.name.replace(/\.[^.]+$/, "")).slice(0, 80);
  const storedName = `${randomUUID()}.${kind.ext}`;
  const dir = libraryVideoDir();
  const fullPath = path.join(dir, storedName);
  await mkdir(dir, { recursive: true });
  await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));

  let createdId = "";
  try {
    const created = await prisma.libraryVideo.create({
      data: {
        userId: user.id,
        title,
        storedName,
        mime: kind.mime,
        sizeBytes: file.size,
      },
    });
    createdId = created.id;
  } catch (error) {
    await unlink(fullPath).catch(() => undefined);
    throw error;
  }

  revalidatePath("/library/video");
  redirect(`/library/video?id=${createdId}`);
}

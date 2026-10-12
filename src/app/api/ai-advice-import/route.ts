import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getAppUser();
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) redirect("/body/advice-log");

  const content = (await file.text()).replace(/^\uFEFF/, "").trim();
  if (content) {
    await prisma.aiAdviceLog.create({
      data: { userId: user.id, content },
    });
    revalidatePath("/body/advice-log");
    revalidatePath("/");
  }

  redirect("/body/advice-log");
}

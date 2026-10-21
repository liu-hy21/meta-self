import { redirect } from "next/navigation";

export default async function MindLogPage({
  searchParams,
}: {
  searchParams: Promise<{ write?: string }>;
}) {
  const { write } = await searchParams;
  redirect(write ? `/mind/profile?write=${write}` : "/mind/profile");
}

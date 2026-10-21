import { redirect } from "next/navigation";

export default async function WorkLogPage({
  searchParams,
}: {
  searchParams: Promise<{ write?: string }>;
}) {
  const { write } = await searchParams;
  redirect(write ? `/work/profile?write=${write}` : "/work/profile");
}

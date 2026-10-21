import { redirect } from "next/navigation";

export default async function RelationLogPage({
  searchParams,
}: {
  searchParams: Promise<{ write?: string }>;
}) {
  const { write } = await searchParams;
  redirect(write ? `/relation/profile?write=${write}` : "/relation/profile");
}

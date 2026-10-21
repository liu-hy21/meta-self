import { redirect } from "next/navigation";

export default async function BodyLogPage({
  searchParams,
}: {
  searchParams: Promise<{ write?: string; medicalWrite?: string }>;
}) {
  const { write, medicalWrite } = await searchParams;
  const query = new URLSearchParams();
  if (write) query.set("write", write);
  if (medicalWrite) query.set("medicalWrite", medicalWrite);
  const suffix = query.toString();
  redirect(suffix ? `/body/profile?${suffix}` : "/body/profile");
}

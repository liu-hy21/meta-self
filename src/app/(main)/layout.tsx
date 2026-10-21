import { MainShell } from "@/components/shell/main-shell";
import { getBodyBoard } from "@/lib/queries/body";
import { getAppUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getAppUser();
  const board = await getBodyBoard(user.id);

  return <MainShell board={board}>{children}</MainShell>;
}

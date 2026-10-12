import { EvidenceRail } from "@/components/shell/evidence-rail";
import { LeftRail } from "@/components/shell/left-rail";
import { TopBar } from "@/components/shell/top-bar";
import { getBodyBoard } from "@/lib/queries/body";
import { getAppUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getAppUser();
  const board = await getBodyBoard(user.id);

  return (
    <div className="h-full p-4">
    <div className="monitor flex h-full min-h-0 overflow-hidden">
      <LeftRail items={board.items} />
      <div className="flex min-h-0 min-w-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TopBar />
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </div>
        <EvidenceRail evidence={board.evidence} />
      </div>
    </div>
    </div>
  );
}

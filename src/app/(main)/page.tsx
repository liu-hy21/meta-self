import { BoardView } from "@/components/board/board-view";
import { loadBoardSnapshot } from "@/lib/board/snapshot";
import { getAppUser } from "@/lib/user";

export default async function BodyTodayPage() {
  const user = await getAppUser();
  const snapshot = await loadBoardSnapshot(user.id);
  return <BoardView snapshot={snapshot} />;
}

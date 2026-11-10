import { notFound } from "next/navigation";

import { ChatReader } from "@/components/relation/chat-reader";
import { RelationWorkbenchNav } from "@/components/relation/relation-workbench-nav";
import { loadChatArchive } from "@/lib/relation/chat-archive";
import { CHAT_PAGE_SIZE } from "@/lib/relation/chat-pagination";
import type { ChatMessageKind, RelationSenderFilter } from "@/lib/relation/types";
import { getRelationPerson } from "@/lib/relation/people";
import { getAppUser } from "@/lib/user";

export default async function RelationChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ personId: string }>;
  searchParams: Promise<{ start?: string; end?: string; search?: string; sender?: string; kind?: string; page?: string }>;
}) {
  const user = await getAppUser();
  const { personId } = await params;
  const query = await searchParams;
  const person = await getRelationPerson(user.id, personId);
  if (!person) notFound();
  if (!person.archive) {
    return <div className="relation-workbench"><RelationWorkbenchNav personId={person.id} personName={person.name} /><div className="relation-empty relation-empty--large">这个人物还没有连接聊天档案。</div></div>;
  }

  const start = query.start || person.archive.periodStart;
  const end = query.end || person.archive.periodEnd;
  const sender: RelationSenderFilter = query.sender === "self" || query.sender === "other" ? query.sender : "all";
  const kinds = new Set<ChatMessageKind>(["text", "image", "voice", "video", "emoji", "system", "location", "card", "voip", "other"]);
  const kind = query.kind && kinds.has(query.kind as ChatMessageKind) ? query.kind as ChatMessageKind : "all";
  const pageValue = query.page ? Number(query.page) : NaN;
  const currentPage = Number.isInteger(pageValue) && pageValue >= 1 ? pageValue : 1;
  const page = await loadChatArchive(person.archive.sourceKey, {
    start,
    end,
    search: query.search?.trim(),
    sender,
    kind,
    pageSize: CHAT_PAGE_SIZE,
    cursor: (currentPage - 1) * CHAT_PAGE_SIZE,
  });

  return (
    <div className="relation-workbench">
      <RelationWorkbenchNav personId={person.id} personName={person.name} />
      <ChatReader personId={person.id} page={page} filters={{ start, end, search: query.search || "", sender, kind, page: currentPage }} />
    </div>
  );
}

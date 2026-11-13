import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";
import { RelationWorkbenchNav } from "@/components/relation/relation-workbench-nav";
import { PersonaPanel } from "@/components/relation/persona-panel";
import { PERSONA_DATA_RANGE, type PersonaPack } from "@/lib/relation/persona-core";
import { loadAllChatMessages } from "@/lib/relation/chat-archive";
import { summarizePersonaSpeakers } from "@/lib/relation/persona-style";
import { getLlmSettingsStatus } from "@/lib/llm-config";

export default async function PersonaPage({ params }: { params: Promise<{ personId: string }> }) {
  const { personId } = await params;
  const user = await getAppUser();
  const llmStatus = await getLlmSettingsStatus(user.id);
  const person = await prisma.relationPerson.findFirst({ where: { id: personId, userId: user.id }, select: { name: true, archives: { select: { sourceKey: true }, orderBy: { importedAt: "desc" }, take: 1 } } });
  if (!person) notFound();
  const archive = person.archives[0];
  const messages = archive ? await loadAllChatMessages(archive.sourceKey) : [];
  const speakerStats = summarizePersonaSpeakers(messages.filter((message) => message.day >= PERSONA_DATA_RANGE.start && message.day <= PERSONA_DATA_RANGE.end));
  const ids = await prisma.relationAiReport.findMany({ where: { personId, userId: user.id, status: "PERSONA" }, select: { id: true }, orderBy: { createdAt: "desc" }, take: 20 });
  const rows = await prisma.relationAiReport.findMany({ where: { id: { in: ids.map(r => r.id) }, userId: user.id }, select: { id: true, evidenceJson: true } });
  const reports = ids.map(r => rows.find(row => row.id === r.id)!);
  return <div className="relation-workbench"><RelationWorkbenchNav personId={personId} personName={person.name} />{person.archives.length ? <PersonaPanel personId={personId} name={person.name} initial={reports.map(r => ({ id: r.id, pack: r.evidenceJson as unknown as PersonaPack }))} configured={llmStatus.configured} speakerStats={speakerStats} /> : <div className="relation-empty">请先连接聊天档案。</div>}</div>;
}

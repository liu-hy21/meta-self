import Link from "next/link";

import { analyzeRelationPersonAction } from "@/app/actions/data";
import type { RelationPersonWithArchive } from "@/lib/relation/people";

const kindLabels = { FRIEND: "朋友", ROMANCE: "亲密", FAMILY: "家人", OTHER: "其他" } as const;

export function PeopleList({ people, activeId }: { people: RelationPersonWithArchive[]; activeId?: string }) {
  return (
    <div className="relation-people-list">
      {people.map((person, index) => {
        const active = person.id === activeId;
        const isAnalyzed = person.archive?.analysisStatus === "ANALYZED";
        return (
          <div key={person.id} className={`relation-person-row ${active ? "is-active" : ""}`}>
            <Link href={`/relation/people/${person.id}`} className="relation-person-link">
              <span className="relation-person-copy">
                <strong>{person.name}</strong>
                <span>{person.kinds.map((kind) => kindLabels[kind]).join(" / ") || "未分类"}</span>
              </span>
              <span className="relation-person-meta">
                <span className={person.archive?.available ? "status-dot is-on" : "status-dot"} />
                <small>{String(index + 1).padStart(2, "0")}</small>
              </span>
            </Link>
            {person.archive ? (
              <div className="relation-analysis-control">
                <span className={`relation-analysis-status ${isAnalyzed ? "is-done" : ""}`}>{isAnalyzed ? "已分析" : "待分析"}</span>
                <form action={analyzeRelationPersonAction}>
                  <input type="hidden" name="personId" value={person.id} />
                  <button type="submit" className="relation-analysis-button">{isAnalyzed ? "重新分析" : "计算分析"}</button>
                </form>
              </div>
            ) : null}
          </div>
        );
      })}
      {people.length === 0 ? <p className="relation-empty">还没有关系人。先添加一个人物档案。</p> : null}
    </div>
  );
}

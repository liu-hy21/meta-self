"use client";

import { Suspense } from "react";

import { EvidenceRail } from "@/components/shell/evidence-rail";
import { LogRailProvider } from "@/components/shell/log-rail-context";
import { LeftRail } from "@/components/shell/left-rail";
import { TopBar } from "@/components/shell/top-bar";
import type { BodyBoard } from "@/lib/queries/body";

export function MainShell({ board, children }: { board: BodyBoard; children: React.ReactNode }) {
  return (
    <LogRailProvider defaultEvidence={board.evidence}>
      <div className="h-full p-4">
        <div className="monitor flex h-full min-h-0 overflow-hidden">
          <LeftRail items={board.items} />
          <div className="flex min-h-0 min-w-0 flex-1">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <TopBar />
              <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            </div>
            <Suspense
              fallback={
                <aside className="flex w-[280px] shrink-0 flex-col border-l-4 border-[var(--ink)] bg-[var(--panel)]" />
              }
            >
              <EvidenceRail />
            </Suspense>
          </div>
        </div>
      </div>
    </LogRailProvider>
  );
}

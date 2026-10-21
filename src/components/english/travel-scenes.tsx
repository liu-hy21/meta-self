"use client";

import { useState } from "react";

import { travelScenes } from "@/lib/english-travel";

export function TravelScenes() {
  const [sceneId, setSceneId] = useState(travelScenes[0].id);
  const scene = travelScenes.find((s) => s.id === sceneId) ?? travelScenes[0];
  const [topicId, setTopicId] = useState(scene.topics[0].id);
  const topic = scene.topics.find((t) => t.id === topicId) ?? scene.topics[0];

  function pickScene(id: string) {
    const next = travelScenes.find((s) => s.id === id);
    if (!next) return;
    setSceneId(id);
    setTopicId(next.topics[0].id);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <nav aria-label="旅行场景" className="flex flex-col gap-3">
        {travelScenes.map((s) => {
          const active = s.id === scene.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => pickScene(s.id)}
              aria-pressed={active}
              className={`group relative border-2 border-[var(--ink)] p-3 text-left transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] ${
                active
                  ? "translate-x-1 bg-[var(--gold)] shadow-[4px_4px_0_var(--ink)]"
                  : "bg-[var(--panel)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--ink)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-2xl font-bold leading-none tabular-nums">{s.index}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{s.subtitle}</p>
                </div>
              </div>
              <p className="mt-3 border-t-2 border-dashed border-[var(--ink)]/40 pt-2 font-mono text-[10px] uppercase tracking-[0.2em]">
                {s.place} · {s.topics.length} 项
              </p>
            </button>
          );
        })}
      </nav>

      <section className="pixel-box min-w-0 overflow-hidden">
        <header className="relative border-b-4 border-[var(--ink)] bg-[var(--ink)] px-5 py-4 text-[var(--panel)]">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-70">Scene {scene.index}</p>
          <h3 className="mt-1 text-lg font-semibold">{scene.title}</h3>
          <p className="mt-0.5 text-xs opacity-80">{scene.subtitle}</p>
          <span
            aria-hidden
            className="absolute top-3 right-4 border-2 border-[var(--panel)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest"
          >
            {scene.place}
          </span>
        </header>

        {scene.topics.length > 1 ? (
          <div role="tablist" aria-label="子项" className="flex flex-wrap gap-2 border-b-2 border-[var(--ink)] bg-[#faf6eb] px-4 py-3">
            {scene.topics.map((t, i) => {
              const active = t.id === topic.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTopicId(t.id)}
                  className={`flex h-8 items-center gap-1.5 border-2 border-[var(--ink)] px-3 text-sm leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] ${
                    active ? "bg-[var(--gold)] shadow-[2px_2px_0_var(--ink)]" : "bg-[var(--panel)] hover:bg-[#f3e6cc]"
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-60">{String(i + 1).padStart(2, "0")}</span>
                  {t.title}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="p-4 sm:p-5">
          <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <span aria-hidden className="size-2 bg-[var(--gold-deep)]" />
            {topic.title}
          </h4>
          <ol className="space-y-3">
            {topic.phrases.map((p, i) => {
              const staff = p.role === "staff";
              return (
                <li key={i} className={`flex ${staff ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[34rem] border-2 border-[var(--ink)] px-4 py-3 ${
                      staff ? "bg-[var(--panel)] shadow-[3px_3px_0_var(--ink)]" : "bg-[#fff4d6] shadow-[-3px_3px_0_var(--ink)]"
                    }`}
                  >
                    <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[var(--muted)]">
                      {staff ? "Staff · 对方" : "Me · 我"}
                    </p>
                    <p className="text-[15px] font-medium leading-6">{p.en}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{p.zh}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </div>
  );
}

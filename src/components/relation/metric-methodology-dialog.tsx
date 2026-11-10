"use client";

import { useEffect, useState } from "react";

import { buildRelationMetricMethodology } from "@/lib/relation/methodology";
import type { RelationMetrics } from "@/lib/relation/types";

export function MetricMethodologyDialog({ metrics }: { metrics: RelationMetrics }) {
  const [open, setOpen] = useState(false);
  const sections = buildRelationMetricMethodology(metrics);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button type="button" className="relation-methodology-button" onClick={() => setOpen(true)} aria-haspopup="dialog">
        指标说明
      </button>
      {open ? (
        <div className="relation-methodology-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="relation-methodology-dialog" role="dialog" aria-modal="true" aria-labelledby="relation-methodology-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className="relation-methodology-head">
              <div>
                <h2 id="relation-methodology-title">指标与计算口径</h2>
                <p>当前页面展示的是已保存的数据分析快照。下面列出所有指标的当前值、数据范围和计算规则。</p>
              </div>
              <button type="button" className="relation-methodology-close" onClick={() => setOpen(false)} aria-label="关闭指标说明">×</button>
            </header>
            <div className="relation-methodology-body">
              {sections.map((section) => (
                <section key={section.key} className="relation-methodology-section">
                  <div className="relation-methodology-section-head"><h3>{section.title}</h3><span>{section.note}</span></div>
                  <div className="relation-methodology-table">
                    {section.items.map((metric) => (
                      <article key={metric.key} className="relation-methodology-row">
                        <div><strong>{metric.label}</strong><span>{metric.value}</span></div>
                        <p>{metric.calculation}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <footer className="relation-methodology-foot"><span>口径固定于分析生成时；修改原文后需要回到人物管理重新计算。</span><button type="button" className="relation-action relation-action--dark" onClick={() => setOpen(false)}>知道了</button></footer>
          </section>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";

import { createRelationMetricLedgerAction } from "@/app/actions/data";

export function MetricLedgerCreate({ personId }: { personId: string }) {
  const [open, setOpen] = useState(false);

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
      <button type="button" className="relation-ledger-add-button" onClick={() => setOpen(true)}>新增指标 <span>＋</span></button>
      {open ? (
        <div className="relation-ledger-modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="relation-ledger-modal" role="dialog" aria-modal="true" aria-labelledby="relation-ledger-create-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className="relation-ledger-modal-head">
              <div><h2 id="relation-ledger-create-title">新增指标</h2><p>定义一个需要长期追踪的指标，并写清楚它的计算边界。</p></div>
              <button type="button" className="relation-methodology-close" onClick={() => setOpen(false)} aria-label="关闭新增指标弹窗">×</button>
            </header>
            <form action={createRelationMetricLedgerAction} className="relation-ledger-modal-form" onSubmit={() => setOpen(false)}>
              <input type="hidden" name="personId" value={personId} />
              <label><span>指标名称</span><input name="name" placeholder="例如：周末主动发起比例" required autoFocus /></label>
              <label><span>计算口径</span><textarea name="calculation" rows={5} placeholder="说明数据范围、筛选条件、时间窗口和计算方式" required /></label>
              <footer><button type="button" className="relation-ledger-cancel" onClick={() => setOpen(false)}>取消</button><button type="submit" className="relation-action relation-action--dark">确认新增</button></footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

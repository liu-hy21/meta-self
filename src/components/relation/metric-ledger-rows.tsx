"use client";

import { useEffect, useState } from "react";

import { updateRelationMetricLedgerAction } from "@/app/actions/data";

type LedgerRow = { id: string; name: string; calculation: string };
const PAGE_SIZE = 10;

export function MetricLedgerRows({ personId, entries, targetMetricId }: { personId: string; entries: LedgerRow[]; targetMetricId?: string }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const targetIndex = targetMetricId ? entries.findIndex((entry) => entry.id === targetMetricId) : -1;
  const targetPage = targetIndex >= 0 ? Math.floor(targetIndex / PAGE_SIZE) + 1 : 1;
  const [page, setPage] = useState(targetPage);
  const currentPage = Math.min(page, totalPages);
  const visibleEntries = entries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  useEffect(() => {
    if (!targetMetricId || targetMetricId !== entries[targetIndex]?.id || currentPage !== targetPage) return;
    const frame = window.requestAnimationFrame(() => document.getElementById(`metric-ledger-${targetMetricId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
    return () => window.cancelAnimationFrame(frame);
  }, [currentPage, entries, targetIndex, targetMetricId, targetPage]);

  return (
    <>
      {visibleEntries.map((entry, index) => editingId === entry.id ? (
        <form key={entry.id} id={`metric-ledger-${entry.id}`} action={updateRelationMetricLedgerAction} className="relation-ledger-row relation-ledger-row--editing" onSubmit={() => setEditingId(null)}>
          <input type="hidden" name="personId" value={personId} />
          <input type="hidden" name="id" value={entry.id} />
          <label><span className="sr-only">指标名称</span><input name="name" defaultValue={entry.name} required aria-label={`指标名称 ${index + 1}`} /></label>
          <label><span className="sr-only">计算口径</span><textarea name="calculation" defaultValue={entry.calculation} rows={2} required aria-label={`计算口径 ${index + 1}`} /></label>
          <div className="relation-ledger-actions"><button type="submit" className="relation-ledger-confirm">确认</button><button type="button" className="relation-ledger-cancel" onClick={() => setEditingId(null)}>取消</button></div>
        </form>
      ) : (
        <div key={entry.id} id={`metric-ledger-${entry.id}`} className="relation-ledger-row relation-ledger-row--readonly">
          <div className="relation-ledger-readable"><strong>{entry.name}</strong></div>
          <p className="relation-ledger-readable">{entry.calculation}</p>
          <button type="button" className="relation-ledger-edit" onClick={() => setEditingId(entry.id)}>编辑</button>
        </div>
      ))}
      {totalPages > 1 ? <nav className="relation-ledger-pagination" aria-label="指标台账分页"><button type="button" onClick={() => { setEditingId(null); setPage(Math.max(1, currentPage - 1)); }} disabled={currentPage === 1}>上一页</button>{pageNumbers.map((pageNumber) => <button key={pageNumber} type="button" className={pageNumber === currentPage ? "is-active" : undefined} onClick={() => { setEditingId(null); setPage(pageNumber); }} aria-current={pageNumber === currentPage ? "page" : undefined}>{pageNumber}</button>)}<button type="button" onClick={() => { setEditingId(null); setPage(Math.min(totalPages, currentPage + 1)); }} disabled={currentPage === totalPages}>下一页</button><span>第 {currentPage} / {totalPages} 页</span></nav> : null}
    </>
  );
}

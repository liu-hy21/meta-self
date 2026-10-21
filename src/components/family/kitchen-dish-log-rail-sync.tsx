"use client";

import { useEffect } from "react";

import { useLogRail } from "@/components/shell/log-rail-context";

/** 离开看板或厨房页时清空右侧栏菜品详情 */
export function KitchenDishLogRailSync({ boardMode }: { boardMode: boolean }) {
  const { clearOverride } = useLogRail();

  useEffect(() => {
    if (!boardMode) {
      clearOverride();
    }
    return () => clearOverride();
  }, [boardMode, clearOverride]);

  return null;
}

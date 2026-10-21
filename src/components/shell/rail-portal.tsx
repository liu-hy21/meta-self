"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useLogRail } from "@/components/shell/log-rail-context";

/** 把当前页的日志放进壳层右侧竖栏。竖栏是否出现由路由决定。 */
export function RailPortal({ children }: { children: React.ReactNode }) {
  const { railSlot } = useLogRail();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !railSlot) return null;
  return createPortal(children, railSlot);
}

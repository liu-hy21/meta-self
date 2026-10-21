"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { BodyEvidence } from "@/lib/queries/body";

export type KitchenDishLogDetail = {
  id: string;
  name: string;
  ingredients: string | null;
  cookingProcess: string | null;
};

type LogRailOverride =
  | { kind: "kitchen-dish"; dish: KitchenDishLogDetail }
  | null;

type LogRailContextValue = {
  defaultEvidence: BodyEvidence;
  override: LogRailOverride;
  railSlot: HTMLDivElement | null;
  setRailSlot: (node: HTMLDivElement | null) => void;
  selectedKitchenDishId: string | null;
  setKitchenDishDetail: (dish: KitchenDishLogDetail | null) => void;
  clearOverride: () => void;
};

const LogRailContext = createContext<LogRailContextValue | null>(null);

export function LogRailProvider({
  defaultEvidence,
  children,
}: {
  defaultEvidence: BodyEvidence;
  children: React.ReactNode;
}) {
  const [override, setOverride] = useState<LogRailOverride>(null);
  const [railSlot, setRailSlot] = useState<HTMLDivElement | null>(null);

  const setKitchenDishDetail = useCallback((dish: KitchenDishLogDetail | null) => {
    if (!dish) {
      setOverride(null);
      return;
    }
    setOverride({ kind: "kitchen-dish", dish });
  }, []);

  const clearOverride = useCallback(() => setOverride(null), []);

  const value = useMemo(
    () => ({
      defaultEvidence,
      override,
      railSlot,
      setRailSlot,
      selectedKitchenDishId: override?.kind === "kitchen-dish" ? override.dish.id : null,
      setKitchenDishDetail,
      clearOverride,
    }),
    [defaultEvidence, override, railSlot, setKitchenDishDetail, clearOverride],
  );

  return <LogRailContext.Provider value={value}>{children}</LogRailContext.Provider>;
}

export function useLogRail() {
  const ctx = useContext(LogRailContext);
  if (!ctx) {
    throw new Error("useLogRail must be used within LogRailProvider");
  }
  return ctx;
}

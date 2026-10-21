import type { DishDifficulty, KitchenCleaningCadence, SeasoningUsageFrequency } from "@prisma/client";

export type KitchenActionState = { ok: true } | null;

export type KitchenViewMode = "record" | "board";

export function parseKitchenViewMode(raw: string | undefined): KitchenViewMode {
  return raw === "record" ? "record" : "board";
}

export const kitchenUsageFrequencies: { value: SeasoningUsageFrequency; label: string }[] = [
  { value: "HIGH", label: "高" },
  { value: "MEDIUM", label: "中" },
  { value: "LOW", label: "低" },
];

const usageFrequencySet = new Set<string>(kitchenUsageFrequencies.map((f) => f.value));

const usageFrequencyRank = new Map(kitchenUsageFrequencies.map((f, i) => [f.value, i]));

export function compareKitchenUsageFrequency(a: SeasoningUsageFrequency, b: SeasoningUsageFrequency) {
  return (usageFrequencyRank.get(a) ?? 99) - (usageFrequencyRank.get(b) ?? 99);
}

export function compareKitchenPantryItems<T extends { name: string; usageFrequency: SeasoningUsageFrequency }>(
  a: T,
  b: T,
) {
  const byFreq = compareKitchenUsageFrequency(a.usageFrequency, b.usageFrequency);
  if (byFreq !== 0) return byFreq;
  return a.name.localeCompare(b.name, "zh-CN");
}

export function kitchenUsageFrequencyLabel(frequency: SeasoningUsageFrequency) {
  return kitchenUsageFrequencies.find((f) => f.value === frequency)?.label ?? frequency;
}

export function parseKitchenUsageFrequency(raw: string): SeasoningUsageFrequency | null {
  return usageFrequencySet.has(raw) ? (raw as SeasoningUsageFrequency) : null;
}

export type KitchenModule = "seasoning" | "vegetable" | "meat";

export type KitchenPageQueryParams = {
  mode?: KitchenViewMode;
  seasoningWrite?: boolean;
  seasoningEdit?: string;
  vegetableWrite?: boolean;
  vegetableEdit?: string;
  meatWrite?: boolean;
  meatEdit?: string;
  dishWrite?: DishDifficulty;
  dishEdit?: string;
  cleaningWrite?: KitchenCleaningCadence;
  cleaningEdit?: string;
};

export function kitchenPageQuery(params: KitchenPageQueryParams = {}) {
  const q = new URLSearchParams();
  if (params.mode === "record") q.set("mode", "record");
  if (params.seasoningWrite) q.set("sw", "1");
  if (params.seasoningEdit) q.set("se", params.seasoningEdit);
  if (params.vegetableWrite) q.set("vw", "1");
  if (params.vegetableEdit) q.set("ve", params.vegetableEdit);
  if (params.meatWrite) q.set("mw", "1");
  if (params.meatEdit) q.set("me", params.meatEdit);
  if (params.dishWrite) q.set("dw", params.dishWrite);
  if (params.dishEdit) q.set("dx", params.dishEdit);
  if (params.cleaningWrite) q.set("clw", params.cleaningWrite);
  if (params.cleaningEdit) q.set("clx", params.cleaningEdit);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function kitchenModuleWriteQuery(module: KitchenModule): KitchenPageQueryParams {
  if (module === "seasoning") return { seasoningWrite: true };
  if (module === "vegetable") return { vegetableWrite: true };
  return { meatWrite: true };
}

export function kitchenModuleEditQuery(module: KitchenModule, id: string): KitchenPageQueryParams {
  if (module === "seasoning") return { seasoningEdit: id };
  if (module === "vegetable") return { vegetableEdit: id };
  return { meatEdit: id };
}

export function kitchenModuleIdPrefix(module: KitchenModule) {
  return module;
}

export function parseKitchenSearchParams(raw: {
  mode?: string;
  sw?: string;
  se?: string;
  vw?: string;
  ve?: string;
  mw?: string;
  me?: string;
  dw?: string;
  dx?: string;
  clw?: string;
  clx?: string;
  write?: string;
  edit?: string;
}) {
  const dishWrite =
    raw.dw === "LOW" || raw.dw === "MEDIUM" || raw.dw === "HIGH" ? (raw.dw as DishDifficulty) : undefined;
  const cleaningWrite =
    raw.clw === "DAILY" || raw.clw === "WEEKLY" || raw.clw === "MONTHLY"
      ? (raw.clw as KitchenCleaningCadence)
      : undefined;
  const mode = parseKitchenViewMode(raw.mode);

  return {
    mode,
    seasoningWrite: raw.sw === "1" || raw.write === "1",
    seasoningEdit: raw.se ?? raw.edit,
    vegetableWrite: raw.vw === "1",
    vegetableEdit: raw.ve,
    meatWrite: raw.mw === "1",
    meatEdit: raw.me,
    dishWrite,
    dishEdit: raw.dx,
    cleaningWrite,
    cleaningEdit: raw.clx,
  };
}

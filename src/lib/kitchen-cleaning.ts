import type { KitchenCleaningCadence } from "@prisma/client";

import { kitchenPageQuery, type KitchenPageQueryParams } from "@/lib/kitchen";

export const cleaningCadences: { value: KitchenCleaningCadence; label: string; columnTitle: string }[] = [
  { value: "DAILY", label: "每日", columnTitle: "每日" },
  { value: "WEEKLY", label: "每周", columnTitle: "每周" },
  { value: "MONTHLY", label: "每月", columnTitle: "每月" },
];

const cadenceSet = new Set<string>(cleaningCadences.map((c) => c.value));

export function cleaningCadenceColumnTitle(cadence: KitchenCleaningCadence) {
  return cleaningCadences.find((c) => c.value === cadence)?.columnTitle ?? cadence;
}

export function parseCleaningCadence(raw: string): KitchenCleaningCadence | null {
  return cadenceSet.has(raw) ? (raw as KitchenCleaningCadence) : null;
}

export function cleaningWriteQuery(cadence: KitchenCleaningCadence): KitchenPageQueryParams {
  return { cleaningWrite: cadence };
}

export function cleaningEditQuery(id: string): KitchenPageQueryParams {
  return { cleaningEdit: id };
}

export function cleaningKitchenHref(params: KitchenPageQueryParams = {}) {
  return `/library/family/kitchen${kitchenPageQuery(params)}`;
}

export function compareKitchenCleanings<T extends { name: string }>(a: T, b: T) {
  return a.name.localeCompare(b.name, "zh-CN");
}

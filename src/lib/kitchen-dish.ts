import type { DishDifficulty } from "@prisma/client";

import { kitchenPageQuery, type KitchenPageQueryParams } from "@/lib/kitchen";

export const dishDifficulties: { value: DishDifficulty; label: string; columnTitle: string }[] = [
  { value: "LOW", label: "低", columnTitle: "难度低" },
  { value: "MEDIUM", label: "中", columnTitle: "难度中" },
  { value: "HIGH", label: "高", columnTitle: "难度高" },
];

const difficultySet = new Set<string>(dishDifficulties.map((d) => d.value));

export function dishDifficultyColumnTitle(difficulty: DishDifficulty) {
  return dishDifficulties.find((d) => d.value === difficulty)?.columnTitle ?? difficulty;
}

export function parseDishDifficulty(raw: string): DishDifficulty | null {
  return difficultySet.has(raw) ? (raw as DishDifficulty) : null;
}

export function dishWriteQuery(difficulty: DishDifficulty): KitchenPageQueryParams {
  return { dishWrite: difficulty };
}

export function dishEditQuery(id: string): KitchenPageQueryParams {
  return { dishEdit: id };
}

export function dishKitchenHref(params: KitchenPageQueryParams = {}) {
  return `/library/family/kitchen${kitchenPageQuery(params)}`;
}

export function compareKitchenDishes<T extends { name: string }>(a: T, b: T) {
  return a.name.localeCompare(b.name, "zh-CN");
}

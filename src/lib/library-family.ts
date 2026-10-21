export const familySections = [
  { slug: "kitchen", label: "厨房" },
  { slug: "chores", label: "家务" },
  { slug: "support", label: "客服" },
] as const;

export type FamilySectionSlug = (typeof familySections)[number]["slug"];

export const defaultFamilySection: FamilySectionSlug = familySections[0].slug;

export function familySectionLabel(slug: string) {
  return familySections.find((section) => section.slug === slug)?.label ?? null;
}

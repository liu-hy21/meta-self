export const englishSections = [{ slug: "travel", label: "旅行" }] as const;

export type EnglishSectionSlug = (typeof englishSections)[number]["slug"];

export const defaultEnglishSection: EnglishSectionSlug = englishSections[0].slug;

export function englishSectionLabel(slug: string) {
  return englishSections.find((section) => section.slug === slug)?.label ?? null;
}

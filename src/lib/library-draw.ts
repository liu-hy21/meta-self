export const drawTools = [
  { slug: "blender", label: "blender" },
  { slug: "drawio", label: "drawio" },
] as const;

export type DrawToolSlug = (typeof drawTools)[number]["slug"];

export const defaultDrawTool: DrawToolSlug = drawTools[0].slug;

export function drawToolLabel(slug: string) {
  return drawTools.find((tool) => tool.slug === slug)?.label ?? null;
}

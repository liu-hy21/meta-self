export const articleTopics = [
  { slug: "ai", label: "AI" },
  { slug: "business", label: "商业" },
  { slug: "finance", label: "财商" },
  { slug: "subjectivity", label: "主体性" },
] as const;

export type ArticleTopicSlug = (typeof articleTopics)[number]["slug"];

export const defaultArticleTopic: ArticleTopicSlug = articleTopics[0].slug;

export function articleTopicLabel(slug: string) {
  return articleTopics.find((topic) => topic.slug === slug)?.label ?? null;
}

/** 正文行数（按换行符），用于列表从少到多排序 */
export function articleBodyLineCount(body: string) {
  if (body.length === 0) return 0;
  return body.split(/\r?\n/).length;
}

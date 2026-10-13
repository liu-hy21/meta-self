import { redirect } from "next/navigation";

import { defaultArticleTopic } from "@/lib/library-article";

export default function ArticleLibraryIndexPage() {
  redirect(`/library/article/${defaultArticleTopic}`);
}

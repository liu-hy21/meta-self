import { redirect } from "next/navigation";

import { defaultEnglishSection } from "@/lib/library-english";

export default function EnglishIndexPage() {
  redirect(`/english/${defaultEnglishSection}`);
}

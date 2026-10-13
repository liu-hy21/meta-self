import { redirect } from "next/navigation";

import { defaultDrawTool } from "@/lib/library-draw";

export default function DrawLibraryIndexPage() {
  redirect(`/library/draw/${defaultDrawTool}`);
}

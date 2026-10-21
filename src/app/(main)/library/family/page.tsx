import { redirect } from "next/navigation";

import { defaultFamilySection } from "@/lib/library-family";

export default function FamilyLibraryIndexPage() {
  redirect(`/library/family/${defaultFamilySection}`);
}

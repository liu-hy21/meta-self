export type SnapshotModalKind = "measure" | "exam" | "sleep" | "medical";

export function resolveSnapshotModalOpen(params: {
  measureWrite?: string;
  examWrite?: string;
  sleepWrite?: string;
  medicalWrite?: string;
}): SnapshotModalKind | null {
  if (params.measureWrite === "1") return "measure";
  if (params.examWrite === "1") return "exam";
  if (params.sleepWrite === "1") return "sleep";
  if (params.medicalWrite === "1") return "medical";
  return null;
}

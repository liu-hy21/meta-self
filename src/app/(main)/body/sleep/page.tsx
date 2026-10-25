import { redirect } from "next/navigation";

export default function SleepPage() {
  redirect("/body/profile?sleepWrite=1");
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect } from "react";

import { kitchenPageQuery, parseKitchenViewMode, type KitchenActionState } from "@/lib/kitchen";

export type KitchenFormAction = (
  previousState: KitchenActionState,
  formData: FormData,
) => Promise<KitchenActionState>;

const kitchenListPath = "/library/family/kitchen";

export function KitchenActionForm({
  action,
  className,
  children,
}: {
  action: KitchenFormAction;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction] = useActionState(action, null);

  useEffect(() => {
    if (state?.ok) {
      const mode = parseKitchenViewMode(searchParams.get("mode") ?? undefined);
      const href = `${kitchenListPath}${kitchenPageQuery({ mode })}`;
      router.replace(href, { scroll: false });
    }
  }, [state, router, searchParams]);

  return (
    <form action={formAction} className={className}>
      {children}
    </form>
  );
}

import Link from "next/link";

import { upsertFinanceProfile } from "@/app/actions/data";
import { SaveButton } from "@/components/body/save-button";
import { DistrictBlock } from "@/components/play/district-block";
import { TravelBlock } from "@/components/play/travel-block";
import { backClass, fieldClass, labelClass, pageWrap, submitClass } from "@/components/ui/form-shell";
import { prisma } from "@/lib/db";
import { getAppUser } from "@/lib/user";

const moneyFields = [
  ["cashYuan", "cashCents", "现金"],
  ["investmentYuan", "investmentCents", "投资"],
  ["liabilityYuan", "liabilityCents", "负债"],
] as const;

function yuanInput(cents: number | null | undefined) {
  if (cents == null) return "";
  return String(cents / 100);
}

function yuanText(cents: number | null | undefined) {
  if (cents == null) return "未填";
  return `${(cents / 100).toLocaleString("zh-CN", { maximumFractionDigits: 2 })} 元`;
}

export default async function FinanceProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; tab?: string; trip?: string; add?: string }>;
}) {
  const user = await getAppUser();
  const [{ edit, tab, trip, add }, finance, trips, districts] = await Promise.all([
    searchParams,
    prisma.financeProfile.findUnique({ where: { userId: user.id } }),
    prisma.trip.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { entries: { orderBy: [{ sortAt: "asc" }, { createdAt: "asc" }] } },
    }),
    prisma.playDistrict.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const playTab = tab === "play";
  const editingMoney = !playTab && edit === "1";

  return (
    <div className={pageWrap}>
      <div className="flex gap-2">
        <Tab href="/finance/profile" label="财商" active={!playTab} />
        <Tab href="/finance/profile?tab=play" label="玩商" active={playTab} />
      </div>

      {playTab ? (
        <>
        <TravelBlock trips={trips} edit={edit} tripId={trip} add={add} />
        <DistrictBlock districts={districts} edit={edit} />
        </>
      ) : (
        <section className="pixel-box p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">资产</h2>
            {editingMoney ? (
              <Link href="/finance/profile" className={backClass}>
                返回
              </Link>
            ) : (
              <Link href="/finance/profile?edit=1" className={submitClass()}>
                修改
              </Link>
            )}
          </div>
          {editingMoney ? (
            <form action={upsertFinanceProfile} className="grid gap-4 sm:grid-cols-3">
              {moneyFields.map(([name, key, label]) => (
                <div key={name}>
                  <label className={labelClass()} htmlFor={name}>
                    {label}（元）
                  </label>
                  <input id={name} name={name} type="number" step="0.01" className={fieldClass()} defaultValue={yuanInput(finance?.[key])} />
                </div>
              ))}
              <div className="sm:col-span-3">
                <SaveButton />
              </div>
            </form>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {moneyFields.map(([name, key, label]) => (
                <article key={name} className="border-2 border-[var(--ink)] bg-[var(--panel)] px-4 py-3">
                  <p className="text-xs text-[var(--muted)]">{label}</p>
                  <p className="mt-1 text-sm text-[var(--gold-deep)]">{yuanText(finance?.[key])}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-8 items-center justify-center border-2 border-[var(--ink)] px-4 text-sm leading-none ${
        active ? "bg-[var(--gold)]" : "bg-[var(--panel)]"
      }`}
    >
      {label}
    </Link>
  );
}

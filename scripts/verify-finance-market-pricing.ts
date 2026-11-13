import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { financeHoldingConfigs, validateFinanceHoldingsForm } from "../src/lib/finance-holdings";

async function main() {
  const pricing = await import("../src/lib/finance-prices").catch(() => ({} as Record<string, unknown>));
  const sharesToAmountMinor = pricing.sharesToAmountMinor as ((quantityMinor: number, priceUsdMinor: number) => number) | undefined;
  const isFinancePriceStale = pricing.isFinancePriceStale as ((fetchedAt: Date | null, now?: Date) => boolean) | undefined;
  const parseNineQuantQuotePrice = pricing.parseNineQuantQuotePrice as ((payload: unknown) => number) | undefined;
  const resolveCachedFinancePrice = pricing.resolveCachedFinancePrice as
    | ((cachedPriceUsdMinor: number | null, cachedFetchedAt: Date | null, fetchedPriceUsdMinor: number | null, now?: Date) => {
        priceUsdMinor: number | null;
        fetchedAt: Date | null;
        usedFallback: boolean;
      })
    | undefined;
  const resolveFinancePrice = pricing.resolveFinancePrice as
    | ((
        cachedPriceUsdMinor: number | null,
        cachedFetchedAt: Date | null,
        fetchPrice: () => Promise<number>,
        now?: Date,
      ) => Promise<{
        priceUsdMinor: number | null;
        fetchedAt: Date | null;
        usedFallback: boolean;
        refreshed: boolean;
        unavailable: boolean;
      }>)
    | undefined;

  assert.equal(typeof sharesToAmountMinor, "function");
  assert.equal(typeof isFinancePriceStale, "function");
  assert.equal(typeof parseNineQuantQuotePrice, "function");
  assert.equal(typeof resolveCachedFinancePrice, "function");
  assert.equal(typeof resolveFinancePrice, "function");

  const now = new Date("2026-11-13T00:00:00.000Z");
  assert.equal(sharesToAmountMinor!(125, 40000), 50000);
  assert.equal(isFinancePriceStale!(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now), true);
  assert.equal(isFinancePriceStale!(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000), now), false);
  assert.equal(parseNineQuantQuotePrice!({ code: 0, data: { last: 400.12 } }), 40012);
  assert.throws(() => parseNineQuantQuotePrice!({ code: 0, data: {} }));

  assert.deepEqual(
    resolveCachedFinancePrice!(40000, new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000), null, now),
    { priceUsdMinor: 40000, fetchedAt: new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000), usedFallback: true },
  );

  let providerCalls = 0;
  const fresh = await resolveFinancePrice!(40000, new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), async () => {
    providerCalls += 1;
    return 41000;
  }, now);
  assert.equal(providerCalls, 0);
  assert.deepEqual(fresh, {
    priceUsdMinor: 40000,
    fetchedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    usedFallback: false,
    refreshed: false,
    unavailable: false,
  });

  const refreshed = await resolveFinancePrice!(40000, new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000), async () => 41000, now);
  assert.deepEqual(refreshed, {
    priceUsdMinor: 41000,
    fetchedAt: now,
    usedFallback: false,
    refreshed: true,
    unavailable: false,
  });

  const unavailable = await resolveFinancePrice!(null, null, async () => {
    throw new Error("provider unavailable");
  }, now);
  assert.deepEqual(unavailable, {
    priceUsdMinor: null,
    fetchedAt: null,
    usedFallback: false,
    refreshed: false,
    unavailable: true,
  });

  const formData = new FormData();
  for (const config of financeHoldingConfigs) formData.set(config.formKey, "0");
  formData.set("schwabQqq", "1.25");
  formData.set("schwabVoo", "2");
  const validated = validateFinanceHoldingsForm(formData);
  assert.equal(validated.ok, true);
  if (validated.ok) {
    assert.equal(validated.quantities.get("SCHWAB_QQQ"), 125);
    assert.equal(validated.quantities.get("SCHWAB_VOO"), 200);
    assert.equal(validated.amounts.get("SCHWAB_QQQ"), undefined);
    assert.equal(validated.amounts.get("SCHWAB_VOO"), undefined);
  }

  const schema = await readFile("prisma/schema.prisma", "utf8");
  assert.match(schema, /quantityMinor\s+Int\?/);
  assert.match(schema, /priceUsdMinor\s+Int\?/);
  assert.match(schema, /priceFetchedAt\s+DateTime\?/);

  const formSource = await readFile("src/components/finance/finance-holdings-form.tsx", "utf8");
  const sectionSource = await readFile("src/components/finance/finance-assets-section.tsx", "utf8");
  assert.match(formSource, /股/);
  assert.match(formSource, /price-unavailable/);
  assert.match(sectionSource, /priceUsdMinor/);

  console.log("PASS finance market pricing primitives");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

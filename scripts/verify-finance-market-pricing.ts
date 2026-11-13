import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  accountAllocation,
  allocationOrder,
  computeAllocationCnyMinor,
  financeHoldingConfigs,
  schwabHoldingConfigs,
  validateFinanceHoldingsForm,
} from "../src/lib/finance-holdings";

async function main() {
  const pricing = await import("../src/lib/finance-prices").catch(() => ({} as Record<string, unknown>));
  const sharesToAmountMinor = pricing.sharesToAmountMinor as ((quantityMinor: number, priceUsdMinor: number) => number) | undefined;
  const isFinancePriceStale = pricing.isFinancePriceStale as ((fetchedAt: Date | null, now?: Date) => boolean) | undefined;
  const parseNineQuantQuotePrice = pricing.parseNineQuantQuotePrice as ((payload: unknown) => number) | undefined;
  const parseGoldPricePerGram = pricing.parseGoldPricePerGram as ((payload: unknown) => number) | undefined;
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
  assert.equal(typeof parseGoldPricePerGram, "function");
  assert.equal(typeof resolveCachedFinancePrice, "function");
  assert.equal(typeof resolveFinancePrice, "function");

  const now = new Date("2026-11-13T00:00:00.000Z");
  assert.equal(sharesToAmountMinor!(125, 40000), 50000);
  assert.equal(isFinancePriceStale!(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now), true);
  assert.equal(isFinancePriceStale!(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000), now), false);
  assert.equal(parseNineQuantQuotePrice!({ code: 0, data: { last: 400.12 } }), 40012);
  assert.throws(() => parseNineQuantQuotePrice!({ code: 0, data: {} }));
  assert.equal(parseGoldPricePerGram!({ currency: "CNY", price_gram_24k: "839.56" }), 83956);
  assert.throws(() => parseGoldPricePerGram!({ currency: "USD", price_gram_24k: "839.56" }));

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
  formData.set("housingFund", "1234.56");
  formData.set("gold", "2.5");
  const validated = validateFinanceHoldingsForm(formData);
  assert.equal(validated.ok, true);
  if (validated.ok) {
    assert.equal(validated.quantities.get("SCHWAB_QQQ"), 125);
    assert.equal(validated.quantities.get("SCHWAB_VOO"), 200);
    assert.equal(validated.amounts.get("SCHWAB_QQQ"), undefined);
    assert.equal(validated.amounts.get("SCHWAB_VOO"), undefined);
    assert.equal(validated.amounts.get("HOUSING_FUND" as never), 123456);
    assert.equal(validated.quantities.get("GOLD" as never), 250);
  }

  const housingFund = (financeHoldingConfigs as Array<{ account: string; label: string; formKey: string }>).find(
    (config) => config.account === "HOUSING_FUND",
  );
  assert.equal(housingFund?.account, "HOUSING_FUND");
  assert.equal(housingFund?.label, "住房公积金");
  assert.equal(housingFund?.formKey, "housingFund");

  const technologySymbols = ["GOOG", "AAPL", "MSFT", "AMZN", "META"];
  for (const symbol of technologySymbols) {
    const config = financeHoldingConfigs.find((item) => item.priceSymbol === symbol);
    assert.equal(config?.inputKind, "shares");
    assert.equal(config?.label, symbol);
    assert.equal(config?.formKey, `schwab${symbol[0]}${symbol.slice(1).toLowerCase()}`);
    formData.set(config?.formKey ?? "", "1");
  }
  const technologyValidation = validateFinanceHoldingsForm(formData);
  assert.equal(technologyValidation.ok, true);
  if (technologyValidation.ok) {
    for (const symbol of technologySymbols) {
      const config = financeHoldingConfigs.find((item) => item.priceSymbol === symbol);
      assert.equal(technologyValidation.quantities.get(config!.account), 100);
    }
  }

  const consumerSymbols = ["MCD", "COKE"];
  for (const symbol of consumerSymbols) {
    const config = financeHoldingConfigs.find((item) => item.priceSymbol === symbol);
    assert.equal(config?.inputKind, "shares");
    assert.equal(config?.label, symbol);
    assert.equal(config?.formKey, `schwab${symbol[0]}${symbol.slice(1).toLowerCase()}`);
    formData.set(config?.formKey ?? "", "1");
  }
  const consumerValidation = validateFinanceHoldingsForm(formData);
  assert.equal(consumerValidation.ok, true);
  if (consumerValidation.ok) {
    for (const symbol of consumerSymbols) {
      const config = financeHoldingConfigs.find((item) => item.priceSymbol === symbol);
      assert.equal(consumerValidation.quantities.get(config!.account), 100);
    }
  }

  assert.deepEqual(
    allocationOrder.map((slice) => [slice.key, slice.label, slice.color]),
    [
      ["satellite", "高波动层", "#C62828"],
      ["tech", "科技防守层", "#EF6C00"],
      ["hedge", "防御层", "#C9A227"],
      ["broad", "压舱层", "#1E5AA8"],
      ["cash", "安全层", "#2E7D32"],
    ],
  );
  assert.equal(accountAllocation("SCHWAB_OTHER").key, "satellite");
  assert.equal(accountAllocation("EASTMONEY").key, "satellite");
  assert.equal(accountAllocation("BN").key, "satellite");
  assert.equal(accountAllocation("SCHWAB_GOOG").key, "tech");
  assert.equal(accountAllocation("SCHWAB_MCD").key, "hedge");
  assert.equal(accountAllocation("GOLD").key, "hedge");
  assert.equal(accountAllocation("SCHWAB_QQQ").key, "broad");
  assert.equal(accountAllocation("SCHWAB_VOO").key, "broad");
  assert.equal(accountAllocation("BANK_CARD").key, "cash");
  assert.equal(accountAllocation("HK_CARD").key, "cash");

  assert.deepEqual(schwabHoldingConfigs.map((config) => config.account), [
    "SCHWAB_OTHER",
    "SCHWAB_GOOG",
    "SCHWAB_AAPL",
    "SCHWAB_MSFT",
    "SCHWAB_AMZN",
    "SCHWAB_META",
    "SCHWAB_MCD",
    "SCHWAB_COKE",
    "SCHWAB_QQQ",
    "SCHWAB_VOO",
    "SCHWAB_CASH",
  ]);
  assert.deepEqual(
    financeHoldingConfigs.filter((config) => config.region === "domestic").map((config) => config.account),
    ["EASTMONEY", "BN", "GOLD", "BANK_CARD", "ALIPAY", "HOUSING_FUND"],
  );

  const allocationAmounts = new Map(financeHoldingConfigs.map((config) => [config.account, 0]));
  allocationAmounts.set("EASTMONEY", 10000);
  allocationAmounts.set("SCHWAB_GOOG", 20000);
  allocationAmounts.set("SCHWAB_MCD", 30000);
  allocationAmounts.set("SCHWAB_QQQ", 40000);
  allocationAmounts.set("BANK_CARD", 50000);
  const allocationByKey = new Map(computeAllocationCnyMinor(allocationAmounts).map((slice) => [slice.key, slice.cnyMinor]));
  assert.equal(allocationByKey.get("satellite"), 10000);
  assert.equal(allocationByKey.get("tech"), 148000);
  assert.equal(allocationByKey.get("hedge"), 222000);
  assert.equal(allocationByKey.get("broad"), 296000);
  assert.equal(allocationByKey.get("cash"), 50000);

  const schema = await readFile("prisma/schema.prisma", "utf8");
  assert.match(schema, /HOUSING_FUND/);
  assert.match(schema, /GOLD/);
  for (const symbol of technologySymbols) assert.match(schema, new RegExp(symbol));
  for (const symbol of consumerSymbols) assert.match(schema, new RegExp(symbol));
  assert.match(schema, /quantityMinor\s+Int\?/);
  assert.match(schema, /priceUsdMinor\s+Int\?/);
  assert.match(schema, /priceFetchedAt\s+DateTime\?/);

  const formSource = await readFile("src/components/finance/finance-holdings-form.tsx", "utf8");
  const sectionSource = await readFile("src/components/finance/finance-assets-section.tsx", "utf8");
  const holdingsSource = await readFile("src/lib/finance-holdings.ts", "utf8");
  assert.match(formSource, /股/);
  assert.match(formSource, /克/);
  assert.match(formSource, /price-unavailable/);
  assert.match(sectionSource, /priceUsdMinor/);
  assert.match(holdingsSource, /isTechDefenseHolding/);
  assert.match(holdingsSource, /isConsumerDefenseHolding/);
  assert.match(formSource, /<details/);
  assert.match(sectionSource, /<details/);
  assert.match(formSource, /科技防守层/);
  assert.match(sectionSource, /科技防守层/);
  assert.match(formSource, /消费防守层/);
  assert.match(sectionSource, /消费防守层/);
  assert.match(sectionSource, /pl-9 pr-5/);
  assert.match(schema, /priceCnyMinor\s+Int\?/);

  console.log("PASS finance market pricing primitives");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

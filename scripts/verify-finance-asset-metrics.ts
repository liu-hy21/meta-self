import assert from "node:assert/strict";

import type { FinanceHoldingAccount } from "@prisma/client";

import {
  FINANCE_EMERGENCY_CASH_FLOOR_CNY_MINOR,
  FINANCE_LAYER_BOUNDS,
  buildFinanceAssetMetrics,
} from "../src/lib/finance-asset-metrics";
import { financeHoldingConfigs } from "../src/lib/finance-holdings";

function amounts(overrides: Partial<Record<FinanceHoldingAccount, number>> = {}) {
  return new Map<FinanceHoldingAccount, number>(
    financeHoldingConfigs.map((config) => [config.account, overrides[config.account] ?? 0]),
  );
}

function rule(metrics: ReturnType<typeof buildFinanceAssetMetrics>, key: string) {
  const found = metrics.rules.find((item) => item.key === key);
  assert.ok(found, `missing rule ${key}`);
  return found;
}

async function main() {
  assert.deepEqual(FINANCE_LAYER_BOUNDS, {
    satellite: { lowerPct: 0, upperPct: 5 },
    tech: { lowerPct: 0, upperPct: 20 },
    hedge: { lowerPct: 10, upperPct: 20 },
    broad: { lowerPct: 17.5, upperPct: 55 },
    cash: { lowerPct: 0, upperPct: 70 },
  });

  const healthy = buildFinanceAssetMetrics(
    amounts({
      BANK_CARD: 1_150_000_000,
      SCHWAB_VOO: 15_000_000,
      SCHWAB_QQQ: 30_000_000,
      SCHWAB_MCD: 1_400_000,
      GOLD: 160_000_000,
    }),
  );

  assert.equal(healthy.strategyBaseCnyMinor, healthy.totalCnyMinor - FINANCE_EMERGENCY_CASH_FLOOR_CNY_MINOR);
  assert.equal(healthy.cashFloorStatus, "ok");
  assert.equal(healthy.overLimitCount, 0);
  assert.equal(rule(healthy, "qqq").status, "ok");
  assert.equal(rule(healthy, "gold").status, "ok");
  assert.equal(healthy.layerStatus.broad, "ok");
  assert.equal(healthy.layerStatus.hedge, "ok");
  assert.equal(healthy.layerStatus.cash, "ok");

  const lowerBreached = buildFinanceAssetMetrics(
    amounts({
      BANK_CARD: 100_000_000,
    }),
  );

  assert.equal(lowerBreached.layerStatus.hedge, "below");
  assert.equal(lowerBreached.layerStatus.broad, "below");
  assert.equal(lowerBreached.layerIssueCount, 3);

  const cashOver = buildFinanceAssetMetrics(
    amounts({
      BANK_CARD: 100_000_000,
    }),
  );

  assert.equal(cashOver.layerStatus.cash, "over");

  const breached = buildFinanceAssetMetrics(
    amounts({
      BANK_CARD: 1_000_000,
      SCHWAB_OTHER: 1_000_000,
      SCHWAB_GOOG: 5_000_000,
      SCHWAB_QQQ: 5_000_000,
      SCHWAB_VOO: 1_000_000,
    }),
  );

  assert.equal(breached.cashFloorStatus, "below");
  assert.ok(breached.overLimitCount >= 2);
  assert.equal(rule(breached, "tech").status, "over");
  assert.equal(rule(breached, "satellite").status, "over");
  assert.equal(breached.layerStatus.tech, "over");
  assert.equal(breached.layerStatus.satellite, "over");
  assert.ok(breached.rules.every((item) => item.ratioPct === null || Number.isFinite(item.ratioPct)));

  console.log("PASS finance asset metrics");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

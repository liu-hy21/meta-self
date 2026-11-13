import type { FinanceHoldingAccount } from "@prisma/client";

import {
  computeAllocationCnyMinor,
  financeHoldingConfigs,
  holdingConfig,
  holdingToCnyMinor,
  minorForAccount,
  type AssetAllocationKey,
  type AssetAllocationSlice,
} from "@/lib/finance-holdings";

export const FINANCE_EMERGENCY_CASH_FLOOR_CNY_MINOR = 5_000_000;

type AbsoluteLimitDefinition = {
  key: FinanceAssetMetricRuleKey;
  label: string;
  layerKey: AssetAllocationKey;
  scope: "layer" | "asset-group" | "asset";
  limitPct: number;
  accounts: FinanceHoldingAccount[];
};

export type FinanceAssetMetricRuleKey =
  | "satellite"
  | "tech"
  | "hedge"
  | "consumer-defense"
  | "gold"
  | "broad"
  | "voo"
  | "qqq";

export type FinanceAssetMetricStatus = "ok" | "over" | "unlimited";

export type FinanceAssetMetricRule = {
  key: FinanceAssetMetricRuleKey;
  label: string;
  layerKey: AssetAllocationKey;
  scope: AbsoluteLimitDefinition["scope"];
  limitPct: number;
  currentCnyMinor: number;
  ratioPct: number | null;
  status: FinanceAssetMetricStatus;
};

export type FinanceAssetMetrics = {
  totalCnyMinor: number;
  strategyBaseCnyMinor: number;
  liquidCashCnyMinor: number;
  configurableCashCnyMinor: number;
  cashFloorCnyMinor: number;
  cashFloorStatus: "ok" | "below";
  cashShortfallCnyMinor: number;
  slices: AssetAllocationSlice[];
  rules: FinanceAssetMetricRule[];
  layerStatus: Record<AssetAllocationKey, FinanceAssetMetricStatus>;
  overLimitCount: number;
  checkedLimitCount: number;
};

const ABSOLUTE_LIMITS: AbsoluteLimitDefinition[] = [
  {
    key: "satellite",
    label: "高波动层",
    layerKey: "satellite",
    scope: "layer",
    limitPct: 5,
    accounts: ["SCHWAB_OTHER", "EASTMONEY", "BN"],
  },
  {
    key: "tech",
    label: "科技防守层",
    layerKey: "tech",
    scope: "layer",
    limitPct: 20,
    accounts: ["SCHWAB_GOOG", "SCHWAB_AAPL", "SCHWAB_MSFT", "SCHWAB_AMZN", "SCHWAB_META"],
  },
  {
    key: "hedge",
    label: "消费防守层",
    layerKey: "hedge",
    scope: "layer",
    limitPct: 20,
    accounts: ["SCHWAB_MCD", "SCHWAB_COKE", "GOLD"],
  },
  {
    key: "consumer-defense",
    label: "MCD、COKE",
    layerKey: "hedge",
    scope: "asset-group",
    limitPct: 10,
    accounts: ["SCHWAB_MCD", "SCHWAB_COKE"],
  },
  {
    key: "gold",
    label: "黄金",
    layerKey: "hedge",
    scope: "asset",
    limitPct: 10,
    accounts: ["GOLD"],
  },
  {
    key: "broad",
    label: "压舱层",
    layerKey: "broad",
    scope: "layer",
    limitPct: 55,
    accounts: ["SCHWAB_VOO", "SCHWAB_QQQ"],
  },
  {
    key: "voo",
    label: "VOO",
    layerKey: "broad",
    scope: "asset",
    limitPct: 22,
    accounts: ["SCHWAB_VOO"],
  },
  {
    key: "qqq",
    label: "QQQ",
    layerKey: "broad",
    scope: "asset",
    limitPct: 33,
    accounts: ["SCHWAB_QQQ"],
  },
];

const layerKeys: AssetAllocationKey[] = ["satellite", "tech", "hedge", "broad", "cash"];

function sumAccountsCnyMinor(amounts: Map<FinanceHoldingAccount, number>, accounts: FinanceHoldingAccount[]) {
  return accounts.reduce(
    (sum, account) => sum + holdingToCnyMinor(minorForAccount(amounts, account), holdingConfig(account)),
    0,
  );
}

function getStatus(currentCnyMinor: number, strategyBaseCnyMinor: number, limitPct: number): FinanceAssetMetricStatus {
  if (strategyBaseCnyMinor <= 0) return currentCnyMinor > 0 ? "over" : "ok";
  return currentCnyMinor > (strategyBaseCnyMinor * limitPct) / 100 ? "over" : "ok";
}

export function buildFinanceAssetMetrics(amounts: Map<FinanceHoldingAccount, number>): FinanceAssetMetrics {
  const totalCnyMinor = financeHoldingConfigs.reduce(
    (sum, config) => sum + holdingToCnyMinor(minorForAccount(amounts, config.account), config),
    0,
  );
  const housingFundCnyMinor = sumAccountsCnyMinor(amounts, ["HOUSING_FUND"]);
  const liquidCashCnyMinor = sumAccountsCnyMinor(amounts, ["BANK_CARD", "ALIPAY", "HK_CARD", "SCHWAB_CASH"]);
  const strategyBaseCnyMinor = Math.max(totalCnyMinor - housingFundCnyMinor - FINANCE_EMERGENCY_CASH_FLOOR_CNY_MINOR, 0);
  const configurableCashCnyMinor = Math.max(liquidCashCnyMinor - FINANCE_EMERGENCY_CASH_FLOOR_CNY_MINOR, 0);
  const cashShortfallCnyMinor = Math.max(FINANCE_EMERGENCY_CASH_FLOOR_CNY_MINOR - liquidCashCnyMinor, 0);
  const rules = ABSOLUTE_LIMITS.map((definition) => {
    const currentCnyMinor = sumAccountsCnyMinor(amounts, definition.accounts);
    const ratioPct = strategyBaseCnyMinor > 0 ? (currentCnyMinor / strategyBaseCnyMinor) * 100 : null;
    return {
      key: definition.key,
      label: definition.label,
      layerKey: definition.layerKey,
      scope: definition.scope,
      limitPct: definition.limitPct,
      currentCnyMinor,
      ratioPct,
      status: getStatus(currentCnyMinor, strategyBaseCnyMinor, definition.limitPct),
    } satisfies FinanceAssetMetricRule;
  });
  const layerStatus = Object.fromEntries(
    layerKeys.map((key) => [
      key,
      key === "cash" ? "unlimited" : rules.some((rule) => rule.layerKey === key && rule.status === "over") ? "over" : "ok",
    ]),
  ) as Record<AssetAllocationKey, FinanceAssetMetricStatus>;

  return {
    totalCnyMinor,
    strategyBaseCnyMinor,
    liquidCashCnyMinor,
    configurableCashCnyMinor,
    cashFloorCnyMinor: FINANCE_EMERGENCY_CASH_FLOOR_CNY_MINOR,
    cashFloorStatus: liquidCashCnyMinor < FINANCE_EMERGENCY_CASH_FLOOR_CNY_MINOR ? "below" : "ok",
    cashShortfallCnyMinor,
    slices: computeAllocationCnyMinor(amounts),
    rules,
    layerStatus,
    overLimitCount: rules.filter((rule) => rule.status === "over").length,
    checkedLimitCount: rules.length,
  };
}

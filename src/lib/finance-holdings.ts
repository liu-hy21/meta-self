import type { FinanceHoldingAccount } from "@prisma/client";

export const USD_TO_CNY = 7.4;
export const HKD_TO_CNY = 0.94;

export type HoldingRegion = "overseas" | "domestic";
export type HoldingInputKind = "amount" | "shares" | "weight";
export type FinancePriceSymbol = "QQQ" | "VOO" | "GOOG" | "AAPL" | "MSFT" | "AMZN" | "META" | "MCD" | "COKE";

export type HoldingConfig = {
  account: FinanceHoldingAccount;
  label: string;
  region: HoldingRegion;
  regionTitle?: string;
  currency: "USD" | "HKD" | "CNY";
  currencyLabel: string;
  rateToCny: number;
  formKey: string;
  decimals: number;
  inputKind: HoldingInputKind;
  priceSymbol?: FinancePriceSymbol;
  marketPriceSource?: "ninequant" | "goldprice";
  marketPriceCurrency?: "USD" | "CNY";
  /** 归入 SCHWAB 分组展示 */
  schwabGroup?: boolean;
};

const usdSchwabBase = {
  region: "overseas" as const,
  regionTitle: "海外",
  currency: "USD" as const,
  currencyLabel: "美元",
  rateToCny: USD_TO_CNY,
  decimals: 2,
  inputKind: "amount" as const,
  schwabGroup: true,
};

const usdMarketPrice = {
  marketPriceSource: "ninequant" as const,
  marketPriceCurrency: "USD" as const,
};

export const schwabHoldingConfigs: HoldingConfig[] = [
  {
    account: "SCHWAB_OTHER",
    label: "其他资产",
    formKey: "schwabOther",
    ...usdSchwabBase,
  },
  {
    account: "SCHWAB_GOOG",
    label: "GOOG",
    formKey: "schwabGoog",
    ...usdSchwabBase,
    ...usdMarketPrice,
    inputKind: "shares",
    priceSymbol: "GOOG",
  },
  {
    account: "SCHWAB_AAPL",
    label: "AAPL",
    formKey: "schwabAapl",
    ...usdSchwabBase,
    ...usdMarketPrice,
    inputKind: "shares",
    priceSymbol: "AAPL",
  },
  {
    account: "SCHWAB_MSFT",
    label: "MSFT",
    formKey: "schwabMsft",
    ...usdSchwabBase,
    ...usdMarketPrice,
    inputKind: "shares",
    priceSymbol: "MSFT",
  },
  {
    account: "SCHWAB_AMZN",
    label: "AMZN",
    formKey: "schwabAmzn",
    ...usdSchwabBase,
    ...usdMarketPrice,
    inputKind: "shares",
    priceSymbol: "AMZN",
  },
  {
    account: "SCHWAB_META",
    label: "META",
    formKey: "schwabMeta",
    ...usdSchwabBase,
    ...usdMarketPrice,
    inputKind: "shares",
    priceSymbol: "META",
  },
  {
    account: "SCHWAB_MCD",
    label: "MCD",
    formKey: "schwabMcd",
    ...usdSchwabBase,
    ...usdMarketPrice,
    inputKind: "shares",
    priceSymbol: "MCD",
  },
  {
    account: "SCHWAB_COKE",
    label: "COKE",
    formKey: "schwabCoke",
    ...usdSchwabBase,
    ...usdMarketPrice,
    inputKind: "shares",
    priceSymbol: "COKE",
  },
  {
    account: "SCHWAB_QQQ",
    label: "QQQ",
    formKey: "schwabQqq",
    ...usdSchwabBase,
    ...usdMarketPrice,
    inputKind: "shares",
    priceSymbol: "QQQ",
  },
  {
    account: "SCHWAB_VOO",
    label: "VOO",
    formKey: "schwabVoo",
    ...usdSchwabBase,
    ...usdMarketPrice,
    inputKind: "shares",
    priceSymbol: "VOO",
  },
  {
    account: "SCHWAB_CASH",
    label: "现金",
    formKey: "schwabCash",
    ...usdSchwabBase,
  },
];

export const financeHoldingConfigs: HoldingConfig[] = [
  ...schwabHoldingConfigs,
  {
    account: "HK_CARD",
    label: "港卡",
    region: "overseas",
    currency: "HKD",
    currencyLabel: "港币",
    rateToCny: HKD_TO_CNY,
    formKey: "hkCard",
    decimals: 2,
    inputKind: "amount",
  },
  {
    account: "EASTMONEY",
    label: "东方财富",
    region: "domestic",
    currency: "CNY",
    currencyLabel: "人民币",
    rateToCny: 1,
    formKey: "eastmoney",
    decimals: 2,
    inputKind: "amount",
  },
  {
    account: "BN",
    label: "BN",
    region: "domestic",
    currency: "CNY",
    currencyLabel: "人民币",
    rateToCny: 1,
    formKey: "bn",
    decimals: 2,
    inputKind: "amount",
  },
  {
    account: "GOLD",
    label: "黄金",
    region: "domestic",
    currency: "CNY",
    currencyLabel: "人民币",
    rateToCny: 1,
    formKey: "gold",
    decimals: 2,
    inputKind: "weight",
    marketPriceSource: "goldprice",
    marketPriceCurrency: "CNY",
  },
  {
    account: "BANK_CARD",
    label: "银行卡",
    region: "domestic",
    regionTitle: "国内",
    currency: "CNY",
    currencyLabel: "人民币",
    rateToCny: 1,
    formKey: "bankCard",
    decimals: 2,
    inputKind: "amount",
  },
  {
    account: "ALIPAY",
    label: "支付宝",
    region: "domestic",
    currency: "CNY",
    currencyLabel: "人民币",
    rateToCny: 1,
    formKey: "alipay",
    decimals: 2,
    inputKind: "amount",
  },
  {
    account: "HOUSING_FUND",
    label: "住房公积金",
    region: "domestic",
    currency: "CNY",
    currencyLabel: "人民币",
    rateToCny: 1,
    formKey: "housingFund",
    decimals: 2,
    inputKind: "amount",
  },
];

const configByAccount = new Map(financeHoldingConfigs.map((c) => [c.account, c]));

export function holdingConfig(account: FinanceHoldingAccount) {
  const config = configByAccount.get(account);
  if (!config) {
    throw new Error(`Unknown finance holding account: ${account}`);
  }
  return config;
}

export function holdingAccountLabel(account: FinanceHoldingAccount) {
  const config = configByAccount.get(account);
  if (!config) return account;
  if (config.schwabGroup) return `SCHWAB · ${config.label}`;
  return config.label;
}

export function isMarketPricedHolding(config: HoldingConfig) {
  return config.inputKind !== "amount" && config.marketPriceSource != null && config.marketPriceCurrency != null;
}

export function isTechDefenseHolding(config: HoldingConfig) {
  return (
    config.priceSymbol === "GOOG" ||
    config.priceSymbol === "AAPL" ||
    config.priceSymbol === "MSFT" ||
    config.priceSymbol === "AMZN" ||
    config.priceSymbol === "META"
  );
}

export function isConsumerDefenseHolding(config: HoldingConfig) {
  return config.priceSymbol === "MCD" || config.priceSymbol === "COKE";
}

export function isDefenseHolding(config: HoldingConfig) {
  return isTechDefenseHolding(config) || isConsumerDefenseHolding(config);
}

export function amountMinorToDisplay(amountMinor: number, currency: HoldingConfig["currency"]) {
  return amountMinor / 100;
}

export function formatNativeAmount(amountMinor: number, config: HoldingConfig) {
  const value = amountMinorToDisplay(amountMinor, config.currency);
  const formatted = value.toLocaleString("zh-CN", {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });
  if (config.currency === "USD") return `$${formatted}`;
  if (config.currency === "HKD") return `HK$${formatted}`;
  return `${formatted} 元`;
}

export function holdingToCnyMinor(amountMinor: number, config: HoldingConfig) {
  const major = amountMinor / 100;
  return Math.round(major * config.rateToCny * 100);
}

export function minorForAccount(
  amounts: Map<FinanceHoldingAccount, number>,
  account: FinanceHoldingAccount,
) {
  return amounts.get(account) ?? 0;
}

export function computeTotalCnyMinor(amounts: Map<FinanceHoldingAccount, number>) {
  let total = 0;
  for (const config of financeHoldingConfigs) {
    const minor = amounts.get(config.account) ?? 0;
    total += holdingToCnyMinor(minor, config);
  }
  return total;
}

export type AssetAllocationKey = "satellite" | "tech" | "hedge" | "broad" | "cash";

export type AssetAllocationSlice = {
  key: AssetAllocationKey;
  label: string;
  cnyMinor: number;
  color: string;
};

export const allocationOrder: AssetAllocationSlice[] = [
  { key: "satellite", label: "高波动层", cnyMinor: 0, color: "#C62828" },
  { key: "tech", label: "科技防守层", cnyMinor: 0, color: "#EF6C00" },
  { key: "hedge", label: "防御层", cnyMinor: 0, color: "#C9A227" },
  { key: "broad", label: "压舱层", cnyMinor: 0, color: "#1E5AA8" },
  { key: "cash", label: "安全层", cnyMinor: 0, color: "#2E7D32" },
];

/** 按风险从高到低：卫星、科技成长、防御对冲、宽基压舱、现金安全垫。 */
export function computeAllocationCnyMinor(
  amounts: Map<FinanceHoldingAccount, number>,
): AssetAllocationSlice[] {
  const cfg = (account: FinanceHoldingAccount) => holdingConfig(account);
  const toCny = (account: FinanceHoldingAccount) =>
    holdingToCnyMinor(minorForAccount(amounts, account), cfg(account));

  const satellite =
    toCny("SCHWAB_OTHER") +
    toCny("EASTMONEY") +
    toCny("BN");
  const tech =
    toCny("SCHWAB_GOOG") +
    toCny("SCHWAB_AAPL") +
    toCny("SCHWAB_MSFT") +
    toCny("SCHWAB_AMZN") +
    toCny("SCHWAB_META");
  const hedge =
    toCny("SCHWAB_MCD") +
    toCny("SCHWAB_COKE") +
    toCny("GOLD");
  const broad = toCny("SCHWAB_QQQ") + toCny("SCHWAB_VOO");
  const cash =
    toCny("BANK_CARD") +
    toCny("ALIPAY") +
    toCny("HK_CARD") +
    toCny("SCHWAB_CASH") +
    toCny("HOUSING_FUND");

  const values: Record<AssetAllocationKey, number> = { satellite, tech, hedge, broad, cash };
  return allocationOrder.map((meta) => ({ ...meta, cnyMinor: values[meta.key] }));
}

const allocationKeyByAccount: Record<FinanceHoldingAccount, AssetAllocationKey> = {
  SCHWAB_QQQ: "broad",
  SCHWAB_VOO: "broad",
  SCHWAB_GOOG: "tech",
  SCHWAB_AAPL: "tech",
  SCHWAB_MSFT: "tech",
  SCHWAB_AMZN: "tech",
  SCHWAB_META: "tech",
  SCHWAB_MCD: "hedge",
  SCHWAB_COKE: "hedge",
  SCHWAB_OTHER: "satellite",
  SCHWAB_CASH: "cash",
  HK_CARD: "cash",
  BANK_CARD: "cash",
  ALIPAY: "cash",
  EASTMONEY: "satellite",
  BN: "satellite",
  HOUSING_FUND: "cash",
  GOLD: "hedge",
};

export function accountAllocation(account: FinanceHoldingAccount) {
  const key = allocationKeyByAccount[account];
  return allocationOrder.find((s) => s.key === key)!;
}

export function splitCnyMinor(cnyMinor: number) {
  const text = (cnyMinor / 100).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const [integer, decimal] = text.split(".");
  return { integer, decimal };
}

export function schwabTotalUsdMinor(amounts: Map<FinanceHoldingAccount, number>) {
  let sum = 0;
  for (const config of schwabHoldingConfigs) {
    sum += minorForAccount(amounts, config.account);
  }
  return sum;
}

export function formatCnyMinor(cnyMinor: number) {
  return `${(cnyMinor / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 元`;
}

export function parseHoldingInputToMinor(raw: string, decimals: number): number {
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor);
}

/** 编辑表单默认值：含 0，避免留空绕过必填 */
export function holdingEditInputValue(amountMinor: number, decimals: number) {
  return (amountMinor / 100).toFixed(decimals);
}

export type FinanceHoldingsFormValidation =
  | {
      ok: true;
      amounts: Map<FinanceHoldingAccount, number>;
      quantities: Map<FinanceHoldingAccount, number>;
    }
  | { ok: false; missingLabels: string[]; invalidLabels: string[] };

export function validateFinanceHoldingsForm(formData: FormData): FinanceHoldingsFormValidation {
  const missingLabels: string[] = [];
  const invalidLabels: string[] = [];
  const amounts = new Map<FinanceHoldingAccount, number>();
  const quantities = new Map<FinanceHoldingAccount, number>();

  for (const config of financeHoldingConfigs) {
    const label = holdingAccountLabel(config.account);
    const raw = String(formData.get(config.formKey) ?? "");
    const trimmed = raw.trim();
    if (!trimmed) {
      missingLabels.push(label);
      continue;
    }
    const value = Number(trimmed);
    if (!Number.isFinite(value) || value < 0) {
      invalidLabels.push(label);
      continue;
    }
    const factor = 10 ** config.decimals;
    const minor = Math.round(value * factor);
    if (config.inputKind !== "amount") quantities.set(config.account, minor);
    else amounts.set(config.account, minor);
  }

  if (missingLabels.length > 0 || invalidLabels.length > 0) {
    return { ok: false, missingLabels, invalidLabels };
  }
  return { ok: true, amounts, quantities };
}

export const overseasHoldings = financeHoldingConfigs.filter(
  (c) => c.region === "overseas" && !c.schwabGroup,
);
export const domesticHoldings = financeHoldingConfigs.filter((c) => c.region === "domestic");

/** 上海时区当日，用于资产快照横轴（库内 @db.Date） */
export function shanghaiCalendarDate(from = new Date()) {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(from);
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function formatSnapshotAxisDate(asOfDate: Date) {
  const y = asOfDate.getUTCFullYear();
  const m = String(asOfDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(asOfDate.getUTCDate()).padStart(2, "0");
  return `${m}/${d}`;
}

export function holdingsMapToJson(amounts: Map<FinanceHoldingAccount, number>) {
  const record: Record<string, number> = {};
  for (const config of financeHoldingConfigs) {
    record[config.account] = amounts.get(config.account) ?? 0;
  }
  return record;
}

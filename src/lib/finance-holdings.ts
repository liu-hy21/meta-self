import type { FinanceHoldingAccount } from "@prisma/client";

export const USD_TO_CNY = 7.4;
export const HKD_TO_CNY = 0.94;

export type HoldingRegion = "overseas" | "domestic";

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
  schwabGroup: true,
};

export const schwabHoldingConfigs: HoldingConfig[] = [
  {
    account: "SCHWAB_QQQ",
    label: "QQQ",
    formKey: "schwabQqq",
    ...usdSchwabBase,
  },
  {
    account: "SCHWAB_VOO",
    label: "VOO",
    formKey: "schwabVoo",
    ...usdSchwabBase,
  },
  {
    account: "SCHWAB_OTHER",
    label: "其他资产",
    formKey: "schwabOther",
    ...usdSchwabBase,
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

export type AssetAllocationKey = "cash" | "qqq" | "voo" | "risk";

export type AssetAllocationSlice = {
  key: AssetAllocationKey;
  label: string;
  cnyMinor: number;
  color: string;
};

export const allocationOrder: AssetAllocationSlice[] = [
  { key: "cash", label: "现金资产", cnyMinor: 0, color: "#7f9c94" },
  { key: "qqq", label: "QQQ", cnyMinor: 0, color: "#c29a5b" },
  { key: "voo", label: "VOO", cnyMinor: 0, color: "#5f4b3a" },
  { key: "risk", label: "风险资产", cnyMinor: 0, color: "#b3644d" },
];

/** 现金：银行卡、支付宝、港卡、SCHWAB 现金；风险：SCHWAB 其他、东方财富、BN；QQQ/VOO 单独 */
export function computeAllocationCnyMinor(
  amounts: Map<FinanceHoldingAccount, number>,
): AssetAllocationSlice[] {
  const cfg = (account: FinanceHoldingAccount) => holdingConfig(account);
  const toCny = (account: FinanceHoldingAccount) =>
    holdingToCnyMinor(minorForAccount(amounts, account), cfg(account));

  const cash =
    toCny("BANK_CARD") +
    toCny("ALIPAY") +
    toCny("HK_CARD") +
    toCny("SCHWAB_CASH");
  const qqq = toCny("SCHWAB_QQQ");
  const voo = toCny("SCHWAB_VOO");
  const risk = toCny("SCHWAB_OTHER") + toCny("EASTMONEY") + toCny("BN");

  const values: Record<AssetAllocationKey, number> = { cash, qqq, voo, risk };
  return allocationOrder.map((meta) => ({ ...meta, cnyMinor: values[meta.key] }));
}

const allocationKeyByAccount: Record<FinanceHoldingAccount, AssetAllocationKey> = {
  SCHWAB_QQQ: "qqq",
  SCHWAB_VOO: "voo",
  SCHWAB_OTHER: "risk",
  SCHWAB_CASH: "cash",
  HK_CARD: "cash",
  BANK_CARD: "cash",
  ALIPAY: "cash",
  EASTMONEY: "risk",
  BN: "risk",
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
  | { ok: true; amounts: Map<FinanceHoldingAccount, number> }
  | { ok: false; missingLabels: string[]; invalidLabels: string[] };

export function validateFinanceHoldingsForm(formData: FormData): FinanceHoldingsFormValidation {
  const missingLabels: string[] = [];
  const invalidLabels: string[] = [];
  const amounts = new Map<FinanceHoldingAccount, number>();

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
    amounts.set(config.account, Math.round(value * factor));
  }

  if (missingLabels.length > 0 || invalidLabels.length > 0) {
    return { ok: false, missingLabels, invalidLabels };
  }
  return { ok: true, amounts };
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

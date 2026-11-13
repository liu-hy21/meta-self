export const FINANCE_PRICE_REFRESH_DAYS = 30;
export const FINANCE_PRICE_REFRESH_MS = FINANCE_PRICE_REFRESH_DAYS * 24 * 60 * 60 * 1000;

export type CachedFinancePriceResolution = {
  priceUsdMinor: number | null;
  fetchedAt: Date | null;
  usedFallback: boolean;
};

export type FinancePriceResolution = CachedFinancePriceResolution & {
  refreshed: boolean;
  unavailable: boolean;
};

export function sharesToAmountMinor(quantityMinor: number, priceUsdMinor: number) {
  if (!Number.isInteger(quantityMinor) || quantityMinor < 0) throw new RangeError("Invalid share quantity");
  if (!Number.isInteger(priceUsdMinor) || priceUsdMinor < 0) throw new RangeError("Invalid USD price");
  return Math.round((quantityMinor * priceUsdMinor) / 100);
}

export function isFinancePriceStale(fetchedAt: Date | null, now = new Date()) {
  return fetchedAt == null || now.getTime() - fetchedAt.getTime() >= FINANCE_PRICE_REFRESH_MS;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseNineQuantQuotePrice(payload: unknown) {
  const body = isRecord(payload) ? payload : null;
  const data = body && body.code === 0 && isRecord(body.data) ? body.data : null;
  const price = data?.last;
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    throw new Error("NineQuantAI response did not include a valid market price");
  }
  return Math.round(price * 100);
}

export function resolveCachedFinancePrice(
  cachedPriceUsdMinor: number | null,
  cachedFetchedAt: Date | null,
  fetchedPriceUsdMinor: number | null,
  now = new Date(),
): CachedFinancePriceResolution {
  if (fetchedPriceUsdMinor != null) {
    return { priceUsdMinor: fetchedPriceUsdMinor, fetchedAt: now, usedFallback: false };
  }
  if (cachedPriceUsdMinor != null) {
    return { priceUsdMinor: cachedPriceUsdMinor, fetchedAt: cachedFetchedAt, usedFallback: true };
  }
  return { priceUsdMinor: null, fetchedAt: null, usedFallback: false };
}

export async function resolveFinancePrice(
  cachedPriceUsdMinor: number | null,
  cachedFetchedAt: Date | null,
  fetchPrice: () => Promise<number>,
  now = new Date(),
): Promise<FinancePriceResolution> {
  if (cachedPriceUsdMinor != null && !isFinancePriceStale(cachedFetchedAt, now)) {
    return {
      priceUsdMinor: cachedPriceUsdMinor,
      fetchedAt: cachedFetchedAt,
      usedFallback: false,
      refreshed: false,
      unavailable: false,
    };
  }

  try {
    const fetchedPriceUsdMinor = await fetchPrice();
    return {
      priceUsdMinor: fetchedPriceUsdMinor,
      fetchedAt: now,
      usedFallback: false,
      refreshed: true,
      unavailable: false,
    };
  } catch {
    const fallback = resolveCachedFinancePrice(cachedPriceUsdMinor, cachedFetchedAt, null, now);
    return {
      ...fallback,
      refreshed: false,
      unavailable: fallback.priceUsdMinor == null,
    };
  }
}

export async function fetchNineQuantFinancePrice(symbol: string, fetchImpl: typeof fetch = fetch) {
  const url = `https://api.ninequantai.com/v1/quote/${encodeURIComponent(symbol)}.US`;
  const response = await fetchImpl(url, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });
  if (!response.ok) throw new Error(`NineQuantAI request failed: ${response.status}`);
  return parseNineQuantQuotePrice(await response.json());
}

# Finance Market Valuations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make QQQ and VOO asset updates accept share counts, refresh cached prices at most once per 30 days, and calculate stored USD/CNY values automatically.

**Architecture:** Keep `FinanceHolding.amountMinor` as the computed USD amount for compatibility, and add nullable share/price cache fields for market-priced holdings. A server-side price adapter parses NineQuantAI US ETF quote responses; the existing finance Server Action decides whether to refresh, falls back to a cached price, computes amounts, persists the holding and snapshot, and redirects with a compact notice when fallback was needed.

**Tech Stack:** Next.js 16 App Router, React 19, Server Actions, Prisma 6/MySQL, TypeScript, Node `assert` verification scripts, existing Tailwind classes.

**Spec:** `docs/superpowers/specs/2026-11-13-finance-market-valuations-design.md`

## Global Constraints

- Only QQQ and VOO switch from amount input to share-count input; all other accounts keep their current amount behavior.
- Share counts and USD prices are stored as integer hundredths; monetary amounts remain integer cents in `amountMinor`.
- Price refresh freshness is exactly `30 * 24` hours; refreshes happen only in the save Server Action.
- A failed refresh may use an existing cached price with a visible notice; no cached price means no write and a blocking error.
- Do not add a client-side market-data dependency or alter unrelated dirty worktree files.

## Review Focus

- A fractional share such as `1.25` must become the correct cent amount without floating-point drift — covered by the valuation helper test.
- A price exactly 30 days old must refresh, while a newer price must not — covered by the freshness test.
- A malformed or missing provider response must not produce a zero price — covered by the provider parser test.
- A stale provider failure with an existing cache must save using the cache and expose a notice — covered by the price-resolution test.
- A stale provider failure without a cache must block the save path — covered by the action-resolution test.

### Task 1: Add failing finance pricing tests

**Files:**
- Create: `scripts/verify-finance-market-pricing.ts`
- Test: `src/lib/finance-holdings.ts`, `src/lib/finance-prices.ts` (expected APIs)

**Interfaces:**
- Consumes: the planned pure helpers `sharesToAmountMinor`, `isFinancePriceStale`, `parseNineQuantQuotePrice`, `resolveCachedFinancePrice`, and `validateFinanceHoldingsForm`.
- Produces: executable regression coverage that fails before the helpers exist or before the new share input semantics are implemented.

- [ ] **Step 1: Write the failing tests**

  In `scripts/verify-finance-market-pricing.ts`, use `node:assert/strict` to assert: `sharesToAmountMinor(125, 40000) === 50000`; a price at exactly 30 days is stale and one day newer is fresh; a NineQuant quote payload with `data.last: 400.12` parses to `40012` cents; malformed/provider-error payloads throw; a failed refresh with a cached price returns the cached price plus a fallback flag; and a `FormData` containing `schwabQqq=1.25` / `schwabVoo=2` places those values in `quantities` rather than amount values.

- [ ] **Step 2: Run the test to verify it fails**

  Run: `npx tsx scripts/verify-finance-market-pricing.ts`

  Expected: FAIL because the new helpers and the `quantities` validation result do not yet exist.

### Task 2: Implement pricing primitives and market-input metadata

**Files:**
- Modify: `src/lib/finance-holdings.ts`
- Create: `src/lib/finance-prices.ts`
- Test: `scripts/verify-finance-market-pricing.ts`

**Interfaces:**
- Consumes: the failing tests from Task 1.
- Produces: `HoldingConfig.inputKind`, `HoldingConfig.priceSymbol`, `sharesToAmountMinor(quantityMinor: number, priceUsdMinor: number): number`, `isFinancePriceStale(fetchedAt: Date | null, now?: Date): boolean`, `parseNineQuantQuotePrice(payload: unknown): number`, and `resolveCachedFinancePrice(cachedPriceUsdMinor: number | null, cachedFetchedAt: Date | null, fetchedPriceUsdMinor: number | null, now?: Date): { priceUsdMinor: number | null; fetchedAt: Date | null; usedFallback: boolean }`.

- [ ] **Step 1: Implement the smallest production helpers**

  Mark QQQ and VOO as `inputKind: "shares"` with their symbols; leave every other config as `inputKind: "amount"`. Add the cent-based share multiplication and 30-day freshness helpers. Add a server-only NineQuantAI quote adapter that fetches `${symbol}.US` one symbol at a time with `cache: "no-store"`, validates `code === 0` and `data.last`, rounds to cents, and exposes an injectable fetch function for tests.

- [ ] **Step 2: Extend form validation**

  Keep amount validation for amount inputs, validate share inputs with the same non-negative two-decimal rule, and return both `amounts` and `quantities` maps so the Server Action can compute market-priced amounts only after it has a quote.

- [ ] **Step 3: Run the focused test to verify it passes**

  Run: `npx tsx scripts/verify-finance-market-pricing.ts`

  Expected: PASS with no assertion failures.

### Task 3: Persist cached prices on holdings

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261113120000_finance_holding_market_price/migration.sql`
- Test: `scripts/verify-finance-market-pricing.ts`

**Interfaces:**
- Consumes: `HoldingConfig` market metadata and pricing helpers from Task 2.
- Produces: nullable Prisma fields `FinanceHolding.quantityMinor`, `FinanceHolding.priceUsdMinor`, and `FinanceHolding.priceFetchedAt`.

- [ ] **Step 1: Add the failing persistence-shape assertion**

  Extend the verification script to read `prisma/schema.prisma` as text and assert the three new field names are present on `FinanceHolding` after the schema change; this remains a source-level guard because the repository has no test runner or isolated database fixture.

- [ ] **Step 2: Add the Prisma fields and migration**

  Add nullable integer/date fields to `FinanceHolding`, then add a forward-only MySQL migration with three nullable columns. Run `npx prisma generate` so the generated client exposes the fields.

- [ ] **Step 3: Run the focused verification**

  Run: `npx tsx scripts/verify-finance-market-pricing.ts`

  Expected: PASS, including the schema field assertions.

### Task 4: Wire the Server Action to refresh, fallback, and calculate

**Files:**
- Modify: `src/app/actions/data.ts`
- Modify: `src/app/(main)/finance/profile/page.tsx`
- Test: `scripts/verify-finance-market-pricing.ts`

**Interfaces:**
- Consumes: validated `quantities`, `sharesToAmountMinor`, freshness/response helpers, and the new Prisma fields.
- Produces: save behavior that refreshes only stale QQQ/VOO prices, persists the computed amount and cache metadata, redirects with `assetsNotice=stale-price` when a cached price was reused, and redirects with `assetsError=price-unavailable` before any write when no price exists.

- [ ] **Step 1: Add the failing action-resolution assertions**

  Add tests for the pure resolution path: a fresh cached quote is reused without a provider call; a stale successful quote updates `priceUsdMinor` and `priceFetchedAt`; a stale failure with a cache sets `usedFallback`; and a stale failure without a cache returns an unavailable result.

- [ ] **Step 2: Implement quote resolution before writes**

  Load the user holdings first, resolve stale market quotes before any upsert, compute QQQ/VOO amounts from the submitted share counts, and keep amount accounts unchanged. Preserve the current snapshot and log writes, but treat a changed quantity or computed amount as a holding change. Save `quantityMinor`, `priceUsdMinor`, and `priceFetchedAt` only for market-priced holdings.

- [ ] **Step 3: Add redirect notice plumbing**

  Parse `assetsError=price-unavailable` and `assetsNotice=stale-price` in the finance page and pass them to the section/form so the user sees why a save failed or why an old quote was used.

- [ ] **Step 4: Run focused verification and typecheck**

  Run: `npx tsx scripts/verify-finance-market-pricing.ts` and `npx tsc --noEmit`.

  Expected: PASS for the finance checks and no TypeScript errors.

### Task 5: Update the edit and read-only interfaces

**Files:**
- Modify: `src/components/finance/finance-holdings-form.tsx`
- Modify: `src/components/finance/finance-assets-section.tsx`
- Test: `scripts/verify-finance-market-pricing.ts`

**Interfaces:**
- Consumes: persisted quantity/price fields and notice props from Task 4.
- Produces: QQQ/VOO fields that accept shares, preview calculated value using the cached quote, and read-only rows showing shares, quote, USD amount, and CNY approximation.

- [ ] **Step 1: Add the failing UI source assertions**

  Assert that the form source includes the share unit and price display, that the section accepts the persisted quote fields, and that the error copy includes the unavailable-price case.

- [ ] **Step 2: Implement form unit switching and preview**

  Initialize QQQ/VOO from `quantityMinor`, keep all other fields initialized from `amountMinor`, show `股` instead of `$` for market inputs, and calculate the preview total with `sharesToAmountMinor` and the cached price. Keep the existing required/invalid behavior for all nine fields.

- [ ] **Step 3: Implement read-only holding display and notices**

  Show QQQ/VOO as `股数 · 价格 · 美元金额 · 人民币近似值`, keep the existing allocation bars, and add compact success/warning/error notices without introducing decorative secondary headings.

- [ ] **Step 4: Run focused verification**

  Run: `npx tsx scripts/verify-finance-market-pricing.ts`.

  Expected: PASS.

### Task 6: Verify the complete change

**Files:**
- Modify only files already listed above if verification reveals an issue.

- [ ] **Step 1: Run the complete local checks**

  Run: `npx tsx scripts/verify-finance-market-pricing.ts`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`.

  Expected: all commands exit successfully; existing unrelated worktree changes remain untouched.

- [ ] **Step 2: Verify the rendered finance page**

  Reload `http://localhost:3000/finance/profile?edit=1`, confirm QQQ/VOO are labeled as share inputs and the other seven fields remain currency inputs. Use a test entry only if the local database has no meaningful holdings, and verify the final read-only page shows the calculated USD/CNY values and any fallback notice.

ALTER TABLE `FinanceHolding`
  ADD COLUMN `quantityMinor` INTEGER NULL,
  ADD COLUMN `priceUsdMinor` INTEGER NULL,
  ADD COLUMN `priceFetchedAt` DATETIME(3) NULL;

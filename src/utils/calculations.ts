/**
 * ============================================================================
 * CALCULATIONS & RANKING SECTION
 * Plain JavaScript functions with a short comment above each formula so a
 * student can explain the exact logic in a viva.
 * ============================================================================
 */

import type {
  ItemMetrics,
  PurchaseBill,
  QuadrantId,
  ReconciliationItemStatus,
  StockItem,
} from '../types/inventory';

/** Kirana margin benchmark separating high-margin vs low-margin items (15.0%). */
export const HIGH_MARGIN_THRESHOLD_PCT = 15;

/**
 * Formula: Opening Stock Value = Opening Count * Unit Cost Price
 */
export function calculateOpeningValue(openingCount: number, costPrice: number): number {
  return Math.max(0, openingCount) * Math.max(0, costPrice);
}

/**
 * Formula: Weighted Average Unit Cost = (Opening Value + Purchases Value) / (Opening Count + Purchased Units)
 * Falls back to the item's baseline cost price when no units were opened or bought.
 */
export function calculateEffectiveCostPrice(
  openingCount: number,
  baseCostPrice: number,
  purchasesUnits: number,
  purchasesValue: number
): number {
  const totalUnits = Math.max(0, openingCount) + Math.max(0, purchasesUnits);
  if (totalUnits <= 0) return Math.max(0, baseCostPrice);
  const totalValue = calculateOpeningValue(openingCount, baseCostPrice) + Math.max(0, purchasesValue);
  return totalValue / totalUnits;
}

/**
 * Formula: Closing Stock Value = Closing Count * Effective Cost Price
 */
export function calculateClosingValue(closingCount: number | null, effectiveCostPrice: number): number {
  if (closingCount === null || closingCount < 0) return 0;
  return closingCount * Math.max(0, effectiveCostPrice);
}

/**
 * Formula: Estimated COGS (Cost of Goods Sold) = Opening Stock Value + Purchases in Period - Closing Stock Value
 * When the owner has recorded actual sales units, Recorded COGS = Recorded Sales Units * Effective Cost Price.
 */
export function calculateCogs(params: {
  openingValue: number;
  purchasesValue: number;
  closingValue: number;
  openingCount: number;
  purchasesUnits: number;
  closingCount: number | null;
  effectiveCostPrice: number;
  recordedSalesUnits: number | null;
}): { cogsValue: number; salesUnits: number; isEstimated: boolean } {
  const {
    openingValue,
    purchasesValue,
    closingValue,
    openingCount,
    purchasesUnits,
    closingCount,
    effectiveCostPrice,
    recordedSalesUnits,
  } = params;

  if (recordedSalesUnits !== null && recordedSalesUnits >= 0) {
    return {
      cogsValue: recordedSalesUnits * effectiveCostPrice,
      salesUnits: recordedSalesUnits,
      isEstimated: false,
    };
  }

  const effectiveClosing = closingCount === null ? openingCount + purchasesUnits : Math.max(0, closingCount);
  const rawUnitsSold = openingCount + purchasesUnits - effectiveClosing;
  const salesUnits = Math.max(0, rawUnitsSold);
  const rawCogs = openingValue + purchasesValue - closingValue;
  const cogsValue = closingCount === null ? 0 : Math.max(0, rawCogs);

  return {
    cogsValue,
    salesUnits: closingCount === null ? 0 : salesUnits,
    isEstimated: true,
  };
}

/**
 * Formula: Gross Margin % = ((Selling Price - Cost Price) / Selling Price) * 100
 */
export function calculateGrossMarginPct(sellingPrice: number | null, costPrice: number): number {
  if (sellingPrice === null || sellingPrice <= 0) return 0;
  return ((sellingPrice - costPrice) / sellingPrice) * 100;
}

/**
 * Formula: Gross Margin Earned = Sales Units * (Selling Price - Cost Price)
 */
export function calculateGrossMarginEarned(
  salesUnits: number,
  sellingPrice: number | null,
  costPrice: number
): number {
  if (sellingPrice === null || sellingPrice <= 0 || salesUnits <= 0) return 0;
  return salesUnits * (sellingPrice - costPrice);
}

/**
 * Formula: Average Stock Value = (Opening Value + Closing Value) / 2
 */
export function calculateAverageStockValue(openingValue: number, closingValue: number): number {
  return (openingValue + closingValue) / 2;
}

/**
 * Formula: Days of Stock on Hand = Closing Stock Value / (COGS Value / Days in Period)
 * Returns null when COGS is zero so the UI displays "No movement".
 */
export function calculateDaysOfStockOnHand(
  closingValue: number,
  cogsValue: number,
  daysInPeriod: number
): number | null {
  if (cogsValue <= 0 || daysInPeriod <= 0) return null;
  const dailyCogs = cogsValue / daysInPeriod;
  if (dailyCogs <= 0) return null;
  return closingValue / dailyCogs;
}

/**
 * Formula: Stock Return (GMROI) = Gross Margin Earned / Average Stock Value
 * Example: 2.40 means Rs 2.40 of gross margin earned per Rs 1 invested in stock.
 */
export function calculateGmroi(grossMarginEarned: number, averageStockValue: number): number | null {
  if (averageStockValue <= 0) return null;
  return grossMarginEarned / averageStockValue;
}

/**
 * Quadrant assignment using Days on Hand (fast vs slow) and Gross Margin % (high vs low).
 */
export function classifyQuadrant(
  grossMarginPct: number,
  daysOfStockOnHand: number | null,
  slowThresholdDays: number
): QuadrantId {
  const isHighMargin = grossMarginPct >= HIGH_MARGIN_THRESHOLD_PCT;
  const isFast = daysOfStockOnHand !== null && daysOfStockOnHand <= slowThresholdDays;

  if (isHighMargin && isFast) return 'keep-and-grow';
  if (isHighMargin && !isFast) return 'check-price-or-order';
  if (!isHighMargin && isFast) return 'reprice-or-sell-faster';
  return 'clear-or-stop';
}

/**
 * Checks whether the physical closing count is negative or exceeds opening stock plus purchases.
 */
export const RECONCILIATION_ERROR_MESSAGE =
  'Count is higher than possible. Recheck the shelf count or the bills.';

export function validateClosingCount(
  openingCount: number,
  purchasesUnits: number,
  closingCount: number | null
): string | null {
  if (closingCount === null) return null;
  if (closingCount < 0 || closingCount > openingCount + purchasesUnits) {
    return RECONCILIATION_ERROR_MESSAGE;
  }
  return null;
}

/**
 * Computes all inventory and margin metrics for a single stock item in the review period.
 */
export function computeItemMetrics(
  item: StockItem,
  billsForPeriod: PurchaseBill[],
  daysInPeriod: number,
  slowThresholdDays: number
): ItemMetrics {
  const itemBills = billsForPeriod.filter((bill) => bill.itemId === item.id);
  const purchasesUnits = itemBills.reduce((sum, bill) => sum + Math.max(0, bill.quantity), 0);
  const purchasesValue = itemBills.reduce(
    (sum, bill) => sum + Math.max(0, bill.quantity) * Math.max(0, bill.costPerUnit),
    0
  );

  const openingValue = calculateOpeningValue(item.openingCount, item.costPrice);
  const effectiveCostPrice = calculateEffectiveCostPrice(
    item.openingCount,
    item.costPrice,
    purchasesUnits,
    purchasesValue
  );
  const closingValue = calculateClosingValue(item.closingCount, effectiveCostPrice);

  const { cogsValue, salesUnits, isEstimated } = calculateCogs({
    openingValue,
    purchasesValue,
    closingValue,
    openingCount: item.openingCount,
    purchasesUnits,
    closingCount: item.closingCount,
    effectiveCostPrice,
    recordedSalesUnits: item.recordedSalesUnits,
  });

  const grossMarginPct = calculateGrossMarginPct(item.sellingPrice, effectiveCostPrice);
  const grossMarginPerUnit =
    item.sellingPrice !== null && item.sellingPrice > 0
      ? item.sellingPrice - effectiveCostPrice
      : 0;
  const grossMarginEarned = calculateGrossMarginEarned(
    salesUnits,
    item.sellingPrice,
    effectiveCostPrice
  );
  const averageStockValue = calculateAverageStockValue(openingValue, closingValue);
  const daysOfStockOnHand = calculateDaysOfStockOnHand(closingValue, cogsValue, daysInPeriod);
  const gmroi = calculateGmroi(grossMarginEarned, averageStockValue);
  const quadrant = classifyQuadrant(grossMarginPct, daysOfStockOnHand, slowThresholdDays);
  const countWarning = validateClosingCount(item.openingCount, purchasesUnits, item.closingCount);

  return {
    item,
    purchasesUnits,
    purchasesValue,
    effectiveCostPrice,
    openingValue,
    closingValue,
    cogsValue,
    salesUnits,
    isEstimated,
    grossMarginPct,
    grossMarginPerUnit,
    grossMarginEarned,
    averageStockValue,
    daysOfStockOnHand,
    gmroi,
    quadrant,
    countWarning,
  };
}

/**
 * Computes metrics for all items and ranks them by Stock Return (GMROI), highest first.
 */
export function rankItemsByGmroi(
  items: StockItem[],
  bills: PurchaseBill[],
  daysInPeriod: number,
  slowThresholdDays: number
): ItemMetrics[] {
  return items
    .map((item) => computeItemMetrics(item, bills, daysInPeriod, slowThresholdDays))
    .sort((a, b) => {
      const aVal = a.gmroi ?? -Infinity;
      const bVal = b.gmroi ?? -Infinity;
      if (bVal !== aVal) return bVal - aVal;
      return b.grossMarginEarned - a.grossMarginEarned;
    });
}

export interface DataCompletenessStats {
  totalItems: number;
  withCount: number;
  withCostPrice: number;
  withSellingPrice: number;
  withBillInPeriod: number;
}

/**
 * Computes Data Completeness counts (not a business score).
 */
export function computeDataCompleteness(
  items: StockItem[],
  bills: PurchaseBill[]
): DataCompletenessStats {
  const billItemIds = new Set(bills.map((b) => b.itemId));
  return {
    totalItems: items.length,
    withCount: items.filter((i) => i.closingCount !== null && i.closingCount >= 0).length,
    withCostPrice: items.filter((i) => i.costPrice > 0).length,
    withSellingPrice: items.filter((i) => i.sellingPrice !== null && i.sellingPrice > 0).length,
    withBillInPeriod: items.filter((i) => billItemIds.has(i.id)).length,
  };
}

export interface ReconciliationSummary {
  allReconcile: boolean;
  items: ReconciliationItemStatus[];
  unreconciledItems: ReconciliationItemStatus[];
}

/**
 * Formula: Expected Closing = Opening Count + Purchased - Expected Sales
 * Expected sales come from recorded sales if entered; otherwise the item is marked as an estimate.
 * Any item where closing count < 0 or closing count > opening + purchased fails reconciliation.
 */
export function evaluateReconciliation(
  items: StockItem[],
  billsForPeriod: PurchaseBill[]
): ReconciliationSummary {
  const purchasedByItem = new Map<string, number>();
  for (const b of billsForPeriod) {
    purchasedByItem.set(b.itemId, (purchasedByItem.get(b.itemId) ?? 0) + Math.max(0, b.quantity));
  }

  const results: ReconciliationItemStatus[] = items.map((item) => {
    const purchasedUnits = purchasedByItem.get(item.id) ?? 0;
    const hasRecorded = item.recordedSalesUnits !== null && item.recordedSalesUnits >= 0;
    const isEstimated = !hasRecorded;

    const expectedSales = hasRecorded
      ? item.recordedSalesUnits!
      : Math.max(0, item.openingCount + purchasedUnits - (item.closingCount ?? item.openingCount + purchasedUnits));

    const expectedClosing = hasRecorded
      ? item.openingCount + purchasedUnits - expectedSales
      : item.closingCount;

    const errorMessage = validateClosingCount(
      item.openingCount,
      purchasedUnits,
      item.closingCount
    );
    const reconciles = errorMessage === null;

    return {
      itemId: item.id,
      itemName: item.name,
      openingCount: item.openingCount,
      purchasedUnits,
      expectedSales,
      expectedClosing,
      actualClosing: item.closingCount,
      isEstimated,
      reconciles,
      errorMessage,
    };
  });

  const unreconciledItems = results.filter((r) => !r.reconciles);

  return {
    allReconcile: items.length > 0 && unreconciledItems.length === 0,
    items: results,
    unreconciledItems,
  };
}

/**
 * Formula: Overall Estimated Gross Margin % = Total Margin Earned / (Total COGS + Total Margin Earned) * 100
 */
export function computeOverallGrossMarginPct(metricsList: ItemMetrics[]): number {
  const totalCogs = metricsList.reduce((sum, m) => sum + m.cogsValue, 0);
  const totalMargin = metricsList.reduce((sum, m) => sum + m.grossMarginEarned, 0);
  const estimatedSalesValue = totalCogs + totalMargin;
  if (estimatedSalesValue <= 0) return 0;
  return (totalMargin / estimatedSalesValue) * 100;
}

export interface CalculationTestResult {
  id: string;
  name: string;
  description: string;
  expectedSummary: string;
  actualSummary: string;
  passed: boolean;
}

/**
 * Self-test suite verifying 3 hand-calculated example items (used in Settings test panel).
 */
export function runCalculationSelfTests(): CalculationTestResult[] {
  // Test 1: Fast dairy item (Milk 1 L)
  const milk: StockItem = {
    id: 'test-milk',
    name: 'Milk 1 L',
    category: 'dairy',
    packSize: '1 L',
    costPrice: 54,
    sellingPrice: 60,
    openingCount: 20,
    closingCount: 10,
    perishable: true,
    daysToExpiry: 2,
    recordedSalesUnits: null,
  };
  const milkBills: PurchaseBill[] = [
    {
      id: 'tb-1',
      billDate: '2026-09-10',
      supplier: 'Local distributor, Greater Noida',
      billNumber: 'T-01',
      itemId: 'test-milk',
      quantity: 300,
      costPerUnit: 54,
      gstIncluded: true,
    },
  ];
  const milkMetrics = computeItemMetrics(milk, milkBills, 30, 30);
  const milkPass =
    milkMetrics.salesUnits === 310 &&
    Math.round(milkMetrics.cogsValue) === 16740 &&
    Math.abs(milkMetrics.grossMarginPct - 10.0) < 0.05 &&
    Math.round(milkMetrics.grossMarginEarned) === 1860 &&
    Math.abs((milkMetrics.gmroi ?? 0) - 2.2963) < 0.02 &&
    Math.abs((milkMetrics.daysOfStockOnHand ?? 0) - 0.9677) < 0.05;

  // Test 2: Slow high-margin grocery item (Spices Family Pack 500 g)
  const spices: StockItem = {
    id: 'test-spices',
    name: 'Spices Family Pack 500 g',
    category: 'grocery',
    packSize: '500 g',
    costPrice: 160,
    sellingPrice: 220,
    openingCount: 12,
    closingCount: 10,
    perishable: false,
    daysToExpiry: null,
    recordedSalesUnits: null,
  };
  const spicesMetrics = computeItemMetrics(spices, [], 30, 30);
  const spicesPass =
    spicesMetrics.salesUnits === 2 &&
    Math.round(spicesMetrics.cogsValue) === 320 &&
    Math.abs(spicesMetrics.grossMarginPct - 27.27) < 0.1 &&
    Math.round(spicesMetrics.grossMarginEarned) === 120 &&
    Math.abs((spicesMetrics.daysOfStockOnHand ?? 0) - 150.0) < 0.1 &&
    Math.abs((spicesMetrics.gmroi ?? 0) - 0.0682) < 0.01;

  // Test 3: Zero-movement dead item (Old Biscuit Tin 400 g)
  const biscuit: StockItem = {
    id: 'test-biscuit',
    name: 'Old Biscuit Tin 400 g',
    category: 'snacks',
    packSize: '400 g',
    costPrice: 90,
    sellingPrice: 110,
    openingCount: 8,
    closingCount: 8,
    perishable: false,
    daysToExpiry: null,
    recordedSalesUnits: null,
  };
  const biscuitMetrics = computeItemMetrics(biscuit, [], 30, 30);
  const biscuitPass =
    biscuitMetrics.salesUnits === 0 &&
    Math.round(biscuitMetrics.cogsValue) === 0 &&
    biscuitMetrics.daysOfStockOnHand === null &&
    Math.round(biscuitMetrics.closingValue) === 720 &&
    Math.abs((biscuitMetrics.gmroi ?? 0) - 0) < 0.001;

  return [
    {
      id: 'case-1',
      name: 'Fast Dairy (Milk 1 L)',
      description: 'Open 20, Buy 300 @ Rs 54, Close 10, Sell Rs 60 (30 days)',
      expectedSummary: 'COGS Rs 16,740 · Margin 10.0% · GMROI 2.30 · 1.0 days',
      actualSummary: `COGS Rs ${Math.round(milkMetrics.cogsValue).toLocaleString('en-IN')} · Margin ${milkMetrics.grossMarginPct.toFixed(1)}% · GMROI ${(milkMetrics.gmroi ?? 0).toFixed(2)} · ${(milkMetrics.daysOfStockOnHand ?? 0).toFixed(1)} days`,
      passed: milkPass,
    },
    {
      id: 'case-2',
      name: 'Slow High-Margin (Spices 500 g)',
      description: 'Open 12, Buy 0 @ Rs 160, Close 10, Sell Rs 220 (30 days)',
      expectedSummary: 'COGS Rs 320 · Margin 27.3% · GMROI 0.07 · 150.0 days',
      actualSummary: `COGS Rs ${Math.round(spicesMetrics.cogsValue).toLocaleString('en-IN')} · Margin ${spicesMetrics.grossMarginPct.toFixed(1)}% · GMROI ${(spicesMetrics.gmroi ?? 0).toFixed(2)} · ${(spicesMetrics.daysOfStockOnHand ?? 0).toFixed(1)} days`,
      passed: spicesPass,
    },
    {
      id: 'case-3',
      name: 'No Movement (Old Biscuit Tin)',
      description: 'Open 8, Buy 0 @ Rs 90, Close 8, Sell Rs 110 (30 days)',
      expectedSummary: 'COGS Rs 0 · Closing Rs 720 · GMROI 0.00 · No movement',
      actualSummary: `COGS Rs ${Math.round(biscuitMetrics.cogsValue).toLocaleString('en-IN')} · Closing Rs ${Math.round(biscuitMetrics.closingValue).toLocaleString('en-IN')} · GMROI ${(biscuitMetrics.gmroi ?? 0).toFixed(2)} · ${biscuitMetrics.daysOfStockOnHand === null ? 'No movement' : `${biscuitMetrics.daysOfStockOnHand.toFixed(1)} days`}`,
      passed: biscuitPass,
    },
  ];
}

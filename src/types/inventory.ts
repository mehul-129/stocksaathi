/**
 * Core domain types for Stock & Margin Review.
 */

export type ShopType = 'general store' | 'dairy' | 'kirana' | 'other';

export type ItemCategory =
  | 'grocery'
  | 'dairy'
  | 'bakery'
  | 'beverages'
  | 'personal care'
  | 'snacks'
  | 'household'
  | 'other';

export type NavSection =
  | 'shop-setup'
  | 'stock-count'
  | 'bills'
  | 'items-margins'
  | 'slow-stock'
  | 'actions'
  | 'monthly-report'
  | 'settings';

export type ReviewMonthId = '2026-08' | '2026-09' | '2026-10';

export interface ShopSetup {
  shopName: string;
  ownerName: string;
  locality: string;
  shopType: ShopType;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  countDate: string; // YYYY-MM-DD
  lastSavedAt: string | null; // ISO timestamp
}

export interface StockItem {
  id: string;
  name: string;
  category: ItemCategory;
  packSize: string;
  costPrice: number; // Rs per unit (opening / baseline unit cost)
  sellingPrice: number | null; // MRP or shelf price (Rs per unit)
  openingCount: number;
  closingCount: number | null;
  perishable: boolean;
  daysToExpiry: number | null;
  recordedSalesUnits: number | null; // Optional owner-recorded sales units
}

export interface PurchaseBill {
  id: string;
  billDate: string; // YYYY-MM-DD
  supplier: string;
  billNumber: string;
  itemId: string;
  quantity: number;
  costPerUnit: number;
  gstIncluded: boolean;
}

export type QuadrantId =
  | 'keep-and-grow'
  | 'check-price-or-order'
  | 'reprice-or-sell-faster'
  | 'clear-or-stop';

export interface ItemMetrics {
  item: StockItem;
  purchasesUnits: number;
  purchasesValue: number;
  effectiveCostPrice: number;
  openingValue: number;
  closingValue: number;
  cogsValue: number;
  salesUnits: number;
  isEstimated: boolean;
  grossMarginPct: number; // 0 to 100
  grossMarginPerUnit: number;
  grossMarginEarned: number;
  averageStockValue: number;
  daysOfStockOnHand: number | null; // null => "No movement"
  gmroi: number | null; // Stock return ratio
  quadrant: QuadrantId;
  countWarning: string | null;
}

export type SlowStockSeverity = 'normal' | 'slow' | 'dead';

export interface SlowStockEntry {
  metrics: ItemMetrics;
  severity: SlowStockSeverity;
  cashTiedUp: number;
  isNearExpiry: boolean;
  isStaple: boolean;
  suggestedAction: string;
  reason: string;
  customAction: string | null;
}

export interface SlowStockSummary {
  entries: SlowStockEntry[];
  cashTiedInSlow: number;
  cashTiedInDead: number;
  totalClosingStockValue: number;
  slowAndDeadSharePct: number;
}

export interface ReconciliationItemStatus {
  itemId: string;
  itemName: string;
  openingCount: number;
  purchasedUnits: number;
  expectedSales: number;
  expectedClosing: number | null;
  actualClosing: number | null;
  isEstimated: boolean;
  reconciles: boolean;
  errorMessage: string | null;
}

export type ActionDecision = 'pending' | 'accepted' | 'changed' | 'rejected';

export interface GeneratedAction {
  id: string;
  ruleKey: 'slow-cash' | 'margin-stock-gap' | 'near-expiry';
  label: string;
  description: string;
  rupeesAtStake: number;
  relatedItemNames: string[];
}

export interface ActionUserState {
  ownerAction: string;
  decision: ActionDecision;
  note: string;
}

export interface PreviousMonthAction {
  id: string;
  monthLabel: string;
  description: string;
  ownerAction: string;
  rupeesAtStake: number;
  done: boolean;
}

export interface AppSettings {
  slowThresholdDays: number;
  deadThresholdDays: number;
  nearExpiryThresholdDays: number;
  typicalMarginMinPct: number;
  typicalMarginMaxPct: number;
  consultantName: string;
  consultantContact: string;
  dataMode: 'demo' | 'blank';
}

export interface MonthDataset {
  id: ReviewMonthId;
  label: string;
  setup: ShopSetup;
  items: StockItem[];
  bills: PurchaseBill[];
  previousActions: PreviousMonthAction[];
  actionOverrides: Record<string, ActionUserState>;
  slowActionOverrides: Record<string, string>;
}

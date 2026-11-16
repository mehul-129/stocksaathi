/**
 * ============================================================================
 * DATA SECTION
 * Deterministic demo datasets for Sharma General Store (Sector Alpha II,
 * Greater Noida) across August, September, and October 2026, plus a clean
 * Blank Shop factory. All data is fictional demo data.
 * ============================================================================
 */

import type {
  AppSettings,
  MonthDataset,
  PreviousMonthAction,
  PurchaseBill,
  ReviewMonthId,
  StockItem,
} from '../types/inventory';

export const DEFAULT_SETTINGS: AppSettings = {
  slowThresholdDays: 30,
  deadThresholdDays: 60,
  nearExpiryThresholdDays: 3,
  typicalMarginMinPct: 12,
  typicalMarginMaxPct: 20,
  consultantName: 'Ananya Verma',
  consultantContact: '',
  dataMode: 'demo',
};

interface SeedItemSpec {
  id: string;
  name: string;
  category: StockItem['category'];
  packSize: string;
  costPrice: number;
  sellingPrice: number;
  openSep: number;
  closeSep: number;
  perishable: boolean;
  daysToExpiry: number | null;
  recordedSep?: number | null;
}

const DEMO_ITEMS_SPEC: SeedItemSpec[] = [
  // Dairy & Bakery (Fast & Perishable)
  { id: 'itm-01', name: 'Milk 1 L', category: 'dairy', packSize: '1 L', costPrice: 54, sellingPrice: 60, openSep: 18, closeSep: 12, perishable: true, daysToExpiry: 1 },
  { id: 'itm-02', name: 'Curd 500 g', category: 'dairy', packSize: '500 g', costPrice: 36, sellingPrice: 44, openSep: 14, closeSep: 8, perishable: true, daysToExpiry: 2 },
  { id: 'itm-03', name: 'Paneer 200 g', category: 'dairy', packSize: '200 g', costPrice: 70, sellingPrice: 90, openSep: 10, closeSep: 6, perishable: true, daysToExpiry: 2 },
  { id: 'itm-04', name: 'Brown Bread Loaf', category: 'bakery', packSize: '400 g', costPrice: 38, sellingPrice: 48, openSep: 12, closeSep: 5, perishable: true, daysToExpiry: 1 },
  { id: 'itm-05', name: 'White Bread Loaf', category: 'bakery', packSize: '400 g', costPrice: 34, sellingPrice: 42, openSep: 15, closeSep: 6, perishable: true, daysToExpiry: 2 },
  { id: 'itm-06', name: 'Butter 100 g', category: 'dairy', packSize: '100 g', costPrice: 48, sellingPrice: 58, openSep: 16, closeSep: 14, perishable: true, daysToExpiry: 18 },
  { id: 'itm-07', name: 'Flavoured Lassi 200 ml', category: 'dairy', packSize: '200 ml', costPrice: 18, sellingPrice: 25, openSep: 20, closeSep: 18, perishable: true, daysToExpiry: 5 },
  { id: 'itm-08', name: 'Cream Rusk Pack 250 g', category: 'bakery', packSize: '250 g', costPrice: 32, sellingPrice: 45, openSep: 12, closeSep: 4, perishable: false, daysToExpiry: null },

  // Grocery Staples
  { id: 'itm-09', name: 'Atta 5 kg', category: 'grocery', packSize: '5 kg', costPrice: 215, sellingPrice: 240, openSep: 12, closeSep: 9, perishable: false, daysToExpiry: null },
  { id: 'itm-10', name: 'Basmati Rice 1 kg', category: 'grocery', packSize: '1 kg', costPrice: 96, sellingPrice: 118, openSep: 24, closeSep: 16, perishable: false, daysToExpiry: null },
  { id: 'itm-11', name: 'Toor Dal 1 kg', category: 'grocery', packSize: '1 kg', costPrice: 138, sellingPrice: 165, openSep: 18, closeSep: 12, perishable: false, daysToExpiry: null },
  { id: 'itm-12', name: 'Sugar 1 kg', category: 'grocery', packSize: '1 kg', costPrice: 42, sellingPrice: 46, openSep: 30, closeSep: 28, perishable: false, daysToExpiry: null },
  { id: 'itm-13', name: 'Refined Oil 1 L', category: 'grocery', packSize: '1 L', costPrice: 124, sellingPrice: 138, openSep: 20, closeSep: 18, perishable: false, daysToExpiry: null },
  { id: 'itm-14', name: 'Mustard Oil 1 L', category: 'grocery', packSize: '1 L', costPrice: 148, sellingPrice: 168, openSep: 16, closeSep: 12, perishable: false, daysToExpiry: null },
  { id: 'itm-15', name: 'Tea Powder 250 g', category: 'grocery', packSize: '250 g', costPrice: 98, sellingPrice: 128, openSep: 16, closeSep: 6, perishable: false, daysToExpiry: null, recordedSep: 22 },
  { id: 'itm-16', name: 'Salt 1 kg', category: 'grocery', packSize: '1 kg', costPrice: 22, sellingPrice: 26, openSep: 35, closeSep: 20, perishable: false, daysToExpiry: null },
  { id: 'itm-17', name: 'Maggi Noodles 70 g', category: 'snacks', packSize: '70 g', costPrice: 11.5, sellingPrice: 14, openSep: 48, closeSep: 14, perishable: false, daysToExpiry: null },
  { id: 'itm-18', name: 'Poha 500 g', category: 'grocery', packSize: '500 g', costPrice: 34, sellingPrice: 44, openSep: 18, closeSep: 10, perishable: false, daysToExpiry: null },
  { id: 'itm-19', name: 'Moong Dal 500 g', category: 'grocery', packSize: '500 g', costPrice: 66, sellingPrice: 82, openSep: 14, closeSep: 9, perishable: false, daysToExpiry: null },
  { id: 'itm-20', name: 'Family Masala Pack 500 g', category: 'grocery', packSize: '500 g', costPrice: 185, sellingPrice: 235, openSep: 8, closeSep: 16, perishable: false, daysToExpiry: null }, // Slow item bought once in week 1, very low sales!

  // Biscuits & Snacks
  { id: 'itm-21', name: 'Parle Glucose Biscuit 200 g', category: 'snacks', packSize: '200 g', costPrice: 16, sellingPrice: 20, openSep: 40, closeSep: 15, perishable: false, daysToExpiry: null },
  { id: 'itm-22', name: 'Cream Crunch Biscuit 150 g', category: 'snacks', packSize: '150 g', costPrice: 24, sellingPrice: 32, openSep: 25, closeSep: 12, perishable: false, daysToExpiry: null },
  { id: 'itm-23', name: 'Digestive Oats Biscuit 200 g', category: 'snacks', packSize: '200 g', costPrice: 42, sellingPrice: 52, openSep: 22, closeSep: 19, perishable: false, daysToExpiry: null }, // Slow (~190 days)
  { id: 'itm-24', name: 'Royal Heritage Biscuit Tin 400 g', category: 'snacks', packSize: '400 g', costPrice: 110, sellingPrice: 135, openSep: 14, closeSep: 14, perishable: false, daysToExpiry: null }, // Dead: 0 movement
  { id: 'itm-25', name: 'Salted Chips Pack 50 g', category: 'snacks', packSize: '50 g', costPrice: 15, sellingPrice: 20, openSep: 36, closeSep: 8, perishable: false, daysToExpiry: null },
  { id: 'itm-26', name: 'Masala Chips Pack 50 g', category: 'snacks', packSize: '50 g', costPrice: 15, sellingPrice: 20, openSep: 30, closeSep: 10, perishable: false, daysToExpiry: null },
  { id: 'itm-27', name: 'Roasted Namkeen 200 g', category: 'snacks', packSize: '200 g', costPrice: 44, sellingPrice: 58, openSep: 18, closeSep: 12, perishable: false, daysToExpiry: null },

  // Beverages
  { id: 'itm-28', name: 'Cold Drink 2 L', category: 'beverages', packSize: '2 L', costPrice: 76, sellingPrice: 95, openSep: 18, closeSep: 8, perishable: false, daysToExpiry: null, recordedSep: 34 },
  { id: 'itm-29', name: 'Cold Drink Can 300 ml', category: 'beverages', packSize: '300 ml', costPrice: 30, sellingPrice: 40, openSep: 24, closeSep: 10, perishable: false, daysToExpiry: null },
  { id: 'itm-30', name: 'Mango Juice Tetra 1 L', category: 'beverages', packSize: '1 L', costPrice: 88, sellingPrice: 110, openSep: 14, closeSep: 12, perishable: false, daysToExpiry: null }, // Slow
  { id: 'itm-31', name: 'Packaged Water 1 L', category: 'beverages', packSize: '1 L', costPrice: 13, sellingPrice: 20, openSep: 48, closeSep: 12, perishable: false, daysToExpiry: null },

  // Personal Care
  { id: 'itm-32', name: 'Bath Soap Bar 100 g', category: 'personal care', packSize: '100 g', costPrice: 27, sellingPrice: 36, openSep: 36, closeSep: 16, perishable: false, daysToExpiry: null },
  { id: 'itm-33', name: 'Herbal Toothpaste 100 g', category: 'personal care', packSize: '100 g', costPrice: 52, sellingPrice: 68, openSep: 20, closeSep: 10, perishable: false, daysToExpiry: null },
  { id: 'itm-34', name: 'Hair Oil Bottle 200 ml', category: 'personal care', packSize: '200 ml', costPrice: 84, sellingPrice: 105, openSep: 16, closeSep: 13, perishable: false, daysToExpiry: null }, // Slow (~130 days)
  { id: 'itm-35', name: 'Premium Face Wash 100 ml', category: 'personal care', packSize: '100 ml', costPrice: 135, sellingPrice: 160, openSep: 10, closeSep: 10, perishable: false, daysToExpiry: null }, // Dead: 0 movement

  // Household & Other
  { id: 'itm-36', name: 'Detergent Powder 1 kg', category: 'household', packSize: '1 kg', costPrice: 92, sellingPrice: 110, openSep: 22, closeSep: 18, perishable: false, daysToExpiry: null },
  { id: 'itm-37', name: 'Dish Wash Gel 500 ml', category: 'household', packSize: '500 ml', costPrice: 82, sellingPrice: 105, openSep: 14, closeSep: 8, perishable: false, daysToExpiry: null },
  { id: 'itm-38', name: 'Matchbox Pack (10 pcs)', category: 'household', packSize: '10 pcs', costPrice: 14, sellingPrice: 20, openSep: 40, closeSep: 22, perishable: false, daysToExpiry: null },
  { id: 'itm-39', name: 'Floor Cleaner 1 L', category: 'household', packSize: '1 L', costPrice: 115, sellingPrice: 128, openSep: 14, closeSep: 13, perishable: false, daysToExpiry: null }, // Low-margin, very slow (390 days)
  { id: 'itm-40', name: 'Incense Sticks Combo Pack', category: 'other', packSize: '1 box', costPrice: 45, sellingPrice: 65, openSep: 16, closeSep: 16, perishable: false, daysToExpiry: null }, // Dead: 0 movement
];

const SUPPLIER_LOCAL = 'Local distributor, Greater Noida';
const SUPPLIER_BRAND = 'Brand wholesaler';

interface BillSpec {
  day: number;
  supplier: string;
  billNo: string;
  itemId: string;
  qty: number;
  cost: number;
  gst: boolean;
}

// 60 realistic purchase bill lines across September 2026
const SEPTEMBER_BILLS_SPEC: BillSpec[] = [
  { day: 1, supplier: SUPPLIER_LOCAL, billNo: 'LD-901', itemId: 'itm-01', qty: 45, cost: 54, gst: false },
  { day: 1, supplier: SUPPLIER_LOCAL, billNo: 'LD-901', itemId: 'itm-02', qty: 20, cost: 36, gst: false },
  { day: 1, supplier: SUPPLIER_LOCAL, billNo: 'LD-901', itemId: 'itm-04', qty: 24, cost: 38, gst: false },
  { day: 2, supplier: SUPPLIER_BRAND, billNo: 'BW-412', itemId: 'itm-09', qty: 10, cost: 215, gst: true },
  { day: 2, supplier: SUPPLIER_BRAND, billNo: 'BW-412', itemId: 'itm-10', qty: 15, cost: 96, gst: true },
  { day: 2, supplier: SUPPLIER_BRAND, billNo: 'BW-412', itemId: 'itm-11', qty: 12, cost: 138, gst: true },
  { day: 3, supplier: SUPPLIER_LOCAL, billNo: 'LD-904', itemId: 'itm-03', qty: 14, cost: 70, gst: false },
  { day: 3, supplier: SUPPLIER_LOCAL, billNo: 'LD-904', itemId: 'itm-05', qty: 24, cost: 34, gst: false },
  { day: 4, supplier: SUPPLIER_BRAND, billNo: 'BW-418', itemId: 'itm-20', qty: 10, cost: 185, gst: true }, // Slow item bought once in week 1 only
  { day: 4, supplier: SUPPLIER_BRAND, billNo: 'BW-418', itemId: 'itm-17', qty: 60, cost: 11.5, gst: true },
  { day: 5, supplier: SUPPLIER_LOCAL, billNo: 'LD-909', itemId: 'itm-01', qty: 50, cost: 54, gst: false },
  { day: 5, supplier: SUPPLIER_LOCAL, billNo: 'LD-909', itemId: 'itm-28', qty: 12, cost: 76, gst: true },
  { day: 5, supplier: SUPPLIER_LOCAL, billNo: 'LD-909', itemId: 'itm-31', qty: 48, cost: 13, gst: true },
  { day: 6, supplier: SUPPLIER_BRAND, billNo: 'BW-422', itemId: 'itm-21', qty: 40, cost: 16, gst: true },
  { day: 6, supplier: SUPPLIER_BRAND, billNo: 'BW-422', itemId: 'itm-25', qty: 40, cost: 15, gst: true },
  { day: 6, supplier: SUPPLIER_BRAND, billNo: 'BW-422', itemId: 'itm-26', qty: 30, cost: 15, gst: true },
  { day: 7, supplier: SUPPLIER_LOCAL, billNo: 'LD-914', itemId: 'itm-02', qty: 20, cost: 36, gst: false },
  { day: 7, supplier: SUPPLIER_LOCAL, billNo: 'LD-914', itemId: 'itm-06', qty: 10, cost: 48, gst: true },
  { day: 8, supplier: SUPPLIER_BRAND, billNo: 'BW-429', itemId: 'itm-12', qty: 25, cost: 42, gst: true },
  { day: 8, supplier: SUPPLIER_BRAND, billNo: 'BW-429', itemId: 'itm-13', qty: 15, cost: 124, gst: true },
  { day: 9, supplier: SUPPLIER_LOCAL, billNo: 'LD-918', itemId: 'itm-01', qty: 50, cost: 54, gst: false },
  { day: 9, supplier: SUPPLIER_LOCAL, billNo: 'LD-918', itemId: 'itm-04', qty: 22, cost: 38, gst: false },
  { day: 10, supplier: SUPPLIER_BRAND, billNo: 'BW-433', itemId: 'itm-15', qty: 12, cost: 98, gst: true },
  { day: 10, supplier: SUPPLIER_BRAND, billNo: 'BW-433', itemId: 'itm-32', qty: 24, cost: 27, gst: true },
  { day: 11, supplier: SUPPLIER_LOCAL, billNo: 'LD-922', itemId: 'itm-03', qty: 15, cost: 70, gst: false },
  { day: 11, supplier: SUPPLIER_LOCAL, billNo: 'LD-922', itemId: 'itm-07', qty: 16, cost: 18, gst: false },
  { day: 12, supplier: SUPPLIER_BRAND, billNo: 'BW-440', itemId: 'itm-09', qty: 10, cost: 215, gst: true },
  { day: 12, supplier: SUPPLIER_BRAND, billNo: 'BW-440', itemId: 'itm-14', qty: 10, cost: 148, gst: true },
  { day: 13, supplier: SUPPLIER_LOCAL, billNo: 'LD-927', itemId: 'itm-01', qty: 55, cost: 54, gst: false },
  { day: 13, supplier: SUPPLIER_LOCAL, billNo: 'LD-927', itemId: 'itm-05', qty: 24, cost: 34, gst: false },
  { day: 14, supplier: SUPPLIER_BRAND, billNo: 'BW-445', itemId: 'itm-22', qty: 20, cost: 24, gst: true },
  { day: 14, supplier: SUPPLIER_BRAND, billNo: 'BW-445', itemId: 'itm-29', qty: 24, cost: 30, gst: true },
  { day: 15, supplier: SUPPLIER_LOCAL, billNo: 'LD-931', itemId: 'itm-02', qty: 22, cost: 36, gst: false },
  { day: 15, supplier: SUPPLIER_LOCAL, billNo: 'LD-931', itemId: 'itm-08', qty: 15, cost: 32, gst: true },
  { day: 16, supplier: SUPPLIER_BRAND, billNo: 'BW-451', itemId: 'itm-16', qty: 20, cost: 22, gst: true },
  { day: 16, supplier: SUPPLIER_BRAND, billNo: 'BW-451', itemId: 'itm-17', qty: 60, cost: 11.5, gst: true },
  { day: 17, supplier: SUPPLIER_LOCAL, billNo: 'LD-936', itemId: 'itm-01', qty: 50, cost: 54, gst: false },
  { day: 17, supplier: SUPPLIER_LOCAL, billNo: 'LD-936', itemId: 'itm-28', qty: 12, cost: 76, gst: true },
  { day: 18, supplier: SUPPLIER_BRAND, billNo: 'BW-458', itemId: 'itm-33', qty: 15, cost: 52, gst: true },
  { day: 18, supplier: SUPPLIER_BRAND, billNo: 'BW-458', itemId: 'itm-36', qty: 12, cost: 92, gst: true },
  { day: 19, supplier: SUPPLIER_LOCAL, billNo: 'LD-940', itemId: 'itm-03', qty: 14, cost: 70, gst: false },
  { day: 19, supplier: SUPPLIER_LOCAL, billNo: 'LD-940', itemId: 'itm-04', qty: 20, cost: 38, gst: false },
  { day: 20, supplier: SUPPLIER_BRAND, billNo: 'BW-462', itemId: 'itm-10', qty: 12, cost: 96, gst: true },
  { day: 20, supplier: SUPPLIER_BRAND, billNo: 'BW-462', itemId: 'itm-18', qty: 16, cost: 34, gst: true },
  { day: 21, supplier: SUPPLIER_LOCAL, billNo: 'LD-946', itemId: 'itm-01', qty: 55, cost: 54, gst: false },
  { day: 21, supplier: SUPPLIER_LOCAL, billNo: 'LD-946', itemId: 'itm-31', qty: 48, cost: 13, gst: true },
  { day: 22, supplier: SUPPLIER_BRAND, billNo: 'BW-469', itemId: 'itm-21', qty: 36, cost: 16, gst: true },
  { day: 22, supplier: SUPPLIER_BRAND, billNo: 'BW-469', itemId: 'itm-25', qty: 30, cost: 15, gst: true },
  { day: 23, supplier: SUPPLIER_LOCAL, billNo: 'LD-951', itemId: 'itm-02', qty: 20, cost: 36, gst: false },
  { day: 23, supplier: SUPPLIER_LOCAL, billNo: 'LD-951', itemId: 'itm-05', qty: 20, cost: 34, gst: false },
  { day: 24, supplier: SUPPLIER_BRAND, billNo: 'BW-474', itemId: 'itm-27', qty: 12, cost: 44, gst: true },
  { day: 24, supplier: SUPPLIER_BRAND, billNo: 'BW-474', itemId: 'itm-37', qty: 12, cost: 82, gst: true },
  { day: 25, supplier: SUPPLIER_LOCAL, billNo: 'LD-955', itemId: 'itm-01', qty: 50, cost: 54, gst: false },
  { day: 25, supplier: SUPPLIER_LOCAL, billNo: 'LD-955', itemId: 'itm-03', qty: 12, cost: 70, gst: false },
  { day: 26, supplier: SUPPLIER_BRAND, billNo: 'BW-480', itemId: 'itm-19', qty: 12, cost: 66, gst: true },
  { day: 26, supplier: SUPPLIER_BRAND, billNo: 'BW-480', itemId: 'itm-38', qty: 20, cost: 14, gst: true },
  { day: 27, supplier: SUPPLIER_LOCAL, billNo: 'LD-960', itemId: 'itm-04', qty: 18, cost: 38, gst: false },
  { day: 27, supplier: SUPPLIER_LOCAL, billNo: 'LD-960', itemId: 'itm-26', qty: 24, cost: 15, gst: true },
  { day: 28, supplier: SUPPLIER_BRAND, billNo: 'BW-486', itemId: 'itm-32', qty: 20, cost: 27, gst: true },
  { day: 29, supplier: SUPPLIER_LOCAL, billNo: 'LD-964', itemId: 'itm-01', qty: 45, cost: 54, gst: false },
];

function padDay(day: number): string {
  return String(day).padStart(2, '0');
}

function buildBillsForMonth(
  monthPrefix: string,
  specs: BillSpec[],
  qtyScale = 1
): PurchaseBill[] {
  return specs.map((spec, index) => ({
    id: `bill-${monthPrefix}-${index + 1}`,
    billDate: `${monthPrefix}-${padDay(spec.day)}`,
    supplier: spec.supplier,
    billNumber: spec.billNo,
    itemId: spec.itemId,
    quantity: Math.max(1, Math.round(spec.qty * qtyScale)),
    costPerUnit: spec.cost,
    gstIncluded: spec.gst,
  }));
}

function buildItemsForMonth(monthId: ReviewMonthId): StockItem[] {
  return DEMO_ITEMS_SPEC.map((spec, idx) => {
    if (monthId === '2026-09') {
      return {
        id: spec.id,
        name: spec.name,
        category: spec.category,
        packSize: spec.packSize,
        costPrice: spec.costPrice,
        sellingPrice: spec.sellingPrice,
        openingCount: spec.openSep,
        closingCount: spec.closeSep,
        perishable: spec.perishable,
        daysToExpiry: spec.daysToExpiry,
        recordedSalesUnits: spec.recordedSep ?? null,
      };
    }

    if (monthId === '2026-08') {
      // August 2026 snapshot: slightly different counts so switching Review Month updates all metrics
      const openAug = spec.openSep + 4;
      const closeAug = spec.openSep;
      return {
        id: spec.id,
        name: spec.name,
        category: spec.category,
        packSize: spec.packSize,
        costPrice: spec.costPrice,
        sellingPrice: spec.sellingPrice,
        openingCount: openAug,
        closingCount: closeAug,
        perishable: spec.perishable,
        daysToExpiry: spec.perishable ? Math.max(1, (spec.daysToExpiry ?? 4) + 1) : null,
        recordedSalesUnits: null,
      };
    }

    // October 2026 snapshot: post-review improvement (lower slow stock, slightly faster turnover)
    const openOct = spec.closeSep;
    const closeOct =
      spec.id === 'itm-24' || spec.id === 'itm-35'
        ? Math.max(0, spec.closeSep - 4)
        : Math.max(2, spec.closeSep - (idx % 2 === 0 ? 2 : 1));
    return {
      id: spec.id,
      name: spec.name,
      category: spec.category,
      packSize: spec.packSize,
      costPrice: spec.costPrice,
      sellingPrice: spec.sellingPrice,
      openingCount: openOct,
      closingCount: closeOct,
      perishable: spec.perishable,
      daysToExpiry: spec.perishable ? Math.max(1, spec.daysToExpiry ?? 2) : null,
      recordedSalesUnits: null,
    };
  });
}

const SEP_PREV_ACTIONS: PreviousMonthAction[] = [
  {
    id: 'prev-aug-1',
    monthLabel: 'August 2026',
    description: 'Cut extra sugar and cooking oil bulk order by 20% to free counter space.',
    ownerAction: 'Ordered 15 L refined oil instead of 25 L',
    rupeesAtStake: 2480,
    done: true,
  },
  {
    id: 'prev-aug-2',
    monthLabel: 'August 2026',
    description: 'Move high-margin tea powder and namkeen packs to eye-level rack.',
    ownerAction: 'Placed Tea 250 g and Roasted Namkeen near billing counter',
    rupeesAtStake: 1650,
    done: true,
  },
  {
    id: 'prev-aug-3',
    monthLabel: 'August 2026',
    description: 'Check distributor return terms for old Heritage Biscuit Tin stock.',
    ownerAction: 'Will ask Brand wholesaler salesman on Thursday visit',
    rupeesAtStake: 1540,
    done: false,
  },
];

const AUG_PREV_ACTIONS: PreviousMonthAction[] = [
  {
    id: 'prev-jul-1',
    monthLabel: 'July 2026',
    description: 'Standardize daily morning milk and bread order quantities.',
    ownerAction: 'Fixed daily morning milk indent at 10 L on weekdays',
    rupeesAtStake: 1920,
    done: true,
  },
  {
    id: 'prev-jul-2',
    monthLabel: 'July 2026',
    description: 'Stop ordering slow floor cleaner 1 L until existing cartons drop below 5.',
    ownerAction: 'Skipped July and August floor cleaner restock',
    rupeesAtStake: 1495,
    done: false,
  },
];

const OCT_PREV_ACTIONS: PreviousMonthAction[] = [
  {
    id: 'prev-sep-1',
    monthLabel: 'September 2026',
    description: 'Pause reordering Family Masala Pack 500 g and offer combo bundle with Basmati rice.',
    ownerAction: 'Bundled masala pack with 5 kg rice at Rs 20 off',
    rupeesAtStake: 2960,
    done: true,
  },
  {
    id: 'prev-sep-2',
    monthLabel: 'September 2026',
    description: 'Sell near-expiry paneer and curd first every morning at 10% evening markdown.',
    ownerAction: 'Started evening dairy clearance after 7:30 PM',
    rupeesAtStake: 1100,
    done: true,
  },
  {
    id: 'prev-sep-3',
    monthLabel: 'September 2026',
    description: 'Ask Brand wholesaler for credit note on Royal Heritage Biscuit Tin 400 g.',
    ownerAction: 'Returned 4 unopened tins on 5 Oct visit',
    rupeesAtStake: 1540,
    done: true,
  },
];

export function createDemoDatasets(): Record<ReviewMonthId, MonthDataset> {
  return {
    '2026-08': {
      id: '2026-08',
      label: 'August 2026',
      setup: {
        shopName: 'Sharma General Store',
        ownerName: 'Rajesh Sharma',
        locality: 'Sector Alpha II, Greater Noida',
        shopType: 'kirana',
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        countDate: '2026-08-31',
        lastSavedAt: '2026-08-31T19:15:00',
      },
      items: buildItemsForMonth('2026-08'),
      bills: buildBillsForMonth('2026-08', SEPTEMBER_BILLS_SPEC.slice(0, 48), 0.9),
      previousActions: AUG_PREV_ACTIONS,
      actionOverrides: {},
      slowActionOverrides: {},
    },
    '2026-09': {
      id: '2026-09',
      label: 'September 2026',
      setup: {
        shopName: 'Sharma General Store',
        ownerName: 'Rajesh Sharma',
        locality: 'Sector Alpha II, Greater Noida',
        shopType: 'kirana',
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        countDate: '2026-09-30',
        lastSavedAt: '2026-09-30T19:15:00',
      },
      items: buildItemsForMonth('2026-09'),
      bills: buildBillsForMonth('2026-09', SEPTEMBER_BILLS_SPEC, 1),
      previousActions: SEP_PREV_ACTIONS,
      actionOverrides: {},
      slowActionOverrides: {},
    },
    '2026-10': {
      id: '2026-10',
      label: 'October 2026',
      setup: {
        shopName: 'Sharma General Store',
        ownerName: 'Rajesh Sharma',
        locality: 'Sector Alpha II, Greater Noida',
        shopType: 'kirana',
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        countDate: '2026-10-31',
        lastSavedAt: '2026-10-31T19:15:00',
      },
      items: buildItemsForMonth('2026-10'),
      bills: buildBillsForMonth('2026-10', SEPTEMBER_BILLS_SPEC.slice(0, 52), 1.05),
      previousActions: OCT_PREV_ACTIONS,
      actionOverrides: {},
      slowActionOverrides: {},
    },
  };
}

export function createBlankDatasets(): Record<ReviewMonthId, MonthDataset> {
  const emptySetup = (start: string, end: string) => ({
    shopName: '',
    ownerName: '',
    locality: '',
    shopType: 'kirana' as const,
    periodStart: start,
    periodEnd: end,
    countDate: end,
    lastSavedAt: null,
  });

  return {
    '2026-08': {
      id: '2026-08',
      label: 'August 2026',
      setup: emptySetup('2026-08-01', '2026-08-31'),
      items: [],
      bills: [],
      previousActions: [],
      actionOverrides: {},
      slowActionOverrides: {},
    },
    '2026-09': {
      id: '2026-09',
      label: 'September 2026',
      setup: emptySetup('2026-09-01', '2026-09-30'),
      items: [],
      bills: [],
      previousActions: [],
      actionOverrides: {},
      slowActionOverrides: {},
    },
    '2026-10': {
      id: '2026-10',
      label: 'October 2026',
      setup: emptySetup('2026-10-01', '2026-10-31'),
      items: [],
      bills: [],
      previousActions: [],
      actionOverrides: {},
      slowActionOverrides: {},
    },
  };
}

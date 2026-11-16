import React from 'react';
import {
  Info,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  Store,
} from 'lucide-react';
import type { ShopSetup, ShopType } from '../types/inventory';
import type { DataCompletenessStats, ReconciliationSummary } from '../utils/calculations';
import { calculatePeriodDays, formatDate, formatPercent } from '../utils/formatters';

interface ShopSetupViewProps {
  setup: ShopSetup;
  dataMode: 'demo' | 'blank';
  onUpdateSetup: (patch: Partial<ShopSetup>) => void;
  completeness: DataCompletenessStats;
  reconciliation: ReconciliationSummary;
  onNavigateToSection: (section: 'stock-count' | 'bills' | 'items-margins') => void;
}

const SHOP_TYPES: { value: ShopType; label: string }[] = [
  { value: 'kirana', label: 'Kirana' },
  { value: 'general store', label: 'General store' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'other', label: 'Other' },
];

export function ShopSetupView({
  setup,
  dataMode,
  onUpdateSetup,
  completeness,
  reconciliation,
  onNavigateToSection,
}: ShopSetupViewProps) {
  const daysInPeriod = calculatePeriodDays(setup.periodStart, setup.periodEnd);
  const isDemoShop =
    dataMode === 'demo' ||
    setup.shopName.trim().toLowerCase() === 'sharma general store';

  const completenessRows = [
    {
      label: 'Items with a count entered',
      count: completeness.withCount,
      total: completeness.totalItems,
      actionLabel: 'Open Stock Count',
      target: 'stock-count' as const,
    },
    {
      label: 'Items with a cost price',
      count: completeness.withCostPrice,
      total: completeness.totalItems,
      actionLabel: 'Review Items',
      target: 'stock-count' as const,
    },
    {
      label: 'Items with a selling price',
      count: completeness.withSellingPrice,
      total: completeness.totalItems,
      actionLabel: 'Check Prices',
      target: 'items-margins' as const,
    },
    {
      label: 'Items with at least one bill in the period',
      count: completeness.withBillInPeriod,
      total: completeness.totalItems,
      actionLabel: 'Open Bills',
      target: 'bills' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Purpose & Honesty Notice */}
      <div
        role="note"
        className="bg-[#EEF4EE] border border-[#C6D8C8] rounded-xl p-4 sm:p-5 flex items-start gap-3"
      >
        <Info className="w-5 h-5 text-[#14532D] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1.5 text-[15px] text-[#1D3525]">
          <p className="font-semibold text-[#14532D]">
            Prototype for a Design Thinking and business assignment. Demo data only. Estimates are labelled.
          </p>
          <p className="text-sm text-[#344C3B] leading-relaxed">
            Where daily sales were not recorded, cost of goods sold is estimated from opening stock, purchase bills, and closing count. This tool advises on slow stock and margins only — it never recommends stopping all purchases and does not handle payments, lending, or credit decisions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Shop Details Form */}
        <section
          aria-labelledby="shop-details-heading"
          className="lg:col-span-7 bg-white border border-[#DFE4DC] rounded-xl p-5 sm:p-6 space-y-5"
        >
          <div className="border-b border-[#EDF1EB] pb-4 space-y-1">
            <div className="flex items-center gap-2.5">
              <Store className="w-5 h-5 text-[#14532D]" aria-hidden="true" />
              <h2 id="shop-details-heading" className="font-display text-xl font-semibold text-[#17211B]">
                Shop details & review period
              </h2>
            </div>
            {isDemoShop && (
              <p className="text-sm font-medium text-[#344C3B]">
                Sharma General Store (demo shop, fictional owner)
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="shop-name" className="block text-sm font-medium text-[#313D35] mb-1.5">
                Shop name
              </label>
              <input
                id="shop-name"
                type="text"
                value={setup.shopName}
                onChange={(e) => onUpdateSetup({ shopName: e.target.value })}
                placeholder="e.g. Sharma General Store"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] bg-white text-[15px] text-[#17211B] focus:outline-none focus:ring-2 focus:ring-[#14532D]"
              />
            </div>

            <div>
              <label htmlFor="owner-name" className="block text-sm font-medium text-[#313D35] mb-1.5">
                Owner name (optional)
              </label>
              <input
                id="owner-name"
                type="text"
                value={setup.ownerName}
                onChange={(e) => onUpdateSetup({ ownerName: e.target.value })}
                placeholder="e.g. Rajesh Sharma"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] bg-white text-[15px] text-[#17211B] focus:outline-none focus:ring-2 focus:ring-[#14532D]"
              />
            </div>

            <div>
              <label htmlFor="shop-type" className="block text-sm font-medium text-[#313D35] mb-1.5">
                Shop type
              </label>
              <select
                id="shop-type"
                value={setup.shopType}
                onChange={(e) => onUpdateSetup({ shopType: e.target.value as ShopType })}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] bg-white text-[15px] text-[#17211B] focus:outline-none focus:ring-2 focus:ring-[#14532D]"
              >
                {SHOP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="shop-locality" className="block text-sm font-medium text-[#313D35] mb-1.5">
                Locality
              </label>
              <input
                id="shop-locality"
                type="text"
                value={setup.locality}
                onChange={(e) => onUpdateSetup({ locality: e.target.value })}
                placeholder="e.g. Sector Alpha II, Greater Noida"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] bg-white text-[15px] text-[#17211B] focus:outline-none focus:ring-2 focus:ring-[#14532D]"
              />
            </div>

            <div>
              <label htmlFor="period-start" className="block text-sm font-medium text-[#313D35] mb-1.5">
                Review period start
              </label>
              <input
                id="period-start"
                type="date"
                value={setup.periodStart}
                onChange={(e) => onUpdateSetup({ periodStart: e.target.value })}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] bg-white text-[15px] text-[#17211B] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#14532D]"
              />
            </div>

            <div>
              <label htmlFor="period-end" className="block text-sm font-medium text-[#313D35] mb-1.5">
                Review period end
              </label>
              <input
                id="period-end"
                type="date"
                value={setup.periodEnd}
                onChange={(e) => onUpdateSetup({ periodEnd: e.target.value })}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] bg-white text-[15px] text-[#17211B] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#14532D]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#EDF1EB] flex flex-wrap items-center justify-between gap-3 text-sm text-[#425046]">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#14532D]" aria-hidden="true" />
              <span>
                Period: <strong className="text-[#17211B]">{formatDate(setup.periodStart)}</strong> to{' '}
                <strong className="text-[#17211B]">{formatDate(setup.periodEnd)}</strong>
              </span>
            </div>
            <div className="font-mono tabular-nums font-semibold text-[#14532D]">
              {daysInPeriod} days in period
            </div>
          </div>
        </section>

        {/* Right Column: Reconciliation Check + Data Completeness */}
        <div className="lg:col-span-5 space-y-6">
          {/* Reconciliation Check Card */}
          <section
            aria-labelledby="reconciliation-heading"
            className="bg-white border border-[#DFE4DC] rounded-xl p-5 sm:p-6 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="reconciliation-heading" className="font-display text-xl font-semibold text-[#17211B]">
                Reconciliation check
              </h2>
              {completeness.totalItems === 0 ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#526057]">
                  <AlertCircle className="w-4 h-4" aria-hidden="true" />
                  Needs checking
                </span>
              ) : reconciliation.allReconcile ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#15803D]">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  Ready for review
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B91C1C]">
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  Needs checking
                </span>
              )}
            </div>

            {completeness.totalItems === 0 ? (
              <p className="text-sm text-[#526057]">
                No items entered yet. Add stock counts and bills before reviewing.
              </p>
            ) : reconciliation.allReconcile ? (
              <p className="text-sm text-[#344C3B]">
                All {reconciliation.items.length} items reconcile within opening stock plus purchased bills.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[#991B1B]">
                  {reconciliation.unreconciledItems.length}{' '}
                  {reconciliation.unreconciledItems.length === 1 ? 'item does' : 'items do'} not reconcile:
                </p>
                <ul className="border border-[#FECACA] bg-[#FEF2F2] rounded-lg divide-y divide-[#FECACA] text-sm">
                  {reconciliation.unreconciledItems.map((u) => (
                    <li key={u.itemId} className="p-2.5 flex items-center justify-between gap-2">
                      <span className="font-medium text-[#7F1D1D]">{u.itemName}</span>
                      <span className="font-mono tabular-nums text-xs text-[#991B1B]">
                        Closing {u.actualClosing} vs max {u.openingCount + u.purchasedUnits}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => onNavigateToSection('stock-count')}
                  className="min-h-[44px] px-4 py-2 rounded-lg border border-[#B91C1C] text-sm font-medium text-[#B91C1C] hover:bg-[#FEF2F2]"
                >
                  Fix counts in Stock Count
                </button>
              </div>
            )}
          </section>

          {/* Data Completeness Card */}
          <section
            aria-labelledby="data-completeness-heading"
            className="bg-white border border-[#DFE4DC] rounded-xl p-5 sm:p-6 space-y-4"
          >
            <div className="border-b border-[#EDF1EB] pb-4">
              <h2 id="data-completeness-heading" className="font-display text-xl font-semibold text-[#17211B]">
                Data completeness
              </h2>
              <p className="text-sm text-[#526057] mt-1">
                Tracks how much shop information has been entered for this month. This is a data checklist, not a score of the business.
              </p>
            </div>

            {completeness.totalItems === 0 ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-[15px] text-[#526057]">
                  No stock items entered for this shop yet.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateToSection('stock-count')}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-[#14532D] text-white text-[15px] font-medium hover:bg-[#166534]"
                >
                  Add first stock item
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {completenessRows.map((row) => {
                  const pct = row.total > 0 ? (row.count / row.total) * 100 : 0;
                  const isComplete = row.count === row.total && row.total > 0;
                  return (
                    <div key={row.label} className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2 text-[15px]">
                        <div className="flex items-start gap-2 min-w-0">
                          {isComplete ? (
                            <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0 mt-1" aria-hidden="true" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-1" aria-hidden="true" />
                          )}
                          <span className="text-[#17211B] leading-snug">{row.label}</span>
                        </div>
                        <span className="font-mono tabular-nums font-semibold text-[#17211B] whitespace-nowrap shrink-0">
                          {row.count} / {row.total} ({formatPercent(pct)})
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#EDF1EB] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isComplete ? 'bg-[#15803D]' : 'bg-[#B45309]'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => onNavigateToSection(row.target)}
                          className="text-xs font-medium text-[#14532D] hover:underline py-1"
                        >
                          {row.actionLabel}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

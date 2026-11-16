import React from 'react';
import { Calculator, CheckCircle2, Info, X } from 'lucide-react';
import type { ItemMetrics, StockItem } from '../types/inventory';
import { formatPercent, formatRatio, formatRs } from '../utils/formatters';

interface ItemDetailModalProps {
  metrics: ItemMetrics | null;
  daysInPeriod: number;
  onClose: () => void;
  onUpdateItem: (itemId: string, patch: Partial<StockItem>) => void;
}

const QUADRANT_NAMES: Record<ItemMetrics['quadrant'], string> = {
  'keep-and-grow': 'Keep and grow (High margin, fast)',
  'check-price-or-order': 'Check the price or the order size (High margin, slow)',
  'reprice-or-sell-faster': 'Reprice or sell faster (Low margin, fast)',
  'clear-or-stop': 'Clear or stop reordering (Low margin, slow)',
};

export function ItemDetailModal({
  metrics,
  daysInPeriod,
  onClose,
  onUpdateItem,
}: ItemDetailModalProps) {
  if (!metrics) return null;
  const { item } = metrics;
  const dailyCogs = daysInPeriod > 0 ? metrics.cogsValue / daysInPeriod : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-detail-title"
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#DFE4DC] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#EDF1EB] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#526057]">
              <Calculator className="w-3.5 h-3.5 text-[#14532D]" aria-hidden="true" />
              <span className="capitalize">{item.category}</span>
              <span aria-hidden="true">·</span>
              <span>{item.packSize}</span>
              <span aria-hidden="true">·</span>
              <span>{metrics.isEstimated ? 'Estimated sales' : 'Recorded sales'}</span>
            </div>
            <h2 id="item-detail-title" className="font-display text-xl font-bold text-[#17211B] mt-1">
              {item.name}
            </h2>
            <p className="text-sm text-[#425046] mt-0.5">{QUADRANT_NAMES[metrics.quadrant]}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close item detail"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-[#DFE4DC] text-[#313D35] hover:bg-[#F3F6F1]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Editable Selling Price & Optional Recorded Sales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAFBF9] border border-[#E5EAE2] rounded-xl p-4">
          <div>
            <label htmlFor="detail-selling-price" className="block text-xs font-semibold text-[#313D35] mb-1">
              MRP or shelf price (Rs / unit)
            </label>
            <input
              id="detail-selling-price"
              type="number"
              min="0"
              step="0.5"
              value={item.sellingPrice ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : Number(e.target.value);
                onUpdateItem(item.id, {
                  sellingPrice: val !== null && Number.isFinite(val) ? Math.max(0, val) : null,
                });
              }}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] bg-white font-mono tabular-nums text-[15px]"
            />
          </div>

          <div>
            <label htmlFor="detail-recorded-sales" className="block text-xs font-semibold text-[#313D35] mb-1">
              Owner-recorded sales units (leave blank to estimate)
            </label>
            <input
              id="detail-recorded-sales"
              type="number"
              min="0"
              value={item.recordedSalesUnits ?? ''}
              placeholder="Blank = Estimated from stock"
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (raw === '') {
                  onUpdateItem(item.id, { recordedSalesUnits: null });
                  return;
                }
                const val = Number(raw);
                if (Number.isFinite(val) && val >= 0) {
                  onUpdateItem(item.id, { recordedSalesUnits: val });
                }
              }}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] bg-white font-mono tabular-nums text-[15px]"
            />
          </div>
        </div>

        {/* Step-by-step viva calculation breakdown */}
        <div className="space-y-3">
          <h3 className="font-display text-base font-semibold text-[#17211B]">
            Step-by-step calculation breakdown
          </h3>

          <div className="border border-[#DFE4DC] rounded-xl divide-y divide-[#EDF1EB] text-sm">
            <div className="p-3.5 flex flex-wrap justify-between gap-2">
              <div>
                <div className="font-medium text-[#17211B]">1. Opening stock value</div>
                <div className="text-xs text-[#526057]">
                  {item.openingCount} units × {formatRs(item.costPrice, item.costPrice % 1 !== 0)} baseline cost
                </div>
              </div>
              <div className="font-mono tabular-nums font-semibold text-[#17211B]">
                {formatRs(metrics.openingValue)}
              </div>
            </div>

            <div className="p-3.5 flex flex-wrap justify-between gap-2">
              <div>
                <div className="font-medium text-[#17211B]">2. Purchases in period</div>
                <div className="text-xs text-[#526057]">
                  {metrics.purchasesUnits} units across period bills (avg cost{' '}
                  {formatRs(metrics.effectiveCostPrice, metrics.effectiveCostPrice % 1 !== 0)})
                </div>
              </div>
              <div className="font-mono tabular-nums font-semibold text-[#17211B]">
                {formatRs(metrics.purchasesValue)}
              </div>
            </div>

            <div className="p-3.5 flex flex-wrap justify-between gap-2">
              <div>
                <div className="font-medium text-[#17211B]">3. Closing stock value</div>
                <div className="text-xs text-[#526057]">
                  {item.closingCount ?? 0} counted units ×{' '}
                  {formatRs(metrics.effectiveCostPrice, metrics.effectiveCostPrice % 1 !== 0)}
                </div>
              </div>
              <div className="font-mono tabular-nums font-semibold text-[#17211B]">
                {formatRs(metrics.closingValue)}
              </div>
            </div>

            <div className="p-3.5 flex flex-wrap justify-between gap-2 bg-[#FAFBF9]">
              <div>
                <div className="font-semibold text-[#17211B] flex items-center gap-1.5">
                  <span>4. Cost of goods sold (COGS)</span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#14532D]">
                    {metrics.isEstimated ? (
                      <>
                        <Info className="w-3.5 h-3.5" aria-hidden="true" />
                        Estimated
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Recorded
                      </>
                    )}
                  </span>
                </div>
                <div className="text-xs text-[#526057]">
                  {metrics.isEstimated
                    ? `Opening (${formatRs(metrics.openingValue)}) + Purchases (${formatRs(metrics.purchasesValue)}) − Closing (${formatRs(metrics.closingValue)}) → ${metrics.salesUnits} units`
                    : `${metrics.salesUnits} recorded units × ${formatRs(metrics.effectiveCostPrice, true)}`}
                </div>
              </div>
              <div className="font-mono tabular-nums font-bold text-[#17211B]">
                {formatRs(metrics.cogsValue)}
              </div>
            </div>

            <div className="p-3.5 flex flex-wrap justify-between gap-2">
              <div>
                <div className="font-medium text-[#17211B]">5. Gross margin %</div>
                <div className="text-xs text-[#526057]">
                  ({formatRs(item.sellingPrice ?? 0, true)} −{' '}
                  {formatRs(metrics.effectiveCostPrice, true)}) ÷{' '}
                  {formatRs(item.sellingPrice ?? 0, true)}
                </div>
              </div>
              <div className="font-mono tabular-nums font-semibold text-[#15803D]">
                {formatPercent(metrics.grossMarginPct)}
              </div>
            </div>

            <div className="p-3.5 flex flex-wrap justify-between gap-2">
              <div>
                <div className="font-medium text-[#17211B]">
                  6. Gross margin earned ({metrics.isEstimated ? 'Estimated' : 'Recorded'})
                </div>
                <div className="text-xs text-[#526057]">
                  {metrics.salesUnits} sales units ×{' '}
                  {formatRs(metrics.grossMarginPerUnit, metrics.grossMarginPerUnit % 1 !== 0)} margin per unit
                </div>
              </div>
              <div className="font-mono tabular-nums font-semibold text-[#15803D]">
                {formatRs(metrics.grossMarginEarned)}
              </div>
            </div>

            <div className="p-3.5 flex flex-wrap justify-between gap-2">
              <div>
                <div className="font-medium text-[#17211B]">7. Average stock value</div>
                <div className="text-xs text-[#526057]">
                  (Opening {formatRs(metrics.openingValue)} + Closing {formatRs(metrics.closingValue)}) ÷ 2
                </div>
              </div>
              <div className="font-mono tabular-nums font-semibold text-[#17211B]">
                {formatRs(metrics.averageStockValue)}
              </div>
            </div>

            <div className="p-3.5 flex flex-wrap justify-between gap-2">
              <div>
                <div className="font-medium text-[#17211B]">8. Days of stock on hand</div>
                <div className="text-xs text-[#526057]">
                  {metrics.daysOfStockOnHand === null
                    ? 'COGS is zero in this period, so days on hand shows "No movement".'
                    : `Closing ${formatRs(metrics.closingValue)} ÷ (${formatRs(metrics.cogsValue)} ÷ ${daysInPeriod} days = ${formatRs(dailyCogs)}/day)`}
                </div>
              </div>
              <div className="font-mono tabular-nums font-semibold text-[#17211B]">
                {metrics.daysOfStockOnHand === null
                  ? 'No movement'
                  : `${metrics.daysOfStockOnHand.toFixed(1)} days`}
              </div>
            </div>

            <div className="p-3.5 flex flex-wrap justify-between gap-2 bg-[#EEF4EE]">
              <div>
                <div className="font-semibold text-[#14532D]">9. Stock return (GMROI)</div>
                <div className="text-xs text-[#344C3B]">
                  Margin earned ({formatRs(metrics.grossMarginEarned)}) ÷ Avg stock ({formatRs(metrics.averageStockValue)})
                  {metrics.gmroi !== null &&
                    ` → Rs ${metrics.gmroi.toFixed(2)} margin per Rs 1 invested in stock`}
                </div>
              </div>
              <div className="font-mono tabular-nums text-base font-bold text-[#14532D]">
                {formatRatio(metrics.gmroi)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

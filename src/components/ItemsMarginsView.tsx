import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Info } from 'lucide-react';
import type { ItemMetrics, StockItem } from '../types/inventory';
import { formatPercent, formatRatio, formatRs } from '../utils/formatters';
import { QuadrantChart } from './QuadrantChart';
import { ItemDetailModal } from './ItemDetailModal';

interface ItemsMarginsViewProps {
  metricsList: ItemMetrics[];
  daysInPeriod: number;
  slowThresholdDays: number;
  onUpdateItem: (itemId: string, patch: Partial<StockItem>) => void;
}

type SortKey =
  | 'name'
  | 'sellingPrice'
  | 'effectiveCostPrice'
  | 'salesUnits'
  | 'cogsValue'
  | 'grossMarginPct'
  | 'grossMarginEarned'
  | 'averageStockValue'
  | 'daysOfStockOnHand'
  | 'gmroi';

export function ItemsMarginsView({
  metricsList,
  daysInPeriod,
  slowThresholdDays,
  onUpdateItem,
}: ItemsMarginsViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>('gmroi');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [quadrantFilter, setQuadrantFilter] = useState<string>('all');

  const selectedMetrics = useMemo(
    () => metricsList.find((m) => m.item.id === selectedItemId) ?? null,
    [metricsList, selectedItemId]
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const sortedMetrics = useMemo(() => {
    const filtered =
      quadrantFilter === 'all'
        ? metricsList
        : metricsList.filter((m) => m.quadrant === quadrantFilter);

    return [...filtered].sort((a, b) => {
      if (sortKey === 'name') {
        return sortDir === 'asc'
          ? a.item.name.localeCompare(b.item.name)
          : b.item.name.localeCompare(a.item.name);
      }

      const getVal = (m: ItemMetrics): number => {
        switch (sortKey) {
          case 'sellingPrice':
            return m.item.sellingPrice ?? -1;
          case 'effectiveCostPrice':
            return m.effectiveCostPrice;
          case 'salesUnits':
            return m.salesUnits;
          case 'cogsValue':
            return m.cogsValue;
          case 'grossMarginPct':
            return m.grossMarginPct;
          case 'grossMarginEarned':
            return m.grossMarginEarned;
          case 'averageStockValue':
            return m.averageStockValue;
          case 'daysOfStockOnHand':
            return m.daysOfStockOnHand ?? Number.POSITIVE_INFINITY;
          case 'gmroi':
          default:
            return m.gmroi ?? -Infinity;
        }
      };

      const diff = getVal(a) - getVal(b);
      return sortDir === 'asc' ? diff : -diff;
    });
  }, [metricsList, quadrantFilter, sortKey, sortDir]);

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === 'desc' ? (
      <ArrowDown className="w-3.5 h-3.5 inline ml-1" aria-hidden="true" />
    ) : (
      <ArrowUp className="w-3.5 h-3.5 inline ml-1" aria-hidden="true" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Estimation Clarity Note */}
      <div className="bg-white border border-[#DFE4DC] rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#17211B]">
            Items & margins ranking ({daysInPeriod}-day period)
          </h2>
          <p className="text-sm text-[#526057]">
            Ranked by Stock Return (GMROI) highest first. Example: 2.40 means Rs 2.40 margin earned per Rs 1 invested in stock.
          </p>
        </div>

        <select
          aria-label="Filter by quadrant"
          value={quadrantFilter}
          onChange={(e) => setQuadrantFilter(e.target.value)}
          className="min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] bg-white text-[15px]"
        >
          <option value="all">All quadrants</option>
          <option value="keep-and-grow">Keep and grow</option>
          <option value="check-price-or-order">Check the price or the order size</option>
          <option value="reprice-or-sell-faster">Reprice or sell faster</option>
          <option value="clear-or-stop">Clear or stop reordering</option>
        </select>
      </div>

      {/* Four-Quadrant Chart */}
      {metricsList.length > 0 && (
        <QuadrantChart
          metricsList={metricsList}
          slowThresholdDays={slowThresholdDays}
          selectedItemId={selectedItemId}
          onSelectItem={(m) => setSelectedItemId(m.item.id)}
        />
      )}

      {/* Sortable Ranking Table */}
      {sortedMetrics.length === 0 ? (
        <div className="bg-white border border-[#DFE4DC] rounded-xl p-8 text-center text-[15px] text-[#526057]">
          No items available to rank. Add items in Stock Count or load Demo data in Settings.
        </div>
      ) : (
        <div className="bg-white border border-[#DFE4DC] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1060px]">
              <thead>
                <tr className="bg-[#F3F6F1] border-b border-[#DFE4DC] text-xs font-semibold text-[#425046]">
                  <th className="py-3 px-4">
                    <button type="button" onClick={() => handleSort('name')} className="hover:text-[#14532D]">
                      Item {renderSortIcon('name')}
                    </button>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <button type="button" onClick={() => handleSort('effectiveCostPrice')} className="hover:text-[#14532D]">
                      Cost {renderSortIcon('effectiveCostPrice')}
                    </button>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <button type="button" onClick={() => handleSort('sellingPrice')} className="hover:text-[#14532D]">
                      MRP / shelf price {renderSortIcon('sellingPrice')}
                    </button>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <button type="button" onClick={() => handleSort('salesUnits')} className="hover:text-[#14532D]">
                      Sales units {renderSortIcon('salesUnits')}
                    </button>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <button type="button" onClick={() => handleSort('cogsValue')} className="hover:text-[#14532D]">
                      COGS {renderSortIcon('cogsValue')}
                    </button>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <button type="button" onClick={() => handleSort('grossMarginPct')} className="hover:text-[#14532D]">
                      Margin % {renderSortIcon('grossMarginPct')}
                    </button>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <button type="button" onClick={() => handleSort('grossMarginEarned')} className="hover:text-[#14532D]">
                      Margin earned {renderSortIcon('grossMarginEarned')}
                    </button>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <button type="button" onClick={() => handleSort('averageStockValue')} className="hover:text-[#14532D]">
                      Avg stock {renderSortIcon('averageStockValue')}
                    </button>
                  </th>
                  <th className="py-3 px-3 text-right">
                    <button type="button" onClick={() => handleSort('daysOfStockOnHand')} className="hover:text-[#14532D]">
                      Days on hand {renderSortIcon('daysOfStockOnHand')}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <button type="button" onClick={() => handleSort('gmroi')} className="hover:text-[#14532D]">
                      Stock return (GMROI) {renderSortIcon('gmroi')}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF1EB] text-[15px]">
                {sortedMetrics.map((m) => {
                  const isGoodMargin = m.grossMarginPct >= 15;
                  return (
                    <tr key={m.item.id} className="hover:bg-[#FAFBF9]">
                      <td className="py-2.5 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedItemId(m.item.id)}
                          className="text-left font-medium text-[#14532D] hover:underline focus-visible:outline-2 focus-visible:outline-[#14532D]"
                        >
                          {m.item.name}
                        </button>
                        <div className="text-xs text-[#526057] flex items-center gap-1.5 mt-0.5">
                          <span className="capitalize">{m.item.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{m.item.packSize}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-sm">
                        {formatRs(m.effectiveCostPrice, m.effectiveCostPrice % 1 !== 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          aria-label={`MRP or shelf price for ${m.item.name}`}
                          value={m.item.sellingPrice ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            onUpdateItem(m.item.id, {
                              sellingPrice: val !== null && Number.isFinite(val) ? Math.max(0, val) : null,
                            });
                          }}
                          className="w-20 min-h-[44px] px-2 py-1 rounded-md border border-[#CFD7CC] text-right font-mono tabular-nums bg-white"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <div>{m.salesUnits}</div>
                        <div className="text-[11px] font-sans text-[#526057] inline-flex items-center gap-1">
                          {m.isEstimated ? (
                            <>
                              <Info className="w-3 h-3 text-[#B45309]" aria-hidden="true" />
                              <span>Estimated</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-[#15803D]" aria-hidden="true" />
                              <span>Recorded</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <div>{formatRs(m.cogsValue)}</div>
                        <div className="text-[11px] font-sans text-[#526057]">
                          {m.isEstimated ? 'Estimated' : 'Recorded'}
                        </div>
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono tabular-nums font-semibold ${
                          isGoodMargin ? 'text-[#15803D]' : 'text-[#425046]'
                        }`}
                      >
                        {formatPercent(m.grossMarginPct)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium">
                        <div>{formatRs(m.grossMarginEarned)}</div>
                        <div className="text-[11px] font-sans font-normal text-[#526057]">
                          {m.isEstimated ? 'Estimated' : 'Recorded'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-sm">
                        {formatRs(m.averageStockValue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {m.daysOfStockOnHand === null ? (
                          <span className="font-sans text-xs font-semibold text-[#B91C1C]">
                            No movement
                          </span>
                        ) : (
                          <span>{m.daysOfStockOnHand.toFixed(1)} d</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-[#14532D]">
                        {formatRatio(m.gmroi)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Detail Step-by-Step Breakdown Modal */}
      <ItemDetailModal
        metrics={selectedMetrics}
        daysInPeriod={daysInPeriod}
        onClose={() => setSelectedItemId(null)}
        onUpdateItem={onUpdateItem}
      />
    </div>
  );
}

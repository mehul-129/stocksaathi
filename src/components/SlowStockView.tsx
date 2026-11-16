import React from 'react';
import { AlertCircle, AlertTriangle, Clock, Info } from 'lucide-react';
import type { AppSettings, SlowStockSummary } from '../types/inventory';
import { formatPercent, formatRs } from '../utils/formatters';
import { STAPLE_SLOW_ACTION } from '../utils/slowStockRules';

interface SlowStockViewProps {
  slowSummary: SlowStockSummary;
  settings: AppSettings;
  onChangeSlowAction: (itemId: string, actionText: string) => void;
}

const STAPLE_ACTION_OPTIONS = [
  STAPLE_SLOW_ACTION,
  'Discount or sell this week',
  'Reduce next order; check if shelf position is poor',
];

const NON_STAPLE_ACTION_OPTIONS = [
  'Discount or sell this week',
  'Reduce next order; check if shelf position is poor',
  'Stop reordering or clear with a bundle',
  'Return to distributor if the terms allow, or stop buying',
];

export function SlowStockView({
  slowSummary,
  settings,
  onChangeSlowAction,
}: SlowStockViewProps) {
  return (
    <div className="space-y-6">
      {/* Three Top Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#DFE4DC] rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-[#92400E]">
            <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Cash tied up (not profit lost) — slow stock</span>
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-[#B45309]">
            {formatRs(slowSummary.cashTiedInSlow)}
          </div>
          <p className="text-xs text-[#526057] mt-1">
            Items above {settings.slowThresholdDays} days and up to {settings.deadThresholdDays} days on hand
          </p>
        </div>

        <div className="bg-white border border-[#DFE4DC] rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-[#991B1B]">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Cash tied up (not profit lost) — dead stock</span>
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-[#B91C1C]">
            {formatRs(slowSummary.cashTiedInDead)}
          </div>
          <p className="text-xs text-[#526057] mt-1">
            No movement in period or above {settings.deadThresholdDays} days on hand
          </p>
        </div>

        <div className="bg-white border border-[#DFE4DC] rounded-xl p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-[#313D35]">
            <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" aria-hidden="true" />
            <span>Share of total stock that is slow</span>
          </div>
          <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-[#17211B]">
            {formatPercent(slowSummary.slowAndDeadSharePct)}
          </div>
          <p className="text-xs text-[#526057] mt-1">
            Out of {formatRs(slowSummary.totalClosingStockValue)} total closing stock value
          </p>
        </div>
      </div>

      {/* Advisory Disclaimer Note */}
      <div
        role="note"
        className="bg-[#FFFBEB] border border-[#FCD34D] rounded-xl p-4 flex items-start gap-3 text-sm text-[#78350F]"
      >
        <Info className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-semibold">
            Advice based on purchase bills and one stock count. Check with the shopkeeper before acting.
          </p>
          <p className="text-xs mt-1 text-[#92400E]">
            Everyday staples (atta, rice, dal, sugar, cooking oil, salt, milk, tea, bread) never receive a &ldquo;Stop reordering&rdquo; recommendation.
          </p>
        </div>
      </div>

      {/* Slow & Dead Stock Table */}
      {slowSummary.entries.length === 0 ? (
        <div className="bg-white border border-[#DFE4DC] rounded-xl p-8 text-center text-[15px] text-[#526057]">
          No slow, dead, or near-expiry items flagged under current thresholds.
        </div>
      ) : (
        <div className="bg-white border border-[#DFE4DC] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1060px]">
              <thead>
                <tr className="bg-[#F3F6F1] border-b border-[#DFE4DC] text-xs font-semibold text-[#425046]">
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Cash tied up (not profit lost)</th>
                  <th className="py-3 px-3 text-right">Days on hand</th>
                  <th className="py-3 px-3 text-right">Margin %</th>
                  <th className="py-3 px-3">Expiry check</th>
                  <th className="py-3 px-4 min-w-[430px]">Suggested action & reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF1EB] text-[15px]">
                {slowSummary.entries.map((entry) => {
                  const { metrics, severity, isNearExpiry, isStaple, reason } = entry;
                  const currentAction = entry.customAction ?? entry.suggestedAction;
                  const options = isStaple ? STAPLE_ACTION_OPTIONS : NON_STAPLE_ACTION_OPTIONS;

                  return (
                    <tr key={metrics.item.id} className="hover:bg-[#FAFBF9] align-top">
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#17211B]">{metrics.item.name}</div>
                        <div className="text-xs text-[#526057]">
                          {metrics.item.closingCount ?? 0} units on shelf ·{' '}
                          {isStaple ? 'Everyday staple' : 'Non-staple'} ·{' '}
                          {metrics.isEstimated ? 'Estimated' : 'Recorded'}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {severity === 'dead' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C]">
                            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                            Dead stock
                          </span>
                        ) : severity === 'slow' ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B45309]">
                            <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
                            Slow stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C]">
                            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                            Near expiry
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold">
                        {formatRs(entry.cashTiedUp)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        {metrics.daysOfStockOnHand === null ? (
                          <span className="font-sans text-xs font-semibold text-[#B91C1C]">
                            No movement
                          </span>
                        ) : (
                          `${metrics.daysOfStockOnHand.toFixed(1)} d`
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {formatPercent(metrics.grossMarginPct)}
                      </td>
                      <td className="py-3 px-3 text-sm whitespace-nowrap">
                        {metrics.item.perishable ? (
                          isNearExpiry ? (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#B91C1C]">
                              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                              Expires in {metrics.item.daysToExpiry}d
                            </span>
                          ) : (
                            <span className="text-[#425046]">
                              {metrics.item.daysToExpiry}d left
                            </span>
                          )
                        ) : (
                          <span className="text-[#7A877E]">Non-perishable</span>
                        )}
                      </td>
                      <td className="py-3 px-4 space-y-1.5">
                        <select
                          aria-label={`Suggested action for ${metrics.item.name}`}
                          value={options.includes(currentAction) ? currentAction : options[0]}
                          onChange={(e) => onChangeSlowAction(metrics.item.id, e.target.value)}
                          className="w-full min-h-[44px] px-3 py-2 rounded-md border border-[#CFD7CC] bg-white text-[13px] text-[#17211B]"
                        >
                          {options.map((preset) => (
                            <option key={preset} value={preset}>
                              {preset}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-[#425046] leading-relaxed">
                          Reason: {reason}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

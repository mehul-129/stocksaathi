import React from 'react';
import type { ItemMetrics, QuadrantId } from '../types/inventory';
import { HIGH_MARGIN_THRESHOLD_PCT } from '../utils/calculations';
import { formatPercent, formatRatio } from '../utils/formatters';

interface QuadrantChartProps {
  metricsList: ItemMetrics[];
  slowThresholdDays: number;
  selectedItemId: string | null;
  onSelectItem: (metrics: ItemMetrics) => void;
}

const QUADRANT_COLORS: Record<QuadrantId, string> = {
  'keep-and-grow': '#15803D',
  'check-price-or-order': '#B45309',
  'reprice-or-sell-faster': '#0F766E',
  'clear-or-stop': '#B91C1C',
};

export function QuadrantChart({
  metricsList,
  slowThresholdDays,
  selectedItemId,
  onSelectItem,
}: QuadrantChartProps) {
  const width = 760;
  const height = 400;
  const padLeft = 64;
  const padRight = 28;
  const padTop = 30;
  const padBottom = 54;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxX = Math.max(90, slowThresholdDays * 2.5);
  const maxY = 40;

  const xScale = (days: number | null) => {
    const clamped = days === null ? maxX * 0.92 : Math.min(maxX * 0.92, Math.max(0, days));
    return padLeft + (clamped / maxX) * plotW;
  };

  const yScale = (marginPct: number) => {
    const clamped = Math.min(maxY, Math.max(0, marginPct));
    return padTop + plotH - (clamped / maxY) * plotH;
  };

  const splitX = xScale(slowThresholdDays);
  const splitY = yScale(HIGH_MARGIN_THRESHOLD_PCT);

  return (
    <div className="bg-white border border-[#DFE4DC] rounded-xl p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-[#17211B]">
            Margin vs stock speed (four-quadrant chart)
          </h3>
          <p className="text-sm text-[#526057]">
            Click any dot to open the step-by-step calculation for that item. Items with no movement sit at the far right.
          </p>
        </div>
        <div className="text-xs text-[#526057] font-mono tabular-nums">
          Splits: {slowThresholdDays} days · {HIGH_MARGIN_THRESHOLD_PCT}% margin
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Four-quadrant scatter plot of gross margin percentage versus days of stock on hand"
          className="w-full min-w-[540px] h-auto select-none"
        >
          {/* Quadrant Backgrounds */}
          {/* Top-Left: Keep and grow (high margin, fast) */}
          <rect
            x={padLeft}
            y={padTop}
            width={splitX - padLeft}
            height={splitY - padTop}
            fill="#F0FDF4"
          />
          {/* Top-Right: Check the price or the order size (high margin, slow) */}
          <rect
            x={splitX}
            y={padTop}
            width={padLeft + plotW - splitX}
            height={splitY - padTop}
            fill="#FFFBEB"
          />
          {/* Bottom-Left: Reprice or sell faster (low margin, fast) */}
          <rect
            x={padLeft}
            y={splitY}
            width={splitX - padLeft}
            height={padTop + plotH - splitY}
            fill="#F8FAFC"
          />
          {/* Bottom-Right: Clear or stop reordering (low margin, slow) */}
          <rect
            x={splitX}
            y={splitY}
            width={padLeft + plotW - splitX}
            height={padTop + plotH - splitY}
            fill="#FEF2F2"
          />

          {/* Outer border */}
          <rect
            x={padLeft}
            y={padTop}
            width={plotW}
            height={plotH}
            fill="none"
            stroke="#CBD5C8"
            strokeWidth={1}
          />

          {/* Threshold Split Lines */}
          <line
            x1={splitX}
            y1={padTop}
            x2={splitX}
            y2={padTop + plotH}
            stroke="#64748B"
            strokeDasharray="5 4"
            strokeWidth={1.2}
          />
          <line
            x1={padLeft}
            y1={splitY}
            x2={padLeft + plotW}
            y2={splitY}
            stroke="#64748B"
            strokeDasharray="5 4"
            strokeWidth={1.2}
          />

          {/* Quadrant Labels */}
          <text x={padLeft + 10} y={padTop + 18} fontSize={12} fontWeight={600} fill="#166534">
            Keep and grow
          </text>
          <text x={splitX + 10} y={padTop + 18} fontSize={12} fontWeight={600} fill="#92400E">
            Check the price or the order size
          </text>
          <text x={padLeft + 10} y={padTop + plotH - 10} fontSize={12} fontWeight={600} fill="#334155">
            Reprice or sell faster
          </text>
          <text x={splitX + 10} y={padTop + plotH - 10} fontSize={12} fontWeight={600} fill="#991B1B">
            Clear or stop reordering
          </text>

          {/* Y-axis ticks */}
          {[0, 10, 20, 30, 40].map((val) => {
            const y = yScale(val);
            return (
              <g key={`y-${val}`}>
                <line x1={padLeft - 5} y1={y} x2={padLeft} y2={y} stroke="#64748B" />
                <text
                  x={padLeft - 9}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill="#475569"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* X-axis ticks */}
          {[0, Math.round(slowThresholdDays), Math.round(maxX * 0.65), maxX].map((val, idx) => {
            const x = xScale(val);
            return (
              <g key={`x-${val}-${idx}`}>
                <line x1={x} y1={padTop + plotH} x2={x} y2={padTop + plotH + 5} stroke="#64748B" />
                <text
                  x={x}
                  y={padTop + plotH + 20}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#475569"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {val === maxX ? `${maxX}d+` : `${val}d`}
                </text>
              </g>
            );
          })}

          {/* Axis Titles */}
          <text
            x={padLeft + plotW / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize={12}
            fontWeight={600}
            fill="#1E293B"
          >
            Days of stock on hand (faster on left, slower on right)
          </text>
          <text
            x={18}
            y={padTop + plotH / 2}
            textAnchor="middle"
            fontSize={12}
            fontWeight={600}
            fill="#1E293B"
            transform={`rotate(-90 18 ${padTop + plotH / 2})`}
          >
            Gross margin %
          </text>

          {/* Data Points */}
          {metricsList.map((m) => {
            const cx = xScale(m.daysOfStockOnHand);
            const cy = yScale(m.grossMarginPct);
            const isSelected = selectedItemId === m.item.id;
            const color = QUADRANT_COLORS[m.quadrant];
            const daysText =
              m.daysOfStockOnHand === null ? 'No movement' : `${m.daysOfStockOnHand.toFixed(1)} days`;

            return (
              <g
                key={m.item.id}
                role="button"
                tabIndex={0}
                aria-label={`${m.item.name}: ${formatPercent(m.grossMarginPct)} margin, ${daysText}, GMROI ${formatRatio(m.gmroi)}`}
                onClick={() => onSelectItem(m)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectItem(m);
                  }
                }}
                className="cursor-pointer focus:outline-none"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 8 : 5.5}
                  fill={color}
                  fillOpacity={isSelected ? 1 : 0.85}
                  stroke={isSelected ? '#17211B' : '#FFFFFF'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                <title>
                  {`${m.item.name}\nMargin: ${formatPercent(m.grossMarginPct)} | Days on hand: ${daysText} | Stock return: ${formatRatio(m.gmroi)}`}
                </title>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs text-[#313D35]">
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#15803D] inline-block" aria-hidden="true" />
          Keep and grow
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#B45309] inline-block" aria-hidden="true" />
          Check the price or the order size
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#0F766E] inline-block" aria-hidden="true" />
          Reprice or sell faster
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#B91C1C] inline-block" aria-hidden="true" />
          Clear or stop reordering
        </span>
      </div>
    </div>
  );
}

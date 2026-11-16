/**
 * ============================================================================
 * SLOW-STOCK RULES SECTION
 * Plain JavaScript rules to classify slow/dead stock, quantify cash tied up,
 * protect everyday staples from "Stop reordering", and provide a clear reason.
 * ============================================================================
 */

import type {
  AppSettings,
  ItemMetrics,
  SlowStockEntry,
  SlowStockSeverity,
  SlowStockSummary,
  StockItem,
} from '../types/inventory';
import { HIGH_MARGIN_THRESHOLD_PCT } from './calculations';

export type { SlowStockSummary };

const STAPLE_KEYWORDS = [
  'atta',
  'rice',
  'dal',
  'sugar',
  'oil',
  'salt',
  'milk',
  'tea',
  'bread',
];

export const STAPLE_SLOW_ACTION = 'Trim the next order and keep one unit on shelf';
export const STAPLE_SLOW_REASON =
  'Everyday item. Keep it available for regular customers.';

/**
 * Identifies everyday staples (atta, rice, dal, sugar, cooking oil, salt, milk, tea, bread).
 * Staples must never be given "Stop reordering".
 */
export function isEverydayStaple(item: Pick<StockItem, 'name'>): boolean {
  const lower = item.name.toLowerCase();
  return STAPLE_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Classifies an item as normal, slow, or dead based on Days on Hand and thresholds.
 * - Dead: No movement (daysOfStockOnHand === null and closingValue > 0) OR days > deadThresholdDays
 * - Slow: days > slowThresholdDays and <= deadThresholdDays
 */
export function classifySlowStockSeverity(
  metrics: ItemMetrics,
  settings: Pick<AppSettings, 'slowThresholdDays' | 'deadThresholdDays'>
): SlowStockSeverity {
  if (metrics.closingValue <= 0) return 'normal';
  if (metrics.daysOfStockOnHand === null) return 'dead';
  if (metrics.daysOfStockOnHand > settings.deadThresholdDays) return 'dead';
  if (metrics.daysOfStockOnHand > settings.slowThresholdDays) return 'slow';
  return 'normal';
}

/**
 * Returns the default rule-based suggested action and plain-English reason.
 */
export function getDefaultSlowStockActionAndReason(
  metrics: ItemMetrics,
  isNearExpiry: boolean,
  isStaple: boolean
): { action: string; reason: string } {
  if (isNearExpiry && !isStaple) {
    return {
      action: 'Discount or sell this week',
      reason: `Perishable stock expires in ${metrics.item.daysToExpiry ?? 0}d. Clear shelf units quickly.`,
    };
  }

  if (isNearExpiry && isStaple) {
    return {
      action: 'Discount or sell this week',
      reason: `Everyday staple nearing expiry (${metrics.item.daysToExpiry ?? 0}d left). Clear current batch first.`,
    };
  }

  if (isStaple) {
    return {
      action: STAPLE_SLOW_ACTION,
      reason: STAPLE_SLOW_REASON,
    };
  }

  if (metrics.daysOfStockOnHand === null) {
    return {
      action: 'Return to distributor if the terms allow, or stop buying',
      reason: 'No units moved in this review period. Avoid locking more cash here.',
    };
  }

  if (metrics.grossMarginPct >= HIGH_MARGIN_THRESHOLD_PCT) {
    return {
      action: 'Reduce next order; check if shelf position is poor',
      reason: `Good margin (${metrics.grossMarginPct.toFixed(1)}%), but sitting at ${metrics.daysOfStockOnHand.toFixed(1)} days on hand.`,
    };
  }

  return {
    action: 'Stop reordering or clear with a bundle',
    reason: `Low margin (${metrics.grossMarginPct.toFixed(1)}%) and slow stock (${metrics.daysOfStockOnHand.toFixed(1)} days on hand).`,
  };
}

/**
 * Returns a short reason matching the currently chosen action in the dropdown.
 */
export function getReasonForSelectedAction(
  action: string,
  metrics: ItemMetrics,
  isNearExpiry: boolean,
  isStaple: boolean
): string {
  if (action === STAPLE_SLOW_ACTION) {
    return STAPLE_SLOW_REASON;
  }
  if (action === 'Discount or sell this week') {
    return isNearExpiry
      ? `Perishable stock expires in ${metrics.item.daysToExpiry ?? 0}d. Clear shelf units quickly.`
      : 'Use a small short-term offer to turn shelf stock back into cash.';
  }
  if (action === 'Reduce next order; check if shelf position is poor') {
    return isStaple
      ? STAPLE_SLOW_REASON
      : `Good margin (${metrics.grossMarginPct.toFixed(1)}%), but moving slowly on the shelf.`;
  }
  if (action === 'Return to distributor if the terms allow, or stop buying') {
    return 'No movement recorded during this period. Check distributor return or exchange terms.';
  }
  if (action === 'Stop reordering or clear with a bundle') {
    return `Low margin (${metrics.grossMarginPct.toFixed(1)}%) and slow turnover (${metrics.daysOfStockOnHand === null ? 'no movement' : `${metrics.daysOfStockOnHand.toFixed(1)} days`}).`;
  }
  return getDefaultSlowStockActionAndReason(metrics, isNearExpiry, isStaple).reason;
}

/**
 * Evaluates all items against slow/dead thresholds and near-expiry rules,
 * returning sorted slow/dead entries (highest cash tied up first) and totals.
 */
export function evaluateSlowStock(
  metricsList: ItemMetrics[],
  settings: Pick<
    AppSettings,
    'slowThresholdDays' | 'deadThresholdDays' | 'nearExpiryThresholdDays'
  >,
  customActionOverrides: Record<string, string> = {}
): SlowStockSummary {
  const totalClosingStockValue = metricsList.reduce((sum, m) => sum + m.closingValue, 0);
  const entries: SlowStockEntry[] = [];

  let cashTiedInSlow = 0;
  let cashTiedInDead = 0;

  for (const metrics of metricsList) {
    const severity = classifySlowStockSeverity(metrics, settings);
    const isNearExpiry =
      metrics.item.perishable &&
      metrics.item.daysToExpiry !== null &&
      metrics.item.daysToExpiry < settings.nearExpiryThresholdDays &&
      metrics.closingValue > 0;
    const isStaple = isEverydayStaple(metrics.item);

    if (severity === 'slow') {
      cashTiedInSlow += metrics.closingValue;
    } else if (severity === 'dead') {
      cashTiedInDead += metrics.closingValue;
    }

    if (severity !== 'normal' || isNearExpiry) {
      const defaults = getDefaultSlowStockActionAndReason(metrics, isNearExpiry, isStaple);
      const override = customActionOverrides[metrics.item.id] ?? null;
      const safeOverride =
        isStaple && override && override.toLowerCase().includes('stop reordering')
          ? null
          : override;
      const chosenAction = safeOverride ?? defaults.action;
      const reason = safeOverride
        ? getReasonForSelectedAction(chosenAction, metrics, isNearExpiry, isStaple)
        : defaults.reason;

      entries.push({
        metrics,
        severity,
        cashTiedUp: metrics.closingValue,
        isNearExpiry,
        isStaple,
        suggestedAction: defaults.action,
        reason,
        customAction: safeOverride,
      });
    }
  }

  entries.sort((a, b) => b.cashTiedUp - a.cashTiedUp);

  const combinedSlowAndDead = cashTiedInSlow + cashTiedInDead;
  const slowAndDeadSharePct =
    totalClosingStockValue > 0 ? (combinedSlowAndDead / totalClosingStockValue) * 100 : 0;

  return {
    entries,
    cashTiedInSlow,
    cashTiedInDead,
    totalClosingStockValue,
    slowAndDeadSharePct,
  };
}

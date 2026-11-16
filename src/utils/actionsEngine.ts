/**
 * ============================================================================
 * ACTIONS ENGINE SECTION
 * Generates the three most valuable monthly actions, ranked by rupees at stake,
 * using deterministic business rules (no AI or certainty claims).
 * ============================================================================
 */

import type {
  AppSettings,
  GeneratedAction,
  ItemMetrics,
  SlowStockSummary,
} from '../types/inventory';
import { HIGH_MARGIN_THRESHOLD_PCT } from './calculations';
import { formatRs } from './formatters';

/**
 * Generates up to 3 prioritized monthly actions ranked by rupees at stake:
 * 1. Largest cash tied up in slow or dead stock.
 * 2. Largest gap between high-margin items running short (< 7 days) and low-margin items overstocked (> slow threshold).
 * 3. Largest near-expiry perishable stock value.
 */
export function generateTopThreeActions(
  metricsList: ItemMetrics[],
  slowSummary: SlowStockSummary,
  settings: Pick<AppSettings, 'slowThresholdDays' | 'nearExpiryThresholdDays'>
): GeneratedAction[] {
  const candidates: GeneratedAction[] = [];

  // Rule 1: Largest cash tied up in slow / dead stock
  const slowEntries = slowSummary.entries.filter((e) => e.severity !== 'normal');
  if (slowEntries.length > 0) {
    const topSlow = slowEntries[0];
    const totalSlowCash = slowSummary.cashTiedInSlow + slowSummary.cashTiedInDead;
    candidates.push({
      id: 'action-slow-cash',
      ruleKey: 'slow-cash',
      label: 'Free cash from slow stock',
      description: `Clear or pause reorders on ${topSlow.metrics.item.name} (${formatRs(topSlow.cashTiedUp)}) and ${Math.max(0, slowEntries.length - 1)} other slow items to release working capital.`,
      rupeesAtStake: Math.round(totalSlowCash),
      relatedItemNames: slowEntries.slice(0, 3).map((e) => e.metrics.item.name),
    });
  } else {
    candidates.push({
      id: 'action-slow-cash',
      ruleKey: 'slow-cash',
      label: 'Monitor slow-moving stock',
      description: 'Review items above the slow-stock day threshold before placing next week’s distributor order.',
      rupeesAtStake: 0,
      relatedItemNames: [],
    });
  }

  // Rule 2: Largest gap between high-margin items running short and low-margin items overstocked
  const highMarginShort = metricsList
    .filter(
      (m) =>
        m.grossMarginPct >= HIGH_MARGIN_THRESHOLD_PCT &&
        m.daysOfStockOnHand !== null &&
        m.daysOfStockOnHand < 7 &&
        m.salesUnits > 0
    )
    .sort((a, b) => b.grossMarginEarned - a.grossMarginEarned);

  const lowMarginOverstocked = metricsList
    .filter(
      (m) =>
        m.grossMarginPct < HIGH_MARGIN_THRESHOLD_PCT &&
        (m.daysOfStockOnHand === null || m.daysOfStockOnHand > settings.slowThresholdDays) &&
        m.closingValue > 0
    )
    .sort((a, b) => b.closingValue - a.closingValue);

  if (highMarginShort.length > 0 && lowMarginOverstocked.length > 0) {
    const shortItem = highMarginShort[0];
    const overItem = lowMarginOverstocked[0];
    const gapRupees = Math.round(overItem.closingValue + shortItem.grossMarginEarned * 0.5);
    candidates.push({
      id: 'action-margin-gap',
      ruleKey: 'margin-stock-gap',
      label: 'Shift cash to fast high-margin items',
      description: `Shift budget from overstocked ${overItem.item.name} (${formatRs(overItem.closingValue)}) toward fast high-margin ${shortItem.item.name} (${shortItem.daysOfStockOnHand?.toFixed(1)} days left).`,
      rupeesAtStake: gapRupees,
      relatedItemNames: [overItem.item.name, shortItem.item.name],
    });
  } else if (highMarginShort.length > 0) {
    const shortItem = highMarginShort[0];
    candidates.push({
      id: 'action-margin-gap',
      ruleKey: 'margin-stock-gap',
      label: 'Protect high-margin shelf availability',
      description: `Keep high-margin ${shortItem.item.name} (${shortItem.grossMarginPct.toFixed(1)}% margin, ${shortItem.daysOfStockOnHand?.toFixed(1)} days stock left) well stocked before weekend demand.`,
      rupeesAtStake: Math.round(shortItem.grossMarginEarned),
      relatedItemNames: [shortItem.item.name],
    });
  } else {
    candidates.push({
      id: 'action-margin-gap',
      ruleKey: 'margin-stock-gap',
      label: 'Balance high-margin vs low-margin stock',
      description: 'Compare high-margin fast sellers against low-margin overstocked packs before adjusting order quantities.',
      rupeesAtStake: 0,
      relatedItemNames: [],
    });
  }

  // Rule 3: Largest near-expiry perishable value
  const nearExpiryItems = metricsList
    .filter(
      (m) =>
        m.item.perishable &&
        m.item.daysToExpiry !== null &&
        m.item.daysToExpiry < settings.nearExpiryThresholdDays &&
        m.closingValue > 0
    )
    .sort((a, b) => b.closingValue - a.closingValue);

  if (nearExpiryItems.length > 0) {
    const totalPerishableRisk = nearExpiryItems.reduce((sum, m) => sum + m.closingValue, 0);
    const topExpiry = nearExpiryItems[0];
    candidates.push({
      id: 'action-near-expiry',
      ruleKey: 'near-expiry',
      label: 'Prevent perishable expiry loss',
      description: `Sell or lightly discount ${topExpiry.item.name} (${topExpiry.item.daysToExpiry}d to expiry) and ${Math.max(0, nearExpiryItems.length - 1)} other near-expiry items this week.`,
      rupeesAtStake: Math.round(totalPerishableRisk),
      relatedItemNames: nearExpiryItems.slice(0, 3).map((m) => m.item.name),
    });
  } else {
    const nextExpiring = metricsList
      .filter((m) => m.item.perishable && m.closingValue > 0)
      .sort((a, b) => (a.item.daysToExpiry ?? 99) - (b.item.daysToExpiry ?? 99));
    const topPerishable = nextExpiring[0];
    candidates.push({
      id: 'action-near-expiry',
      ruleKey: 'near-expiry',
      label: 'Keep perishable orders tight',
      description: topPerishable
        ? `Keep daily order sizes tight on perishables such as ${topPerishable.item.name} (${topPerishable.item.daysToExpiry ?? 'few'} days shelf life).`
        : 'Track shelf life on dairy and bakery items during weekly stock checks.',
      rupeesAtStake: topPerishable ? Math.round(topPerishable.closingValue) : 0,
      relatedItemNames: topPerishable ? [topPerishable.item.name] : [],
    });
  }

  return candidates.sort((a, b) => b.rupeesAtStake - a.rupeesAtStake).slice(0, 3);
}

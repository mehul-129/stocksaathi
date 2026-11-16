/**
 * ============================================================================
 * REPORT FORMATTER SECTION
 * Generates plain-text WhatsApp summaries (English and Hindi-English) for
 * the shopkeeper using "Cash tied up (not profit lost)" wording.
 * ============================================================================
 */

import type {
  ActionUserState,
  AppSettings,
  GeneratedAction,
  ItemMetrics,
  ShopSetup,
  SlowStockSummary,
} from '../types/inventory';
import { formatDate, formatRs } from './formatters';

export interface ReportSummaryTotals {
  totalStockValue: number;
  totalCogs: number;
  totalMarginEarned: number;
  hasRecordedItems: boolean;
  allEstimated: boolean;
  cashTiedInSlow: number;
  cashTiedInDead: number;
}

export function computeReportSummaryTotals(
  metricsList: ItemMetrics[],
  slowSummary: SlowStockSummary
): ReportSummaryTotals {
  const totalStockValue = metricsList.reduce((sum, m) => sum + m.closingValue, 0);
  const totalCogs = metricsList.reduce((sum, m) => sum + m.cogsValue, 0);
  const totalMarginEarned = metricsList.reduce((sum, m) => sum + m.grossMarginEarned, 0);
  const hasRecordedItems = metricsList.some((m) => !m.isEstimated);
  const allEstimated = metricsList.every((m) => m.isEstimated);

  return {
    totalStockValue,
    totalCogs,
    totalMarginEarned,
    hasRecordedItems,
    allEstimated,
    cashTiedInSlow: slowSummary.cashTiedInSlow,
    cashTiedInDead: slowSummary.cashTiedInDead,
  };
}

/**
 * Generates a short plain-text WhatsApp message in English or Hindi-English (Hinglish).
 * Plain text only (no markdown formatting characters).
 */
export function buildWhatsAppSummary(params: {
  language: 'en' | 'hinglish';
  setup: ShopSetup;
  totals: ReportSummaryTotals;
  actions: GeneratedAction[];
  actionOverrides: Record<string, ActionUserState>;
  settings: AppSettings;
}): string {
  const { language, setup, totals, actions, actionOverrides, settings } = params;
  const periodLabel = `${formatDate(setup.periodStart)} to ${formatDate(setup.periodEnd)}`;
  const contactSuffix = settings.consultantContact.trim()
    ? ` (${settings.consultantContact.trim()})`
    : '';
  const shopDisplayName = setup.shopName.trim() || 'Shop';

  if (language === 'hinglish') {
    const actionLines = actions
      .map((a, idx) => {
        const userAction = actionOverrides[a.id]?.ownerAction?.trim();
        const detail = userAction ? `${a.label}: ${userAction}` : a.description;
        return `${idx + 1}. ${detail} (Cash tied up, not profit lost: ${formatRs(a.rupeesAtStake)})`;
      })
      .join('\n');

    return [
      `${shopDisplayName} - StockSaathi Monthly Summary`,
      `Period: ${periodLabel}`,
      '',
      `Namaste${setup.ownerName ? ` ${setup.ownerName} ji` : ''}, is mahine ke stock count aur purchase bills ka summary:`,
      `- Closing stock value: ${formatRs(totals.totalStockValue)}`,
      `- Estimated bikri cost (COGS): ${formatRs(totals.totalCogs)}`,
      `- Estimated gross margin: ${formatRs(totals.totalMarginEarned)}`,
      `- Slow stock — Cash tied up (not profit lost): ${formatRs(totals.cashTiedInSlow)}`,
      `- Dead stock — Cash tied up (not profit lost): ${formatRs(totals.cashTiedInDead)}`,
      '',
      `Is mahine ke 3 mukhya kadam:`,
      actionLines,
      '',
      `Note: Yeh figures ${formatDate(setup.countDate)} ke stock count aur purchase bills par based anumaan (estimate) hain. Order badalne se pehle apni suvidha check karein.`,
      `Prepared by ${settings.consultantName}${contactSuffix}`,
    ].join('\n');
  }

  const actionLines = actions
    .map((a, idx) => {
      const userAction = actionOverrides[a.id]?.ownerAction?.trim();
      const detail = userAction ? `${a.label}: ${userAction}` : a.description;
      return `${idx + 1}. ${detail} (Cash tied up, not profit lost: ${formatRs(a.rupeesAtStake)})`;
    })
    .join('\n');

  return [
    `${shopDisplayName} - StockSaathi Monthly Summary`,
    `Period: ${periodLabel}`,
    '',
    `Hello${setup.ownerName ? ` ${setup.ownerName}` : ''}, here is your monthly stock and margin summary:`,
    `- Closing stock value: ${formatRs(totals.totalStockValue)}`,
    `- Estimated cost of goods sold: ${formatRs(totals.totalCogs)}`,
    `- Estimated gross margin earned: ${formatRs(totals.totalMarginEarned)}`,
    `- Slow stock — Cash tied up (not profit lost): ${formatRs(totals.cashTiedInSlow)}`,
    `- Dead stock — Cash tied up (not profit lost): ${formatRs(totals.cashTiedInDead)}`,
    '',
    `Three actions for this month:`,
    actionLines,
    '',
    `Note: Figures are estimates based on the stock count on ${formatDate(setup.countDate)} and purchase bills for the period. Please review before changing orders.`,
    `Prepared by ${settings.consultantName}${contactSuffix}`,
  ].join('\n');
}

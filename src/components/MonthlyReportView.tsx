import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  MessageSquare,
  Printer,
} from 'lucide-react';
import type {
  ActionUserState,
  AppSettings,
  GeneratedAction,
  ItemMetrics,
  ShopSetup,
  SlowStockSummary,
} from '../types/inventory';
import { computeOverallGrossMarginPct } from '../utils/calculations';
import { formatDate, formatPercent, formatRatio, formatRs } from '../utils/formatters';
import {
  buildWhatsAppSummary,
  computeReportSummaryTotals,
} from '../utils/reportFormatter';

interface MonthlyReportViewProps {
  setup: ShopSetup;
  dataMode: 'demo' | 'blank';
  metricsList: ItemMetrics[];
  slowSummary: SlowStockSummary;
  actions: GeneratedAction[];
  actionOverrides: Record<string, ActionUserState>;
  settings: AppSettings;
}

function HorizontalBarList({
  rows,
  barColor,
  emptyMessage,
}: {
  rows: { id: string; name: string; value: number; subLabel: string }[];
  barColor: string;
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-[#526057] py-2">{emptyMessage}</p>;
  }
  const maxVal = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="space-y-3">
      {rows.map((row, idx) => {
        const pct = Math.max(4, Math.round((row.value / maxVal) * 100));
        return (
          <div key={row.id} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-[#17211B] truncate">
                {idx + 1}. {row.name}
              </span>
              <span className="font-mono tabular-nums font-semibold text-[#17211B] whitespace-nowrap shrink-0">
                {formatRs(row.value)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                width="100%"
                height="8"
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="flex-1 rounded-full overflow-hidden bg-[#EDF1EB]"
              >
                <rect x="0" y="0" width={pct} height="8" rx="4" fill={barColor} />
              </svg>
              <span className="text-xs text-[#526057] whitespace-nowrap shrink-0 tabular-nums">
                {row.subLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MonthlyReportView({
  setup,
  dataMode,
  metricsList,
  slowSummary,
  actions,
  actionOverrides,
  settings,
}: MonthlyReportViewProps) {
  const [waLanguage, setWaLanguage] = useState<'en' | 'hinglish'>('en');
  const [copied, setCopied] = useState(false);

  const totals = useMemo(
    () => computeReportSummaryTotals(metricsList, slowSummary),
    [metricsList, slowSummary]
  );

  const overallMarginPct = useMemo(
    () => computeOverallGrossMarginPct(metricsList),
    [metricsList]
  );

  const marginIsConsistent =
    metricsList.length > 0 &&
    overallMarginPct >= settings.typicalMarginMinPct &&
    overallMarginPct <= settings.typicalMarginMaxPct;

  const top5ByMargin = useMemo(
    () =>
      [...metricsList]
        .filter((m) => m.grossMarginEarned > 0)
        .sort((a, b) => b.grossMarginEarned - a.grossMarginEarned)
        .slice(0, 5)
        .map((m) => ({
          id: m.item.id,
          name: m.item.name,
          value: m.grossMarginEarned,
          subLabel: `${formatPercent(m.grossMarginPct)} · GMROI ${formatRatio(m.gmroi)} · ${m.isEstimated ? 'Est.' : 'Rec.'}`,
        })),
    [metricsList]
  );

  const top5ByCashTiedUp = useMemo(
    () =>
      [...metricsList]
        .filter((m) => m.closingValue > 0)
        .sort((a, b) => b.closingValue - a.closingValue)
        .slice(0, 5)
        .map((m) => ({
          id: m.item.id,
          name: m.item.name,
          value: m.closingValue,
          subLabel:
            m.daysOfStockOnHand === null
              ? 'No movement'
              : `${m.daysOfStockOnHand.toFixed(1)} days on hand`,
        })),
    [metricsList]
  );

  const whatsAppText = useMemo(
    () =>
      buildWhatsAppSummary({
        language: waLanguage,
        setup,
        totals,
        actions,
        actionOverrides,
        settings,
      }),
    [waLanguage, setup, totals, actions, actionOverrides, settings]
  );

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(whatsAppText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const area = document.createElement('textarea');
      area.value = whatsAppText;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const periodText = `${formatDate(setup.periodStart)} to ${formatDate(setup.periodEnd)}`;
  const reviewDate = formatDate(setup.countDate || setup.periodEnd);

  const estimatedItemCount = useMemo(
    () => metricsList.filter((m) => m.isEstimated).length,
    [metricsList]
  );
  const recordedItemCount = metricsList.length - estimatedItemCount;

  const isDemoShop =
    dataMode === 'demo' ||
    setup.shopName.trim().toLowerCase() === 'sharma general store';
  const shopHeading = isDemoShop
    ? `${setup.shopName || 'Sharma General Store'} (demo shop, fictional owner)`
    : setup.shopName || 'Unnamed Shop';

  return (
    <div className="space-y-6">
      {/* Action Bar (hidden when printing) */}
      <div className="no-print bg-white border border-[#DFE4DC] rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#17211B]">
            One-page monthly report
          </h2>
          <p className="text-sm text-[#526057]">
            Formatted for A4 printing and clear phone reading with the shopkeeper.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-[#CFD7CC] bg-[#FAFBF9] p-1">
            <button
              type="button"
              onClick={() => setWaLanguage('en')}
              className={`min-h-[36px] px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                waLanguage === 'en'
                  ? 'bg-[#14532D] text-white'
                  : 'text-[#313D35] hover:bg-white'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setWaLanguage('hinglish')}
              className={`min-h-[36px] px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                waLanguage === 'hinglish'
                  ? 'bg-[#14532D] text-white'
                  : 'text-[#313D35] hover:bg-white'
              }`}
            >
              Hindi-English
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="min-h-[44px] px-4 py-2 rounded-lg border border-[#CFD7CC] bg-white text-[#17211B] text-sm font-medium hover:bg-[#F3F6F1] inline-flex items-center gap-2 whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
                <span>Copied plain text</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 text-[#14532D]" aria-hidden="true" />
                <span>Copy summary for WhatsApp</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-[#14532D] text-white text-sm font-medium hover:bg-[#166534] inline-flex items-center gap-2 whitespace-nowrap"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span>Print / Download PDF</span>
          </button>
        </div>
      </div>

      {/* Printable A4 / Mobile-Readable One-Page Report Sheet */}
      <article
        aria-label="Printable monthly shopkeeper report"
        className="print-only-full bg-white border border-[#DFE4DC] rounded-xl p-5 sm:p-8 max-w-4xl mx-auto space-y-6"
      >
        {/* Report Header */}
        <header className="border-b border-[#DFE4DC] pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[#14532D]">
              StockSaathi · Know which stock earns, and which sits idle
            </div>
            <h1 className="font-display text-2xl font-bold text-[#17211B] mt-0.5">
              {shopHeading}
            </h1>
            <p className="text-sm text-[#425046]">
              {[setup.locality, setup.ownerName ? `Owner: ${setup.ownerName}` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div className="text-sm text-[#425046] sm:text-right space-y-0.5">
            <div>
              Review period: <strong className="text-[#17211B]">{periodText}</strong>
            </div>
            <div>
              Date of review: <strong className="text-[#17211B]">{reviewDate}</strong>
            </div>
            <div>Prepared by {settings.consultantName}</div>
          </div>
        </header>

        {/* Summary KPI Grid */}
        <section aria-label="Monthly summary figures" className="print-break-inside-avoid">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="border border-[#E2E7DF] rounded-lg p-3.5 bg-[#FAFBF9]">
              <div className="text-xs text-[#526057]">Total closing stock value</div>
              <div className="font-mono tabular-nums text-lg font-bold text-[#17211B] mt-1">
                {formatRs(totals.totalStockValue)}
              </div>
            </div>

            <div className="border border-[#E2E7DF] rounded-lg p-3.5 bg-[#FAFBF9]">
              <div className="text-xs text-[#526057]">Estimated cost of goods sold</div>
              <div className="font-mono tabular-nums text-lg font-bold text-[#17211B] mt-1">
                {formatRs(totals.totalCogs)}
              </div>
              <div className="text-[11px] text-[#526057]">
                {recordedItemCount > 0
                  ? `${estimatedItemCount} Estimated · ${recordedItemCount} Recorded`
                  : 'Estimated from stock'}
              </div>
            </div>

            <div className="border border-[#E2E7DF] rounded-lg p-3.5 bg-[#F0FDF4]">
              <div className="text-xs text-[#166534]">Estimated gross margin</div>
              <div className="font-mono tabular-nums text-lg font-bold text-[#15803D] mt-1">
                {formatRs(totals.totalMarginEarned)}
              </div>
              <div className="text-[11px] text-[#166534]">
                {recordedItemCount > 0
                  ? `${estimatedItemCount} Estimated · ${recordedItemCount} Recorded`
                  : 'Estimated'}
              </div>
            </div>

            <div className="border border-[#FDE68A] rounded-lg p-3.5 bg-[#FFFBEB]">
              <div className="text-xs text-[#92400E]">Cash tied up (not profit lost) — slow</div>
              <div className="font-mono tabular-nums text-lg font-bold text-[#B45309] mt-1">
                {formatRs(totals.cashTiedInSlow)}
              </div>
            </div>

            <div className="border border-[#FECACA] rounded-lg p-3.5 bg-[#FEF2F2]">
              <div className="text-xs text-[#991B1B]">Cash tied up (not profit lost) — dead</div>
              <div className="font-mono tabular-nums text-lg font-bold text-[#B91C1C] mt-1">
                {formatRs(totals.cashTiedInDead)}
              </div>
            </div>
          </div>
        </section>

        {/* Reasonableness Check Card */}
        <section
          aria-labelledby="reasonableness-check-heading"
          className="border border-[#DFE4DC] rounded-lg p-4 bg-[#FAFBF9] flex flex-wrap items-center justify-between gap-4 print-break-inside-avoid"
        >
          <div className="space-y-0.5">
            <h2 id="reasonableness-check-heading" className="font-display text-base font-semibold text-[#17211B]">
              Reasonableness check
            </h2>
            <p className="text-sm text-[#425046]">
              Estimated overall gross margin{' '}
              <strong className="font-mono tabular-nums text-[#17211B]">
                {formatPercent(overallMarginPct)}
              </strong>{' '}
              vs typical range{' '}
              <strong className="font-mono tabular-nums text-[#17211B]">
                {formatPercent(settings.typicalMarginMinPct)} to {formatPercent(settings.typicalMarginMaxPct)}
              </strong>{' '}
              (proposed setting).
            </p>
          </div>

          <div>
            {metricsList.length === 0 ? (
              <span className="text-sm font-medium text-[#526057]">No data yet</span>
            ) : marginIsConsistent ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#15803D]">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                Looks consistent
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B45309]">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                Check with shopkeeper
              </span>
            )}
          </div>
        </section>

        {/* Top 5 Margin Earned & Top 5 Cash Tied Up */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 print-break-inside-avoid">
          <div className="border border-[#E2E7DF] rounded-lg p-4 space-y-3">
            <h2 className="font-display text-base font-semibold text-[#17211B]">
              Top 5 items by margin earned (Estimated)
            </h2>
            <HorizontalBarList
              rows={top5ByMargin}
              barColor="#15803D"
              emptyMessage="No margin earned recorded for this period."
            />
          </div>

          <div className="border border-[#E2E7DF] rounded-lg p-4 space-y-3">
            <h2 className="font-display text-base font-semibold text-[#17211B]">
              Top 5 items by cash tied up (not profit lost)
            </h2>
            <HorizontalBarList
              rows={top5ByCashTiedUp}
              barColor="#B45309"
              emptyMessage="No closing stock value recorded."
            />
          </div>
        </section>

        {/* Three Actions & Shopkeeper Decisions */}
        <section aria-label="Three actions for next month" className="space-y-3 print-break-inside-avoid">
          <h2 className="font-display text-base font-semibold text-[#17211B]">
            Three actions agreed for next month
          </h2>
          <div className="border border-[#E2E7DF] rounded-lg divide-y divide-[#EDF1EB]">
            {actions.map((action, idx) => {
              const userState = actionOverrides[action.id];
              const decisionLabel =
                userState?.decision && userState.decision !== 'pending'
                  ? userState.decision.charAt(0).toUpperCase() + userState.decision.slice(1)
                  : 'To discuss';

              return (
                <div key={action.id} className="p-3.5 space-y-1.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="font-medium text-[15px] text-[#17211B]">
                      {idx + 1}. {action.description}
                    </div>
                    <div className="font-mono tabular-nums text-sm font-bold text-[#B45309] shrink-0">
                      {formatRs(action.rupeesAtStake)} · Cash tied up (not profit lost)
                    </div>
                  </div>
                  <div className="text-sm text-[#425046] flex flex-wrap gap-x-4 gap-y-1">
                    <span>
                      <strong>Shopkeeper decision:</strong> {decisionLabel}
                    </span>
                    <span>
                      <strong>Owner action:</strong>{' '}
                      {userState?.ownerAction?.trim() || '__________________________'}
                    </span>
                    {userState?.note?.trim() && (
                      <span>
                        <strong>Note:</strong> {userState.note.trim()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Method Box */}
        <section
          aria-label="Calculation method"
          className="bg-[#FAFBF9] border border-[#DFE4DC] rounded-lg p-3.5 text-xs sm:text-sm text-[#313D35] print-break-inside-avoid"
        >
          <strong>Method:</strong> Figures use the stock count on {formatDate(setup.countDate)} and purchase bills from {periodText}. Sales not recorded by the shop are estimated as opening stock plus purchases minus closing stock.
        </section>

        {/* Report Footer */}
        <footer className="border-t border-[#DFE4DC] pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#526057]">
          <span>
            This review shows stock and margin patterns for the period. It is advice, not an audit or a financial statement.
          </span>
          <span>
            {settings.consultantContact.trim() || '+91 XXXXX XXXXX (enter your own contact in Settings)'}
          </span>
        </footer>
      </article>

      {/* WhatsApp Preview Box (hidden on print) */}
      <section className="no-print bg-white border border-[#DFE4DC] rounded-xl p-4 sm:p-5 max-w-4xl mx-auto space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-[#17211B]">
            Plain-text WhatsApp preview ({waLanguage === 'en' ? 'English' : 'Hindi-English'})
          </h3>
          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="min-h-[44px] px-3 py-1.5 rounded-lg text-sm font-medium text-[#14532D] hover:bg-[#EEF4EE] inline-flex items-center gap-1.5"
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
            <span>{copied ? 'Copied' : 'Copy text'}</span>
          </button>
        </div>
        <pre className="whitespace-pre-wrap font-sans text-sm text-[#313D35] bg-[#FAFBF9] border border-[#E2E7DF] rounded-lg p-4 leading-relaxed">
          {whatsAppText}
        </pre>
      </section>
    </div>
  );
}

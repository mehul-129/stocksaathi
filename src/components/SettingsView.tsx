import React, { useMemo, useState } from 'react';
import { CheckCircle2, Download, RotateCcw, Sliders, XCircle } from 'lucide-react';
import type { AppSettings, MonthDataset, ReviewMonthId } from '../types/inventory';
import { runCalculationSelfTests } from '../utils/calculations';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onSwitchDataMode: (mode: 'demo' | 'blank') => void;
  onResetDemoData: () => void;
  allDatasets: Record<ReviewMonthId, MonthDataset>;
}

export function SettingsView({
  settings,
  onUpdateSettings,
  onSwitchDataMode,
  onResetDemoData,
  allDatasets,
}: SettingsViewProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const testResults = useMemo(() => runCalculationSelfTests(), []);

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'StockSaathi',
      note: 'Demo prototype export. Not an audit or financial statement.',
      settings,
      months: allDatasets,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stocksaathi-export.json';
    link.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Exported all tables to stocksaathi-export.json.');
  };

  return (
    <div className="space-y-6">
      {/* Thresholds & Consultant Details */}
      <section
        aria-labelledby="settings-thresholds-heading"
        className="bg-white border border-[#DFE4DC] rounded-xl p-5 sm:p-6 space-y-5"
      >
        <div className="flex items-center gap-2.5 border-b border-[#EDF1EB] pb-4">
          <Sliders className="w-5 h-5 text-[#14532D]" aria-hidden="true" />
          <div>
            <h2 id="settings-thresholds-heading" className="font-display text-xl font-semibold text-[#17211B]">
              Review thresholds & report footer
            </h2>
            <p className="text-sm text-[#526057]">
              Adjust slow/dead stock day limits, near-expiry warning days, typical margin range, and consultant details.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="slow-threshold" className="block text-sm font-medium text-[#313D35] mb-1.5">
              Slow stock threshold (days)
            </label>
            <input
              id="slow-threshold"
              type="number"
              min="1"
              value={settings.slowThresholdDays}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (Number.isFinite(val) && val >= 1) {
                  onUpdateSettings({ slowThresholdDays: val });
                }
              }}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] font-mono tabular-nums text-[15px]"
            />
          </div>

          <div>
            <label htmlFor="dead-threshold" className="block text-sm font-medium text-[#313D35] mb-1.5">
              Dead stock threshold (days)
            </label>
            <input
              id="dead-threshold"
              type="number"
              min="1"
              value={settings.deadThresholdDays}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (Number.isFinite(val) && val >= 1) {
                  onUpdateSettings({ deadThresholdDays: val });
                }
              }}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] font-mono tabular-nums text-[15px]"
            />
          </div>

          <div>
            <label htmlFor="expiry-threshold" className="block text-sm font-medium text-[#313D35] mb-1.5">
              Perishable near-expiry warning (days)
            </label>
            <input
              id="expiry-threshold"
              type="number"
              min="1"
              value={settings.nearExpiryThresholdDays}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (Number.isFinite(val) && val >= 1) {
                  onUpdateSettings({ nearExpiryThresholdDays: val });
                }
              }}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] font-mono tabular-nums text-[15px]"
            />
          </div>
        </div>

        {/* Typical Margin Range (proposed setting) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#EDF1EB]">
          <div>
            <label htmlFor="typical-margin-min" className="block text-sm font-medium text-[#313D35] mb-1.5">
              Typical gross margin min % (proposed setting)
            </label>
            <input
              id="typical-margin-min"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={settings.typicalMarginMinPct}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (Number.isFinite(val) && val >= 0) {
                  onUpdateSettings({ typicalMarginMinPct: val });
                }
              }}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] font-mono tabular-nums text-[15px]"
            />
          </div>

          <div>
            <label htmlFor="typical-margin-max" className="block text-sm font-medium text-[#313D35] mb-1.5">
              Typical gross margin max % (proposed setting)
            </label>
            <input
              id="typical-margin-max"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={settings.typicalMarginMaxPct}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (Number.isFinite(val) && val >= 0) {
                  onUpdateSettings({ typicalMarginMaxPct: val });
                }
              }}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] font-mono tabular-nums text-[15px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#EDF1EB]">
          <div>
            <label htmlFor="consultant-name" className="block text-sm font-medium text-[#313D35] mb-1.5">
              Consultant name (report footer)
            </label>
            <input
              id="consultant-name"
              type="text"
              value={settings.consultantName}
              onChange={(e) => onUpdateSettings({ consultantName: e.target.value })}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] text-[15px]"
            />
          </div>

          <div>
            <label htmlFor="consultant-contact" className="block text-sm font-medium text-[#313D35] mb-1.5">
              Consultant contact (report footer only)
            </label>
            <input
              id="consultant-contact"
              type="text"
              value={settings.consultantContact}
              placeholder="+91 XXXXX XXXXX"
              onChange={(e) => onUpdateSettings({ consultantContact: e.target.value })}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] text-[15px]"
            />
            <p className="text-xs text-[#526057] mt-1">Enter your own contact</p>
          </div>
        </div>

        <div className="text-sm text-[#526057] pt-2 border-t border-[#EDF1EB]">
          Number format: Indian grouping (<span className="font-mono">Rs 1,20,000</span>) · Percentages to 1 decimal place · Ratios to 2 decimal places.
        </div>
      </section>

      {/* Workspace Mode & Export */}
      <section
        aria-labelledby="data-mode-heading"
        className="bg-white border border-[#DFE4DC] rounded-xl p-5 sm:p-6 space-y-4"
      >
        <h3 id="data-mode-heading" className="font-display text-lg font-semibold text-[#17211B]">
          Workspace data & export
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex rounded-lg border border-[#CFD7CC] bg-[#FAFBF9] p-1">
            <button
              type="button"
              onClick={() => {
                onSwitchDataMode('demo');
                setStatusMessage('Switched to Demo data (Sharma General Store).');
              }}
              className={`min-h-[44px] px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                settings.dataMode === 'demo'
                  ? 'bg-[#14532D] text-white'
                  : 'text-[#313D35] hover:bg-white'
              }`}
            >
              Demo data
            </button>
            <button
              type="button"
              onClick={() => {
                onSwitchDataMode('blank');
                setStatusMessage('Switched to Blank shop. Enter a new shop from scratch.');
              }}
              className={`min-h-[44px] px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                settings.dataMode === 'blank'
                  ? 'bg-[#14532D] text-white'
                  : 'text-[#313D35] hover:bg-white'
              }`}
            >
              Blank shop
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="min-h-[44px] px-4 py-2 rounded-lg border border-[#CFD7CC] bg-white text-[#17211B] text-sm font-medium hover:bg-[#F3F6F1] inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Reset demo data</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-1.5">
                <span className="text-sm text-[#991B1B] font-medium">Restore all demo months?</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetDemoData();
                    setConfirmReset(false);
                    setStatusMessage('Demo data restored to original state.');
                  }}
                  className="min-h-[36px] px-3 py-1 rounded-md bg-[#B91C1C] text-white text-xs font-semibold"
                >
                  Confirm reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-[36px] px-3 py-1 rounded-md border border-[#CFD7CC] bg-white text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleExportJson}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-[#14532D] text-white text-sm font-medium hover:bg-[#166534] inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Data export (JSON)</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <p role="status" className="text-sm font-medium text-[#15803D]">
            {statusMessage}
          </p>
        )}
      </section>

      {/* Calculation Self-Test Panel */}
      <section
        aria-labelledby="self-test-heading"
        className="bg-white border border-[#DFE4DC] rounded-xl p-5 sm:p-6 space-y-4"
      >
        <div className="border-b border-[#EDF1EB] pb-3">
          <h3 id="self-test-heading" className="font-display text-lg font-semibold text-[#17211B]">
            Calculation test panel
          </h3>
          <p className="text-sm text-[#526057]">
            Recalculates cost of goods sold, margin %, days on hand, and stock return for three hand-calculated example items.
          </p>
        </div>

        <div className="divide-y divide-[#EDF1EB]">
          {testResults.map((test) => (
            <div key={test.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <div className="font-semibold text-[15px] text-[#17211B]">{test.name}</div>
                <div className="text-xs text-[#526057]">{test.description}</div>
                <div className="text-xs font-mono text-[#313D35]">
                  Expected: {test.expectedSummary}
                </div>
                <div className="text-xs font-mono text-[#14532D]">
                  Recalculated: {test.actualSummary}
                </div>
              </div>

              <div className="shrink-0">
                {test.passed ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#15803D]">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    Pass
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#B91C1C]">
                    <XCircle className="w-4 h-4" aria-hidden="true" />
                    Fail
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

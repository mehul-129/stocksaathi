import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDataCompleteness,
  computeItemMetrics,
  computeOverallGrossMarginPct,
  evaluateReconciliation,
  rankItemsByGmroi,
  RECONCILIATION_ERROR_MESSAGE,
  runCalculationSelfTests,
  validateClosingCount,
} from './calculations';
import {
  evaluateSlowStock,
  isEverydayStaple,
  STAPLE_SLOW_ACTION,
  STAPLE_SLOW_REASON,
} from './slowStockRules';
import { generateTopThreeActions } from './actionsEngine';
import { parseBillImportText } from './csvParser';
import { buildWhatsAppSummary, computeReportSummaryTotals } from './reportFormatter';
import { formatDate, formatPercent, formatRatio, formatRs } from './formatters';
import { createDemoDatasets, DEFAULT_SETTINGS } from '../data/demoData';

test('Indian currency, percentage, ratio, and date formatters match specification', () => {
  assert.equal(formatRs(120000), 'Rs 1,20,000');
  assert.equal(formatRs(1850), 'Rs 1,850');
  assert.equal(formatPercent(18.46), '18.5%');
  assert.equal(formatRatio(2.4), '2.40');
  assert.equal(formatRatio(null), '—');
  assert.equal(formatDate('2026-11-16'), '16 Nov 2026');
});

test('All 3 hand-calculated self-test items pass', () => {
  const results = runCalculationSelfTests();
  assert.equal(results.length, 3);
  for (const r of results) {
    assert.equal(r.passed, true, `Self-test failed for ${r.name}: ${r.actualSummary}`);
  }
});

test('Recorded sales overrides estimated COGS and marks item as Recorded', () => {
  const datasets = createDemoDatasets();
  const sep = datasets['2026-09'];
  const tea = sep.items.find((i) => i.id === 'itm-15');
  assert.ok(tea);
  const metrics = computeItemMetrics(tea, sep.bills, 30, 30);
  assert.equal(metrics.isEstimated, false);
  assert.equal(metrics.salesUnits, 22);
});

test('Inline closing count validation flags negative and impossibly high counts with exact message', () => {
  assert.equal(validateClosingCount(10, 5, -1), RECONCILIATION_ERROR_MESSAGE);
  assert.equal(validateClosingCount(10, 5, 16), RECONCILIATION_ERROR_MESSAGE);
  assert.equal(validateClosingCount(10, 5, 15), null);
});

test('All demo months reconcile cleanly by default and flag bad closing counts', () => {
  const datasets = createDemoDatasets();
  for (const key of ['2026-08', '2026-09', '2026-10'] as const) {
    const rec = evaluateReconciliation(datasets[key].items, datasets[key].bills);
    assert.equal(rec.allReconcile, true, `${key} should reconcile cleanly`);
  }

  const badItems = datasets['2026-09'].items.map((item, idx) =>
    idx === 0 ? { ...item, closingCount: 9999 } : item
  );
  const badRec = evaluateReconciliation(badItems, datasets['2026-09'].bills);
  assert.equal(badRec.allReconcile, false);
  assert.equal(badRec.unreconciledItems.length, 1);
  assert.equal(badRec.unreconciledItems[0].errorMessage, RECONCILIATION_ERROR_MESSAGE);
});

test('Everyday staples never receive Stop reordering and always show staple trim action and reason', () => {
  const datasets = createDemoDatasets();
  const sep = datasets['2026-09'];
  const ranked = rankItemsByGmroi(sep.items, sep.bills, 30, DEFAULT_SETTINGS.slowThresholdDays);
  const slowSummary = evaluateSlowStock(ranked, DEFAULT_SETTINGS);

  const slowStaples = slowSummary.entries.filter((e) => isEverydayStaple(e.metrics.item));
  assert.ok(slowStaples.length > 0);
  for (const entry of slowStaples) {
    assert.equal(entry.suggestedAction.toLowerCase().includes('stop reordering'), false);
    if (!entry.isNearExpiry) {
      assert.equal(entry.suggestedAction, STAPLE_SLOW_ACTION);
      assert.equal(entry.reason, STAPLE_SLOW_REASON);
    }
  }
});

test('September demo dataset yields 40 items, 60 bills, consistent margin %, and plain-text WhatsApp summary', () => {
  const datasets = createDemoDatasets();
  const sep = datasets['2026-09'];
  assert.equal(sep.items.length, 40);
  assert.equal(sep.bills.length, 60);

  const completeness = computeDataCompleteness(sep.items, sep.bills);
  assert.equal(completeness.totalItems, 40);
  assert.equal(completeness.withCount, 40);

  const ranked = rankItemsByGmroi(sep.items, sep.bills, 30, DEFAULT_SETTINGS.slowThresholdDays);
  const overallMargin = computeOverallGrossMarginPct(ranked);
  assert.ok(
    overallMargin >= DEFAULT_SETTINGS.typicalMarginMinPct &&
      overallMargin <= DEFAULT_SETTINGS.typicalMarginMaxPct
  );

  const slowSummary = evaluateSlowStock(ranked, DEFAULT_SETTINGS);
  const actions = generateTopThreeActions(ranked, slowSummary, DEFAULT_SETTINGS);
  assert.equal(actions.length, 3);

  const totals = computeReportSummaryTotals(ranked, slowSummary);
  const waEn = buildWhatsAppSummary({
    language: 'en',
    setup: sep.setup,
    totals,
    actions,
    actionOverrides: {},
    settings: DEFAULT_SETTINGS,
  });
  const waHi = buildWhatsAppSummary({
    language: 'hinglish',
    setup: sep.setup,
    totals,
    actions,
    actionOverrides: {},
    settings: DEFAULT_SETTINGS,
  });
  assert.equal(waEn.includes('*'), false);
  assert.equal(waHi.includes('*'), false);
  assert.equal(waEn.includes('Cash tied up (not profit lost)'), true);
  assert.equal(waHi.includes('Cash tied up (not profit lost)'), true);
});

test('CSV and pasted table parser validates rows and catches missing/invalid entries', () => {
  const datasets = createDemoDatasets();
  const items = datasets['2026-09'].items;
  const input = [
    'date,supplier,item,quantity,cost_per_unit',
    '2026-09-12,"Local distributor, Greater Noida",Milk 1 L,40,54',
    'bad-date,Brand wholesaler,Atta 5 kg,10,215',
    '2026-09-15,Brand wholesaler,Unknown Item,5,100',
    '2026-09-16\tBrand wholesaler\tSugar 1 kg\t20\t42',
  ].join('\n');

  const parsed = parseBillImportText(input, items);
  assert.equal(parsed.length, 4);
  assert.equal(parsed[0].valid, true);
  assert.equal(parsed[1].valid, false);
  assert.equal(parsed[2].valid, false);
  assert.equal(parsed[3].valid, true);
  assert.equal(parsed[3].bill?.quantity, 20);
});

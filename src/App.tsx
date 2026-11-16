/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import type {
  ActionUserState,
  AppSettings,
  MonthDataset,
  NavSection,
  PurchaseBill,
  ReviewMonthId,
  ShopSetup,
  StockItem,
} from './types/inventory';
import {
  createBlankDatasets,
  createDemoDatasets,
  DEFAULT_SETTINGS,
} from './data/demoData';
import {
  computeDataCompleteness,
  evaluateReconciliation,
  rankItemsByGmroi,
} from './utils/calculations';
import { calculatePeriodDays } from './utils/formatters';
import { evaluateSlowStock } from './utils/slowStockRules';
import { generateTopThreeActions } from './utils/actionsEngine';
import { AppShell } from './components/AppShell';
import { ShopSetupView } from './components/ShopSetupView';
import { StockCountView } from './components/StockCountView';
import { BillsView } from './components/BillsView';
import { ItemsMarginsView } from './components/ItemsMarginsView';
import { SlowStockView } from './components/SlowStockView';
import { ActionsView } from './components/ActionsView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { SettingsView } from './components/SettingsView';

const MONTH_OPTIONS: { id: ReviewMonthId; label: string }[] = [
  { id: '2026-08', label: 'August 2026' },
  { id: '2026-09', label: 'September 2026' },
  { id: '2026-10', label: 'October 2026' },
];

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('shop-setup');
  const [reviewMonth, setReviewMonth] = useState<ReviewMonthId>('2026-09');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [demoDatasets, setDemoDatasets] = useState<Record<ReviewMonthId, MonthDataset>>(
    () => createDemoDatasets()
  );
  const [blankDatasets, setBlankDatasets] = useState<Record<ReviewMonthId, MonthDataset>>(
    () => createBlankDatasets()
  );

  const activeAllDatasets =
    settings.dataMode === 'demo' ? demoDatasets : blankDatasets;
  const setActiveAllDatasets =
    settings.dataMode === 'demo' ? setDemoDatasets : setBlankDatasets;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeSection]);

  const currentMonthData = activeAllDatasets[reviewMonth];

  const updateCurrentMonth = (updater: (prev: MonthDataset) => MonthDataset) => {
    setActiveAllDatasets((prevAll) => ({
      ...prevAll,
      [reviewMonth]: updater(prevAll[reviewMonth]),
    }));
  };

  // Period calculations
  const daysInPeriod = useMemo(
    () =>
      calculatePeriodDays(
        currentMonthData.setup.periodStart,
        currentMonthData.setup.periodEnd
      ),
    [currentMonthData.setup.periodStart, currentMonthData.setup.periodEnd]
  );

  const periodBills = useMemo(() => {
    const { periodStart, periodEnd } = currentMonthData.setup;
    return currentMonthData.bills.filter((b) => {
      if (periodStart && b.billDate < periodStart) return false;
      if (periodEnd && b.billDate > periodEnd) return false;
      return true;
    });
  }, [currentMonthData.bills, currentMonthData.setup]);

  const completeness = useMemo(
    () => computeDataCompleteness(currentMonthData.items, periodBills),
    [currentMonthData.items, periodBills]
  );

  const reconciliation = useMemo(
    () => evaluateReconciliation(currentMonthData.items, periodBills),
    [currentMonthData.items, periodBills]
  );

  const rankedMetrics = useMemo(
    () =>
      rankItemsByGmroi(
        currentMonthData.items,
        periodBills,
        daysInPeriod,
        settings.slowThresholdDays
      ),
    [currentMonthData.items, periodBills, daysInPeriod, settings.slowThresholdDays]
  );

  const slowSummary = useMemo(
    () =>
      evaluateSlowStock(
        rankedMetrics,
        settings,
        currentMonthData.slowActionOverrides
      ),
    [rankedMetrics, settings, currentMonthData.slowActionOverrides]
  );

  const generatedActions = useMemo(
    () => generateTopThreeActions(rankedMetrics, slowSummary, settings),
    [rankedMetrics, slowSummary, settings]
  );

  // State updaters
  const handleUpdateSetup = (patch: Partial<ShopSetup>) => {
    updateCurrentMonth((prev) => ({
      ...prev,
      setup: { ...prev.setup, ...patch },
    }));
  };

  const handleSaveCount = () => {
    updateCurrentMonth((prev) => ({
      ...prev,
      setup: {
        ...prev.setup,
        lastSavedAt: new Date().toISOString(),
      },
    }));
  };

  const handleUpdateItem = (itemId: string, patch: Partial<StockItem>) => {
    updateCurrentMonth((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item
      ),
    }));
  };

  const handleAddItem = (newItem: Omit<StockItem, 'id'>) => {
    const created: StockItem = {
      ...newItem,
      id: `itm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    updateCurrentMonth((prev) => ({
      ...prev,
      items: [...prev.items, created],
    }));
  };

  const handleDeleteItem = (itemId: string) => {
    updateCurrentMonth((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== itemId),
      bills: prev.bills.filter((b) => b.itemId !== itemId),
    }));
  };

  const handleAddBills = (newBills: Omit<PurchaseBill, 'id'>[]) => {
    const withIds: PurchaseBill[] = newBills.map((b, idx) => ({
      ...b,
      id: `bill-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    }));
    updateCurrentMonth((prev) => ({
      ...prev,
      bills: [...prev.bills, ...withIds],
    }));
  };

  const handleDeleteBill = (billId: string) => {
    updateCurrentMonth((prev) => ({
      ...prev,
      bills: prev.bills.filter((b) => b.id !== billId),
    }));
  };

  const handleChangeSlowAction = (itemId: string, actionText: string) => {
    updateCurrentMonth((prev) => ({
      ...prev,
      slowActionOverrides: {
        ...prev.slowActionOverrides,
        [itemId]: actionText,
      },
    }));
  };

  const handleUpdateActionOverride = (
    actionId: string,
    patch: Partial<ActionUserState>
  ) => {
    updateCurrentMonth((prev) => {
      const existing: ActionUserState = prev.actionOverrides[actionId] ?? {
        ownerAction: '',
        decision: 'pending',
        note: '',
      };
      return {
        ...prev,
        actionOverrides: {
          ...prev.actionOverrides,
          [actionId]: { ...existing, ...patch },
        },
      };
    });
  };

  const handleTogglePreviousAction = (prevId: string) => {
    updateCurrentMonth((prev) => ({
      ...prev,
      previousActions: prev.previousActions.map((a) =>
        a.id === prevId ? { ...a, done: !a.done } : a
      ),
    }));
  };

  const handleUpdateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleSwitchDataMode = (mode: 'demo' | 'blank') => {
    setSettings((prev) => ({ ...prev, dataMode: mode }));
  };

  const handleResetDemoData = () => {
    setDemoDatasets(createDemoDatasets());
    setSettings((prev) => ({
      ...DEFAULT_SETTINGS,
      dataMode: 'demo',
      consultantName: prev.consultantName,
      consultantContact: prev.consultantContact,
    }));
  };

  return (
    <AppShell
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      reviewMonth={reviewMonth}
      onChangeReviewMonth={setReviewMonth}
      availableMonths={MONTH_OPTIONS}
      shopName={currentMonthData.setup.shopName}
      dataMode={settings.dataMode}
    >
      {activeSection === 'shop-setup' && (
        <ShopSetupView
          setup={currentMonthData.setup}
          dataMode={settings.dataMode}
          onUpdateSetup={handleUpdateSetup}
          completeness={completeness}
          reconciliation={reconciliation}
          onNavigateToSection={(target) => setActiveSection(target)}
        />
      )}

      {activeSection === 'stock-count' && (
        <StockCountView
          items={currentMonthData.items}
          bills={periodBills}
          countDate={currentMonthData.setup.countDate}
          lastSavedAt={currentMonthData.setup.lastSavedAt}
          onUpdateCountDate={(countDate) => handleUpdateSetup({ countDate })}
          onSaveCount={handleSaveCount}
          onUpdateItem={handleUpdateItem}
          onAddItem={handleAddItem}
          onDeleteItem={handleDeleteItem}
        />
      )}

      {activeSection === 'bills' && (
        <BillsView
          bills={currentMonthData.bills}
          items={currentMonthData.items}
          periodStart={currentMonthData.setup.periodStart}
          onAddBills={handleAddBills}
          onDeleteBill={handleDeleteBill}
        />
      )}

      {activeSection === 'items-margins' && (
        <ItemsMarginsView
          metricsList={rankedMetrics}
          daysInPeriod={daysInPeriod}
          slowThresholdDays={settings.slowThresholdDays}
          onUpdateItem={handleUpdateItem}
        />
      )}

      {activeSection === 'slow-stock' && (
        <SlowStockView
          slowSummary={slowSummary}
          settings={settings}
          onChangeSlowAction={handleChangeSlowAction}
        />
      )}

      {activeSection === 'actions' && (
        <ActionsView
          actions={generatedActions}
          actionOverrides={currentMonthData.actionOverrides}
          onUpdateActionOverride={handleUpdateActionOverride}
          previousActions={currentMonthData.previousActions}
          onTogglePreviousAction={handleTogglePreviousAction}
        />
      )}

      {activeSection === 'monthly-report' && (
        <MonthlyReportView
          setup={currentMonthData.setup}
          dataMode={settings.dataMode}
          metricsList={rankedMetrics}
          slowSummary={slowSummary}
          actions={generatedActions}
          actionOverrides={currentMonthData.actionOverrides}
          settings={settings}
        />
      )}

      {activeSection === 'settings' && (
        <SettingsView
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onSwitchDataMode={handleSwitchDataMode}
          onResetDemoData={handleResetDemoData}
          allDatasets={activeAllDatasets}
        />
      )}
    </AppShell>
  );
}

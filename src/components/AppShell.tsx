import React from 'react';
import {
  Store,
  ClipboardList,
  Receipt,
  TrendingUp,
  AlertTriangle,
  CheckSquare,
  FileText,
  Settings,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import type { NavSection, ReviewMonthId } from '../types/inventory';

export interface NavItemConfig {
  id: NavSection;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItemConfig[] = [
  { id: 'shop-setup', label: 'Shop Setup', shortLabel: 'Setup', icon: Store },
  { id: 'stock-count', label: 'Stock Count', shortLabel: 'Count', icon: ClipboardList },
  { id: 'bills', label: 'Bills', shortLabel: 'Bills', icon: Receipt },
  { id: 'items-margins', label: 'Items & Margins', shortLabel: 'Margins', icon: TrendingUp },
  { id: 'slow-stock', label: 'Slow Stock', shortLabel: 'Slow', icon: AlertTriangle },
  { id: 'actions', label: 'Actions', shortLabel: 'Actions', icon: CheckSquare },
  { id: 'monthly-report', label: 'Monthly Report', shortLabel: 'Report', icon: FileText },
  { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
];

interface AppShellProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  reviewMonth: ReviewMonthId;
  onChangeReviewMonth: (month: ReviewMonthId) => void;
  availableMonths: { id: ReviewMonthId; label: string }[];
  shopName: string;
  dataMode: 'demo' | 'blank';
  children: React.ReactNode;
}

export function AppShell({
  activeSection,
  onSelectSection,
  reviewMonth,
  onChangeReviewMonth,
  availableMonths,
  shopName,
  dataMode,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#17211B] flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="no-print hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-[#DFE4DC] z-30">
        <div className="px-5 py-5 border-b border-[#E8ECE6]">
          <h1 className="font-display text-xl font-bold tracking-tight text-[#14532D] leading-snug">
            StockSaathi
          </h1>
          <p className="text-xs text-[#344C3B] mt-0.5 leading-snug">
            Know which stock earns, and which sits idle
          </p>
          <p className="text-xs text-[#526057] mt-1.5 truncate">
            {shopName.trim() ? shopName : 'New Store (Blank)'}
          </p>
        </div>

        <nav aria-label="Main sections" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[15px] font-medium text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D] ${
                  isActive
                    ? 'bg-[#14532D] text-white'
                    : 'text-[#313D35] hover:bg-[#EFF3ED] hover:text-[#14532D]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E8ECE6] bg-[#FAFBF9] text-xs text-[#526057] space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-[#17211B]">
            <ShieldCheck className="w-4 h-4 text-[#14532D] shrink-0" aria-hidden="true" />
            <span>{dataMode === 'demo' ? 'Demo data only' : 'Blank shop mode'}</span>
          </div>
          <p className="leading-relaxed">
            Estimates are labelled. Advice only — no payments, lending, or credit decisions.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar with Review Month Selector */}
        <header className="no-print sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#DFE4DC] px-3 sm:px-6 lg:px-8 py-1.5 lg:py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <div className="lg:hidden">
                <div className="font-display text-sm font-bold text-[#14532D] truncate">
                  StockSaathi
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-2 text-sm text-[#526057]">
                <span className="font-medium text-[#17211B]">
                  {NAV_ITEMS.find((i) => i.id === activeSection)?.label}
                </span>
                <span aria-hidden="true">·</span>
                <span>{dataMode === 'demo' ? 'Demo data (no real bank or customer data)' : 'Custom shop workspace'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label
                htmlFor="review-month-select"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#313D35] whitespace-nowrap"
              >
                <Calendar className="w-4 h-4 text-[#14532D]" aria-hidden="true" />
                <span className="hidden sm:inline">Review month</span>
              </label>
              <select
                id="review-month-select"
                aria-label="Review month"
                value={reviewMonth}
                onChange={(e) => onChangeReviewMonth(e.target.value as ReviewMonthId)}
                className="min-h-[44px] px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#CFD7CC] bg-white text-sm sm:text-[15px] font-medium text-[#17211B] focus:outline-none focus:ring-2 focus:ring-[#14532D]"
              >
                {availableMonths.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Active Section Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 lg:pb-10">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="no-print lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#DFE4DC] overflow-x-auto"
      >
        <div className="flex items-center px-1.5 py-1 min-w-max">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-h-[44px] min-w-[64px] flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#14532D] text-white'
                    : 'text-[#425046] hover:bg-[#EFF3ED]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

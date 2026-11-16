import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import type { ItemCategory, PurchaseBill, StockItem } from '../types/inventory';
import { validateClosingCount } from '../utils/calculations';
import { formatDate, formatTime } from '../utils/formatters';

interface StockCountViewProps {
  items: StockItem[];
  bills: PurchaseBill[];
  countDate: string;
  lastSavedAt: string | null;
  onUpdateCountDate: (date: string) => void;
  onSaveCount: () => void;
  onUpdateItem: (itemId: string, patch: Partial<StockItem>) => void;
  onAddItem: (item: Omit<StockItem, 'id'>) => void;
  onDeleteItem: (itemId: string) => void;
}

const CATEGORIES: ItemCategory[] = [
  'grocery',
  'dairy',
  'bakery',
  'beverages',
  'personal care',
  'snacks',
  'household',
  'other',
];

export function StockCountView({
  items,
  bills,
  countDate,
  lastSavedAt,
  onUpdateCountDate,
  onSaveCount,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
}: StockCountViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Add item form state
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ItemCategory>('grocery');
  const [newPackSize, setNewPackSize] = useState('1 unit');
  const [newCostPrice, setNewCostPrice] = useState('50');
  const [newSellingPrice, setNewSellingPrice] = useState('65');
  const [newOpening, setNewOpening] = useState('10');
  const [newClosing, setNewClosing] = useState('6');
  const [newPerishable, setNewPerishable] = useState(false);
  const [newDaysToExpiry, setNewDaysToExpiry] = useState('3');
  const [addError, setAddError] = useState<string | null>(null);

  const purchasesByItem = useMemo(() => {
    const map = new Map<string, { qty: number; billLines: number }>();
    for (const b of bills) {
      const prev = map.get(b.itemId) ?? { qty: 0, billLines: 0 };
      map.set(b.itemId, {
        qty: prev.qty + Math.max(0, b.quantity),
        billLines: prev.billLines + 1,
      });
    }
    return map;
  }, [bills]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (q && !item.name.toLowerCase().includes(q) && !item.packSize.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [items, searchQuery, categoryFilter]);

  const warningCount = useMemo(() => {
    return items.filter((item) => {
      const purchased = purchasesByItem.get(item.id)?.qty ?? 0;
      return validateClosingCount(item.openingCount, purchased, item.closingCount) !== null;
    }).length;
  }, [items, purchasesByItem]);

  const handleSave = () => {
    onSaveCount();
    setSaveFeedback(`Count saved for ${formatDate(countDate)}`);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    const cost = Number(newCostPrice);
    const sell = Number(newSellingPrice);
    const open = Number(newOpening);
    const close = newClosing.trim() === '' ? null : Number(newClosing);
    const expiry = newPerishable ? Number(newDaysToExpiry) : null;

    if (!trimmedName) {
      setAddError('Item name is required.');
      return;
    }
    if (!Number.isFinite(cost) || cost <= 0) {
      setAddError('Cost price must be greater than 0.');
      return;
    }
    if (!Number.isFinite(open) || open < 0) {
      setAddError('Opening count cannot be negative.');
      return;
    }
    if (close !== null && (!Number.isFinite(close) || close < 0)) {
      setAddError('Closing count cannot be negative.');
      return;
    }

    onAddItem({
      name: trimmedName,
      category: newCategory,
      packSize: newPackSize.trim() || '1 unit',
      costPrice: cost,
      sellingPrice: Number.isFinite(sell) && sell > 0 ? sell : null,
      openingCount: open,
      closingCount: close,
      perishable: newPerishable,
      daysToExpiry: expiry !== null && Number.isFinite(expiry) ? expiry : null,
      recordedSalesUnits: null,
    });

    setNewName('');
    setAddError(null);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-5">
      {/* Header & Count Date Controls */}
      <div className="bg-white border border-[#DFE4DC] rounded-xl p-4 sm:p-5 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-semibold text-[#17211B]">
            Physical stock count ({items.length} items)
          </h2>
          <p className="text-sm text-[#526057]">
            Enter closing counts from the shelf check. Counts above opening stock plus purchases are flagged automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="count-date-input" className="block text-xs font-medium text-[#425046] mb-1">
              Count date
            </label>
            <input
              id="count-date-input"
              type="date"
              value={countDate}
              onChange={(e) => onUpdateCountDate(e.target.value)}
              className="min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] bg-white text-[15px] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#14532D]"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-[#14532D] text-white text-[15px] font-medium hover:bg-[#166534] transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>Save count</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="min-h-[44px] px-4 py-2 rounded-lg border border-[#CFD7CC] bg-white text-[#17211B] text-[15px] font-medium hover:bg-[#F3F6F1] transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add item</span>
          </button>
        </div>
      </div>

      {/* Save status / warning banner */}
      {(saveFeedback || lastSavedAt || warningCount > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white border border-[#DFE4DC] text-sm">
          <div className="flex items-center gap-2 text-[#15803D]">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {saveFeedback
                ? `${saveFeedback}${lastSavedAt ? ` at ${formatTime(lastSavedAt)}` : ''}`
                : lastSavedAt
                  ? `Last saved: ${formatDate(countDate)} · ${formatTime(lastSavedAt)}`
                  : 'Count not yet saved'}
            </span>
          </div>

          {warningCount > 0 && (
            <div className="flex items-center gap-1.5 text-[#B45309] font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                {warningCount} {warningCount === 1 ? 'item has' : 'items have'} a count warning
              </span>
            </div>
          )}
        </div>
      )}

      {/* Optional Add Item Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateItem}
          className="bg-white border border-[#C6D8C8] rounded-xl p-4 sm:p-5 space-y-4"
        >
          <h3 className="font-display text-base font-semibold text-[#17211B]">
            Add new stock item
          </h3>
          {addError && (
            <p role="alert" className="text-sm text-[#B91C1C] font-medium">
              {addError}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label htmlFor="new-item-name" className="block text-xs font-medium text-[#425046] mb-1">
                Item name
              </label>
              <input
                id="new-item-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Honey 250 g"
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] text-[15px]"
              />
            </div>
            <div>
              <label htmlFor="new-item-category" className="block text-xs font-medium text-[#425046] mb-1">
                Category
              </label>
              <select
                id="new-item-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ItemCategory)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] text-[15px]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="new-item-pack" className="block text-xs font-medium text-[#425046] mb-1">
                Pack size & unit
              </label>
              <input
                id="new-item-pack"
                type="text"
                value={newPackSize}
                onChange={(e) => setNewPackSize(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] text-[15px]"
              />
            </div>
            <div>
              <label htmlFor="new-item-cost" className="block text-xs font-medium text-[#425046] mb-1">
                Cost price (Rs)
              </label>
              <input
                id="new-item-cost"
                type="number"
                min="0"
                step="0.5"
                value={newCostPrice}
                onChange={(e) => setNewCostPrice(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] text-[15px] tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="new-item-sell" className="block text-xs font-medium text-[#425046] mb-1">
                MRP / Shelf price (Rs)
              </label>
              <input
                id="new-item-sell"
                type="number"
                min="0"
                step="0.5"
                value={newSellingPrice}
                onChange={(e) => setNewSellingPrice(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] text-[15px] tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="new-item-open" className="block text-xs font-medium text-[#425046] mb-1">
                Opening count
              </label>
              <input
                id="new-item-open"
                type="number"
                min="0"
                value={newOpening}
                onChange={(e) => setNewOpening(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] text-[15px] tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="new-item-close" className="block text-xs font-medium text-[#425046] mb-1">
                Closing count
              </label>
              <input
                id="new-item-close"
                type="number"
                min="0"
                value={newClosing}
                onChange={(e) => setNewClosing(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] text-[15px] tabular-nums"
              />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2 min-h-[44px] cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={newPerishable}
                  onChange={(e) => setNewPerishable(e.target.checked)}
                  className="w-4 h-4 accent-[#14532D]"
                />
                <span>Perishable</span>
              </label>
              {newPerishable && (
                <input
                  type="number"
                  min="0"
                  aria-label="New item days to expiry"
                  value={newDaysToExpiry}
                  onChange={(e) => setNewDaysToExpiry(e.target.value)}
                  placeholder="Days"
                  className="w-20 min-h-[44px] px-2.5 py-2 rounded-lg border border-[#CFD7CC] text-[15px] tabular-nums"
                />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="min-h-[44px] px-4 py-2 rounded-lg border border-[#CFD7CC] text-sm font-medium text-[#425046]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-4 py-2 rounded-lg bg-[#14532D] text-white text-sm font-medium hover:bg-[#166534]"
            >
              Save new item
            </button>
          </div>
        </form>
      )}

      {/* Search & Category Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="w-4 h-4 text-[#526057] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name or pack size..."
            aria-label="Search stock items"
            className="w-full min-h-[44px] pl-10 pr-3.5 py-2 rounded-lg border border-[#CFD7CC] bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-[#14532D]"
          />
        </div>

        <select
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] bg-white text-[15px] text-[#17211B] capitalize"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Stock Count Table */}
      {items.length === 0 ? (
        <div className="bg-white border border-[#DFE4DC] rounded-xl p-8 text-center space-y-3">
          <p className="text-[15px] text-[#526057]">
            No items in Stock Count yet. Add your first item or switch to Demo data in Settings.
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-[#14532D] text-white text-[15px] font-medium"
          >
            Add first item
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#DFE4DC] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1040px]">
              <thead>
                <tr className="bg-[#F3F6F1] border-b border-[#DFE4DC] text-xs font-semibold text-[#425046]">
                  <th className="py-3 px-4">Item name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Pack size</th>
                  <th className="py-3 px-3 text-right">Opening count</th>
                  <th className="py-3 px-3 text-right">Purchased (from Bills)</th>
                  <th className="py-3 px-3 text-right">Expected closing</th>
                  <th className="py-3 px-3 text-right">Closing count</th>
                  <th className="py-3 px-3">Perishable</th>
                  <th className="py-3 px-3">Days to expiry</th>
                  <th className="py-3 px-3 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF1EB] text-[15px]">
                {filteredItems.map((item) => {
                  const purchaseInfo = purchasesByItem.get(item.id) ?? { qty: 0, billLines: 0 };
                  const purchased = purchaseInfo.qty;
                  const warning = validateClosingCount(
                    item.openingCount,
                    purchased,
                    item.closingCount
                  );
                  const hasRecordedSales =
                    item.recordedSalesUnits !== null && item.recordedSalesUnits >= 0;
                  const expectedClosing = hasRecordedSales
                    ? item.openingCount + purchased - item.recordedSalesUnits!
                    : item.closingCount;

                  return (
                    <tr key={item.id} className="hover:bg-[#FAFBF9] align-top">
                      <td className="py-3 px-4 font-medium text-[#17211B]">
                        <div>{item.name}</div>
                        {warning && (
                          <div
                            role="alert"
                            className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{warning}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-sm text-[#425046] capitalize">
                        <select
                          aria-label={`Category for ${item.name}`}
                          value={item.category}
                          onChange={(e) =>
                            onUpdateItem(item.id, { category: e.target.value as ItemCategory })
                          }
                          className="min-h-[44px] px-2 py-1 rounded-md border border-[#DFE4DC] bg-white text-sm capitalize"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-sm text-[#425046] whitespace-nowrap pt-4">
                        {item.packSize}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          aria-label={`Opening count for ${item.name}`}
                          value={item.openingCount}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                            onUpdateItem(item.id, {
                              openingCount: Number.isFinite(val) ? Math.max(0, val) : 0,
                            });
                          }}
                          className="w-20 min-h-[44px] px-2.5 py-1.5 rounded-md border border-[#CFD7CC] text-right font-mono tabular-nums"
                        />
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#313D35] pt-3">
                        <div className="font-semibold">{purchased}</div>
                        <div className="font-sans text-[11px] text-[#526057]">
                          {purchaseInfo.billLines} {purchaseInfo.billLines === 1 ? 'bill' : 'bills'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#425046] pt-3">
                        <div>{expectedClosing ?? '—'}</div>
                        <div className="font-sans text-[11px] text-[#526057]">
                          {hasRecordedSales ? 'Recorded' : 'Estimate'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          aria-label={`Closing count for ${item.name}`}
                          value={item.closingCount === null ? '' : item.closingCount}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              onUpdateItem(item.id, { closingCount: null });
                              return;
                            }
                            const val = Number(raw);
                            if (Number.isFinite(val)) {
                              onUpdateItem(item.id, { closingCount: val });
                            }
                          }}
                          className={`w-24 min-h-[44px] px-2.5 py-1.5 rounded-md border text-right font-mono tabular-nums ${
                            warning
                              ? 'border-[#B91C1C] bg-[#FEF2F2] text-[#B91C1C]'
                              : 'border-[#CFD7CC] bg-white'
                          }`}
                        />
                      </td>
                      <td className="py-3 px-3">
                        <label className="inline-flex items-center gap-2 min-h-[44px] cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            aria-label={`Perishable toggle for ${item.name}`}
                            checked={item.perishable}
                            onChange={(e) =>
                              onUpdateItem(item.id, {
                                perishable: e.target.checked,
                                daysToExpiry: e.target.checked ? (item.daysToExpiry ?? 3) : null,
                              })
                            }
                            className="w-4 h-4 accent-[#14532D]"
                          />
                          <span>{item.perishable ? 'Yes' : 'No'}</span>
                        </label>
                      </td>
                      <td className="py-3 px-3">
                        {item.perishable ? (
                          <input
                            type="number"
                            min="0"
                            aria-label={`Days to expiry for ${item.name}`}
                            value={item.daysToExpiry ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : Number(e.target.value);
                              onUpdateItem(item.id, {
                                daysToExpiry: val !== null && Number.isFinite(val) ? Math.max(0, val) : null,
                              });
                            }}
                            className="w-20 min-h-[44px] px-2.5 py-1.5 rounded-md border border-[#CFD7CC] text-right font-mono tabular-nums"
                          />
                        ) : (
                          <span className="text-sm text-[#7A877E] inline-block pt-2">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-[#6B776F] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
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

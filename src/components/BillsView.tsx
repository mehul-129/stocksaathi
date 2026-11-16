import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardPaste,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import type { PurchaseBill, StockItem } from '../types/inventory';
import {
  parseBillImportText,
  SAMPLE_BILL_CSV,
  type ParsedBillRow,
} from '../utils/csvParser';
import { formatDate, formatRs } from '../utils/formatters';

interface BillsViewProps {
  bills: PurchaseBill[];
  items: StockItem[];
  periodStart: string;
  onAddBills: (newBills: Omit<PurchaseBill, 'id'>[]) => void;
  onDeleteBill: (billId: string) => void;
}

export function BillsView({
  bills,
  items,
  periodStart,
  onAddBills,
  onDeleteBill,
}: BillsViewProps) {
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [importMode, setImportMode] = useState<'none' | 'csv' | 'paste' | 'add'>('none');
  const [importText, setImportText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ParsedBillRow[] | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Manual bill add state
  const [billDate, setBillDate] = useState(periodStart || '2026-09-15');
  const [supplier, setSupplier] = useState('Local distributor, Greater Noida');
  const [billNumber, setBillNumber] = useState('');
  const [itemId, setItemId] = useState(items[0]?.id ?? '');
  const [quantity, setQuantity] = useState('10');
  const [costPerUnit, setCostPerUnit] = useState('50');
  const [gstIncluded, setGstIncluded] = useState(true);
  const [addError, setAddError] = useState<string | null>(null);

  const itemsMap = useMemo(() => {
    const map = new Map<string, StockItem>();
    for (const item of items) map.set(item.id, item);
    return map;
  }, [items]);

  // Per-supplier summary: total purchases and number of distinct bills (or bill lines)
  const supplierSummary = useMemo(() => {
    const summaryMap = new Map<
      string,
      { supplier: string; totalAmount: number; lineCount: number; billNumbers: Set<string> }
    >();

    for (const bill of bills) {
      const existing = summaryMap.get(bill.supplier) ?? {
        supplier: bill.supplier,
        totalAmount: 0,
        lineCount: 0,
        billNumbers: new Set<string>(),
      };
      existing.totalAmount += bill.quantity * bill.costPerUnit;
      existing.lineCount += 1;
      if (bill.billNumber.trim()) {
        existing.billNumbers.add(bill.billNumber.trim());
      } else {
        existing.billNumbers.add(bill.id);
      }
      summaryMap.set(bill.supplier, existing);
    }

    return Array.from(summaryMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [bills]);

  const filteredBills = useMemo(() => {
    const list =
      supplierFilter === 'all'
        ? bills
        : bills.filter((b) => b.supplier === supplierFilter);
    return [...list].sort((a, b) => b.billDate.localeCompare(a.billDate));
  }, [bills, supplierFilter]);

  const handleDownloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_BILL_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-purchase-bills.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setImportText(text);
    setParsedPreview(parseBillImportText(text, items));
  };

  const handlePreviewText = () => {
    setParsedPreview(parseBillImportText(importText, items));
  };

  const handleConfirmImport = () => {
    if (!parsedPreview) return;
    const validBills = parsedPreview
      .filter((row): row is ParsedBillRow & { bill: Omit<PurchaseBill, 'id'> } => row.valid && !!row.bill)
      .map((row) => row.bill);

    if (validBills.length === 0) return;
    onAddBills(validBills);
    setImportNotice(`Imported ${validBills.length} bill ${validBills.length === 1 ? 'row' : 'rows'}.`);
    setParsedPreview(null);
    setImportText('');
    setImportMode('none');
  };

  const handleAddSingleBill = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = itemsMap.get(itemId) ?? items[0];
    if (!targetItem) {
      setAddError('Add at least one item in Stock Count before logging bills.');
      return;
    }
    const qty = Number(quantity);
    const cost = Number(costPerUnit);
    if (!billDate) {
      setAddError('Please select a bill date.');
      return;
    }
    if (!supplier.trim()) {
      setAddError('Supplier name is required.');
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setAddError('Quantity must be greater than 0.');
      return;
    }
    if (!Number.isFinite(cost) || cost <= 0) {
      setAddError('Cost price per unit must be greater than 0.');
      return;
    }

    onAddBills([
      {
        billDate,
        supplier: supplier.trim(),
        billNumber: billNumber.trim(),
        itemId: targetItem.id,
        quantity: qty,
        costPerUnit: cost,
        gstIncluded,
      },
    ]);
    setBillNumber('');
    setAddError(null);
    setImportNotice(`Added bill line for ${targetItem.name}.`);
    setImportMode('none');
  };

  const validPreviewCount = parsedPreview?.filter((r) => r.valid).length ?? 0;
  const errorPreviewCount = parsedPreview?.filter((r) => !r.valid).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="bg-white border border-[#DFE4DC] rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-[#17211B]">
            Purchase bills ({bills.length} lines)
          </h2>
          <p className="text-sm text-[#526057]">
            Log distributor bills manually, upload CSV, or paste rows straight from Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setImportMode(importMode === 'add' ? 'none' : 'add');
              setImportNotice(null);
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[#14532D] text-white text-sm font-medium hover:bg-[#166534] flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add bill</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setImportMode(importMode === 'csv' ? 'none' : 'csv');
              setParsedPreview(null);
              setImportText('');
              setImportNotice(null);
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] bg-white text-[#17211B] text-sm font-medium hover:bg-[#F3F6F1] flex items-center gap-2 whitespace-nowrap"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>Import from CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setImportMode(importMode === 'paste' ? 'none' : 'paste');
              setParsedPreview(null);
              setImportText('');
              setImportNotice(null);
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] bg-white text-[#17211B] text-sm font-medium hover:bg-[#F3F6F1] flex items-center gap-2 whitespace-nowrap"
          >
            <ClipboardPaste className="w-4 h-4" aria-hidden="true" />
            <span>Paste from table</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSampleCsv}
            className="min-h-[44px] px-3.5 py-2 rounded-lg border border-[#CFD7CC] bg-white text-[#14532D] text-sm font-medium hover:bg-[#EEF4EE] flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Sample CSV template</span>
          </button>
        </div>
      </div>

      {importNotice && (
        <div
          role="status"
          className="px-4 py-3 rounded-xl bg-[#EEF4EE] border border-[#C6D8C8] text-sm font-medium text-[#14532D] flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{importNotice}</span>
        </div>
      )}

      {/* Manual Add Bill Panel */}
      {importMode === 'add' && (
        <form
          onSubmit={handleAddSingleBill}
          className="bg-white border border-[#C6D8C8] rounded-xl p-4 sm:p-5 space-y-4"
        >
          <h3 className="font-display text-base font-semibold text-[#17211B]">
            Add purchase bill line
          </h3>
          {addError && (
            <p role="alert" className="text-sm text-[#B91C1C] font-medium">
              {addError}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label htmlFor="bill-date-input" className="block text-xs font-medium text-[#425046] mb-1">
                Bill date
              </label>
              <input
                id="bill-date-input"
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] text-[15px] tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="bill-supplier-input" className="block text-xs font-medium text-[#425046] mb-1">
                Supplier name
              </label>
              <input
                id="bill-supplier-input"
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] text-[15px]"
              />
            </div>
            <div>
              <label htmlFor="bill-number-input" className="block text-xs font-medium text-[#425046] mb-1">
                Bill number (optional)
              </label>
              <input
                id="bill-number-input"
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="e.g. LD-970"
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] text-[15px]"
              />
            </div>
            <div>
              <label htmlFor="bill-item-select" className="block text-xs font-medium text-[#425046] mb-1">
                Item
              </label>
              <select
                id="bill-item-select"
                value={itemId || items[0]?.id || ''}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setItemId(nextId);
                  const found = itemsMap.get(nextId);
                  if (found) setCostPerUnit(String(found.costPrice));
                }}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] text-[15px]"
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="bill-qty-input" className="block text-xs font-medium text-[#425046] mb-1">
                Quantity
              </label>
              <input
                id="bill-qty-input"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] text-[15px] tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="bill-cost-input" className="block text-xs font-medium text-[#425046] mb-1">
                Cost price per unit (Rs)
              </label>
              <input
                id="bill-cost-input"
                type="number"
                min="0"
                step="0.5"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] text-[15px] tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="bill-gst-select" className="block text-xs font-medium text-[#425046] mb-1">
                GST included
              </label>
              <select
                id="bill-gst-select"
                value={gstIncluded ? 'yes' : 'no'}
                onChange={(e) => setGstIncluded(e.target.value === 'yes')}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#CFD7CC] text-[15px]"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setImportMode('none')}
              className="min-h-[44px] px-4 py-2 rounded-lg border border-[#CFD7CC] text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-4 py-2 rounded-lg bg-[#14532D] text-white text-sm font-medium hover:bg-[#166534]"
            >
              Save bill line
            </button>
          </div>
        </form>
      )}

      {/* CSV or Table Paste Panel */}
      {(importMode === 'csv' || importMode === 'paste') && (
        <section className="bg-white border border-[#C6D8C8] rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#14532D]" aria-hidden="true" />
              <h3 className="font-display text-base font-semibold text-[#17211B]">
                {importMode === 'csv' ? 'Import bills from CSV' : 'Paste rows from Excel or Google Sheets'}
              </h3>
            </div>
            <span className="text-xs text-[#526057]">
              Columns: date, supplier, item, quantity, cost_per_unit
            </span>
          </div>

          {importMode === 'csv' && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="min-h-[44px] px-4 py-2 rounded-lg border border-[#CFD7CC] bg-[#FAFBF9] hover:bg-[#EFF3ED] text-sm font-medium cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-4 h-4" aria-hidden="true" />
                <span>Choose CSV file</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              <span className="text-sm text-[#526057]">or paste CSV text below to preview</span>
            </div>
          )}

          <div>
            <label htmlFor="bill-import-textarea" className="block text-xs font-medium text-[#425046] mb-1">
              {importMode === 'csv'
                ? 'CSV contents (YYYY-MM-DD, supplier, exact item name, quantity, cost_per_unit)'
                : 'Paste tab-separated or comma-separated rows'}
            </label>
            <textarea
              id="bill-import-textarea"
              rows={5}
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setParsedPreview(null);
              }}
              placeholder={SAMPLE_BILL_CSV}
              className="w-full p-3 rounded-lg border border-[#CFD7CC] font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#14532D]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setImportText(SAMPLE_BILL_CSV);
                setParsedPreview(parseBillImportText(SAMPLE_BILL_CSV, items));
              }}
              className="min-h-[44px] px-3 py-2 text-sm font-medium text-[#14532D] hover:underline"
            >
              Load sample rows
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setImportMode('none')}
                className="min-h-[44px] px-4 py-2 rounded-lg border border-[#CFD7CC] text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePreviewText}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-[#14532D] text-white text-sm font-medium hover:bg-[#166534]"
              >
                Preview rows
              </button>
            </div>
          </div>

          {parsedPreview && (
            <div className="border-t border-[#EDF1EB] pt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-[#17211B]">
                  Preview: {validPreviewCount} valid, {errorPreviewCount} with errors
                </span>
                {validPreviewCount > 0 && (
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="min-h-[44px] px-4 py-2 rounded-lg bg-[#15803D] text-white text-sm font-medium hover:bg-[#166534]"
                  >
                    Import {validPreviewCount} valid {validPreviewCount === 1 ? 'row' : 'rows'}
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-[#DFE4DC] rounded-lg">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#F3F6F1] border-b border-[#DFE4DC] text-xs font-semibold text-[#425046]">
                      <th className="py-2 px-3">Row</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF1EB]">
                    {parsedPreview.map((row) => (
                      <tr key={row.rowNumber} className={row.valid ? 'bg-white' : 'bg-[#FEF2F2]'}>
                        <td className="py-2 px-3 font-mono tabular-nums">{row.rowNumber}</td>
                        <td className="py-2 px-3">
                          {row.valid ? (
                            <span className="inline-flex items-center gap-1 text-[#15803D] font-medium">
                              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                              Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#B91C1C] font-medium">
                              <AlertCircle className="w-4 h-4" aria-hidden="true" />
                              Error
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {row.valid && row.bill ? (
                            <span>
                              {formatDate(row.bill.billDate)} · {row.bill.supplier} · {row.matchedItemName} ·{' '}
                              <span className="font-mono tabular-nums">
                                {row.bill.quantity} × {formatRs(row.bill.costPerUnit)}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[#B91C1C]">{row.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Per-Supplier Summary */}
      <section aria-labelledby="supplier-summary-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="supplier-summary-heading" className="font-display text-lg font-semibold text-[#17211B]">
            Supplier summary
          </h3>
          {supplierFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setSupplierFilter('all')}
              className="text-sm font-medium text-[#14532D] hover:underline"
            >
              Show all suppliers
            </button>
          )}
        </div>

        {supplierSummary.length === 0 ? (
          <div className="bg-white border border-[#DFE4DC] rounded-xl p-6 text-sm text-[#526057]">
            No purchase bills recorded for this period yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplierSummary.map((s) => {
              const isSelected = supplierFilter === s.supplier;
              return (
                <button
                  key={s.supplier}
                  type="button"
                  onClick={() => setSupplierFilter(isSelected ? 'all' : s.supplier)}
                  className={`text-left p-4 rounded-xl border transition-colors ${
                    isSelected
                      ? 'bg-[#EEF4EE] border-[#14532D]'
                      : 'bg-white border-[#DFE4DC] hover:bg-[#FAFBF9]'
                  }`}
                >
                  <div className="font-semibold text-[#17211B] truncate">{s.supplier}</div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="font-mono tabular-nums text-lg font-bold text-[#14532D]">
                      {formatRs(s.totalAmount)}
                    </span>
                    <span className="text-sm text-[#526057] tabular-nums">
                      {s.billNumbers.size} {s.billNumbers.size === 1 ? 'bill' : 'bills'} · {s.lineCount} lines
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Bills Table */}
      <section aria-label="Purchase bill rows" className="bg-white border border-[#DFE4DC] rounded-xl overflow-hidden">
        {filteredBills.length === 0 ? (
          <div className="p-8 text-center text-[15px] text-[#526057]">
            No bills match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="bg-[#F3F6F1] border-b border-[#DFE4DC] text-xs font-semibold text-[#425046]">
                  <th className="py-3 px-4">Bill date</th>
                  <th className="py-3 px-3">Supplier</th>
                  <th className="py-3 px-3">Bill no.</th>
                  <th className="py-3 px-3">Item</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-right">Cost / unit</th>
                  <th className="py-3 px-3 text-right">Line total</th>
                  <th className="py-3 px-3">GST incl.</th>
                  <th className="py-3 px-3 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF1EB] text-[15px]">
                {filteredBills.map((bill) => {
                  const item = itemsMap.get(bill.itemId);
                  return (
                    <tr key={bill.id} className="hover:bg-[#FAFBF9]">
                      <td className="py-2.5 px-4 whitespace-nowrap text-sm tabular-nums text-[#313D35]">
                        {formatDate(bill.billDate)}
                      </td>
                      <td className="py-2.5 px-3 text-sm text-[#313D35]">{bill.supplier}</td>
                      <td className="py-2.5 px-3 font-mono text-xs text-[#526057]">
                        {bill.billNumber || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#17211B]">
                        {item ? item.name : 'Unknown item'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {bill.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        {formatRs(bill.costPerUnit, bill.costPerUnit % 1 !== 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium">
                        {formatRs(bill.quantity * bill.costPerUnit)}
                      </td>
                      <td className="py-2.5 px-3 text-sm text-[#425046]">
                        {bill.gstIncluded ? 'Yes' : 'No'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteBill(bill.id)}
                          aria-label={`Remove bill ${bill.billNumber || bill.id}`}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-[#6B776F] hover:text-[#B91C1C] hover:bg-[#FEF2F2]"
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
        )}
      </section>
    </div>
  );
}

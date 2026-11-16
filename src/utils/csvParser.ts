/**
 * ============================================================================
 * CSV & TABLE PASTE PARSER SECTION
 * Validates purchase bill rows (date, supplier, item, quantity, cost_per_unit)
 * before importing into React state.
 * ============================================================================
 */

import type { PurchaseBill, StockItem } from '../types/inventory';

export interface ParsedBillRow {
  rowNumber: number;
  rawLine: string;
  valid: boolean;
  error: string | null;
  bill?: Omit<PurchaseBill, 'id'>;
  matchedItemName?: string;
}

export const SAMPLE_BILL_CSV = [
  'date,supplier,item,quantity,cost_per_unit',
  '2026-09-12,"Local distributor, Greater Noida",Milk 1 L,40,54',
  '2026-09-14,Brand wholesaler,Atta 5 kg,12,215',
  '2026-09-18,"Local distributor, Greater Noida",Maggi Noodles 70 g,48,12',
].join('\n');

/**
 * Splits a single CSV or TSV line, respecting double-quoted values.
 */
function splitLine(line: string, delimiter: ',' | '\t'): string[] {
  if (delimiter === '\t') {
    return line.split('\t').map((cell) => cell.trim());
  }
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses CSV or pasted Excel/Sheets tab-separated rows into validated bill previews.
 */
export function parseBillImportText(
  rawText: string,
  items: StockItem[]
): ParsedBillRow[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const firstLineLower = lines[0].toLowerCase();
  const hasHeader =
    firstLineLower.includes('date') &&
    firstLineLower.includes('supplier') &&
    firstLineLower.includes('item');

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const itemsByNormalizedName = new Map<string, StockItem>();
  for (const item of items) {
    itemsByNormalizedName.set(item.name.trim().toLowerCase(), item);
  }

  return dataLines.map((line, index) => {
    const rowNumber = hasHeader ? index + 2 : index + 1;
    const delimiter: ',' | '\t' = line.includes('\t') ? '\t' : ',';
    const cols = splitLine(line, delimiter);

    if (cols.length < 5) {
      return {
        rowNumber,
        rawLine: line,
        valid: false,
        error: `Expected 5 columns (date, supplier, item, quantity, cost_per_unit); found ${cols.length}.`,
      };
    }

    const [billDate, supplier, itemName, qtyStr, costStr, billNumberMaybe, gstMaybe] = cols;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(billDate)) {
      return {
        rowNumber,
        rawLine: line,
        valid: false,
        error: `Invalid date "${billDate}". Use YYYY-MM-DD (for example 2026-09-12).`,
      };
    }

    if (!supplier) {
      return {
        rowNumber,
        rawLine: line,
        valid: false,
        error: 'Supplier name is missing.',
      };
    }

    const matchedItem = itemsByNormalizedName.get(itemName.trim().toLowerCase());
    if (!matchedItem) {
      return {
        rowNumber,
        rawLine: line,
        valid: false,
        error: `Item "${itemName}" does not match an item in Stock Count.`,
      };
    }

    const quantity = Number(qtyStr);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return {
        rowNumber,
        rawLine: line,
        valid: false,
        error: `Invalid quantity "${qtyStr}". Must be greater than 0.`,
      };
    }

    const costPerUnit = Number(costStr);
    if (!Number.isFinite(costPerUnit) || costPerUnit <= 0) {
      return {
        rowNumber,
        rawLine: line,
        valid: false,
        error: `Invalid cost_per_unit "${costStr}". Must be greater than 0.`,
      };
    }

    const gstIncluded = gstMaybe ? gstMaybe.toLowerCase() !== 'no' : true;

    return {
      rowNumber,
      rawLine: line,
      valid: true,
      error: null,
      matchedItemName: matchedItem.name,
      bill: {
        billDate,
        supplier,
        billNumber: billNumberMaybe || '',
        itemId: matchedItem.id,
        quantity,
        costPerUnit,
        gstIncluded,
      },
    };
  });
}

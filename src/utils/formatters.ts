/**
 * Formatting helpers following the project conventions:
 * - Indian Rupee grouping: Rs 1,20,000
 * - Percentages to 1 decimal place: 18.5%
 * - Ratios to 2 decimal places: 2.40
 * - Dates as 16 Nov 2026
 * - Times as 7:15 PM
 */

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Formats a rupee amount with Indian numbering grouping (e.g., Rs 1,20,000).
 */
export function formatRs(value: number, showDecimals = false): string {
  if (!Number.isFinite(value)) return 'Rs 0';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(showDecimals ? abs : Math.round(abs));
  return `${sign}Rs ${formatted}`;
}

/**
 * Formats a percentage to one decimal place (e.g., 18.5%).
 */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

/**
 * Formats a stock return (GMROI) ratio to two decimal places (e.g., 2.40).
 */
export function formatRatio(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return value.toFixed(2);
}

/**
 * Formats a YYYY-MM-DD date string into "16 Nov 2026".
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateStr;
  const [year, month, day] = parts;
  const monthLabel = MONTHS_SHORT[month - 1];
  if (!monthLabel) return dateStr;
  return `${day} ${monthLabel} ${year}`;
}

/**
 * Formats an ISO timestamp or Date object as "7:15 PM".
 */
export function formatTime(isoOrDate: string | Date | null): string {
  if (!isoOrDate) return '—';
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) return '—';
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const paddedMins = String(minutes).padStart(2, '0');
  return `${hours}:${paddedMins} ${suffix}`;
}

/**
 * Calculates inclusive number of days between two YYYY-MM-DD dates.
 */
export function calculatePeriodDays(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 30;
  const start = new Date(`${startStr}T00:00:00Z`);
  const end = new Date(`${endStr}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 30;
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

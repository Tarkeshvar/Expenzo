import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { CURRENCIES } from '../constants/theme';

export function formatCurrency(amount: number, currencyCode: string = 'INR'): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || '₹';

  if (Math.abs(amount) >= 10000000) {
    return `${symbol}${(amount / 10000000).toFixed(2)}Cr`;
  }
  if (Math.abs(amount) >= 100000) {
    return `${symbol}${(amount / 100000).toFixed(2)}L`;
  }
  if (Math.abs(amount) >= 1000) {
    return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd MMM yyyy');
  } catch {
    return dateString;
  }
}

export function formatDateShort(dateString: string): string {
  try {
    return format(parseISO(dateString), 'dd MMM');
  } catch {
    return dateString;
  }
}

export function formatMonth(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMMM yyyy');
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
}

export function getMonthKey(date: Date = new Date()): string {
  return format(date, 'yyyy-MM');
}

export function groupTransactionsByDate(transactions: any[]) {
  const groups: Record<string, any[]> = {};
  for (const t of transactions) {
    const key = formatDate(t.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  return Object.entries(groups).map(([date, items]) => ({ date, items }));
}

export function getPercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, (value / total) * 100);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(0)}%`;
}

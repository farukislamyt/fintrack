import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CurrencyCode } from './types';
import { CURRENCY_SYMBOLS } from './store';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency?: CurrencyCode): string {
  const cur = currency || 'USD';
  const sym = CURRENCY_SYMBOLS[cur] || '$';
  const num = Math.abs(parseFloat(String(amount))) || 0;
  const absStr = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const prefix = amount < 0 ? '-' : '';
  return `${prefix}${sym}${absStr}`;
}

export function formatDate(dateStr: string, fmt: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' = 'MM/DD/YYYY'): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const y = d.getFullYear();
  if (fmt === 'DD/MM/YYYY') return `${day}/${mo}/${y}`;
  if (fmt === 'YYYY-MM-DD') return `${y}-${mo}-${day}`;
  return `${mo}/${day}/${y}`;
}

export function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tgt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((tgt.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  if (diff < 0 && diff > -7) return `${Math.abs(diff)} days ago`;
  return formatDate(dateStr);
}

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00');
}

export function summarize<T extends { type: string; amount: number }>(items: T[]): { income: number; expense: number; balance: number; savingsRate: number } {
  let income = 0;
  let expense = 0;
  for (const t of items) {
    if (t.type === 'income') income += t.amount;
    else if (t.type === 'expense') expense += t.amount;
  }
  const balance = income - expense;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;
  return { income, expense, balance, savingsRate };
}

export function filterByPeriod<T extends { date: string }>(items: T[], period: string): T[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return items.filter(t => {
    const d = parseDate(t.date);
    if (period === 'week') {
      const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      return d >= cutoff;
    }
    if (period === 'month') return d.getMonth() === month && d.getFullYear() === year;
    if (period === 'year') return d.getFullYear() === year;
    return true;
  });
}

export function groupByCategory<T extends { type: string; amount: number; category: string }>(
  items: T[], type: 'income' | 'expense' = 'expense'
): { category: string; amount: number }[] {
  const groups: Record<string, number> = {};
  for (const t of items) {
    if (t.type !== type) continue;
    groups[t.category] = (groups[t.category] || 0) + t.amount;
  }
  return Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([category, amount]) => ({ category, amount }));
}

export function groupByMonth<T extends { type: string; amount: number; date: string }>(
  items: T[], year: number
): { month: number; income: number; expense: number }[] {
  const months = Array.from({ length: 12 }, (_, i) => ({ month: i, income: 0, expense: 0 }));
  for (const t of items) {
    const d = parseDate(t.date);
    if (d.getFullYear() !== year) continue;
    const m = d.getMonth();
    if (t.type === 'income') months[m].income += t.amount;
    else months[m].expense += t.amount;
  }
  return months;
}

export function toCSV<T extends Record<string, unknown>>(items: T[], headers: string[], keys: string[]): string {
  const csvEsc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = items.map(t => keys.map(k => csvEsc(t[k])).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function abbrevNumber(num: number): string {
  const abs = Math.abs(num);
  if (abs >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (abs >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (abs >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return String(num);
}

export function daysUntil(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tgt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((tgt.getTime() - today.getTime()) / 86400000);
}

// ── Loan Calculations ──────────────────────────────────────

export function calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) return principal / termMonths;
  const r = annualRate / 100 / 12;
  return principal * (r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

export function calculateAmortizationSchedule(principal: number, annualRate: number, termMonths: number, startDate: string): { month: number; date: string; payment: number; principal: number; interest: number; balance: number }[] {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  const schedule: { month: number; date: string; payment: number; principal: number; interest: number; balance: number }[] = [];
  let balance = principal;
  const start = new Date(startDate + 'T12:00:00');

  for (let i = 1; i <= termMonths; i++) {
    const interest = balance * monthlyRate;
    const principalPortion = monthlyPayment - interest;
    balance = Math.max(balance - principalPortion, 0);
    const payDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
    schedule.push({
      month: i,
      date: `${payDate.getFullYear()}-${String(payDate.getMonth() + 1).padStart(2, '0')}-${String(payDate.getDate()).padStart(2, '0')}`,
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principalPortion * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }
  return schedule;
}

export function calculateLoanProgress(loan: { principal: number; annualRate: number; termMonths: number; startDate: string }, payments: { amount: number }[]): { paidTotal: number; remaining: number; progress: number; totalInterest: number } {
  const monthlyPayment = calculateMonthlyPayment(loan.principal, loan.annualRate, loan.termMonths);
  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(loan.principal - paidTotal, 0);
  const progress = loan.principal > 0 ? Math.min((paidTotal / loan.principal) * 100, 100) : 0;
  const schedule = calculateAmortizationSchedule(loan.principal, loan.annualRate, loan.termMonths, loan.startDate);
  const totalInterest = schedule.reduce((sum, s) => sum + s.interest, 0);
  return { paidTotal, remaining, progress, totalInterest };
}

export function monthsPassedSince(dateStr: string): number {
  const start = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
}

export function formatPercentage(val: number, decimals = 1): string {
  return `${val.toFixed(decimals)}%`;
}

'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Hash,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFinTrackStore } from '@/lib/store';
import {
  formatCurrency,
  summarize,
  groupByMonth,
  groupByCategory,
  MONTHS,
  MONTHS_FULL,
  abbrevNumber,
  currentYear,
  parseDate,
} from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';

export default function ReportsPage() {
  const { transactions, settings } = useFinTrackStore();

  // Available years
  const years = useMemo(() => {
    const ySet = new Set<number>();
    transactions.forEach((t) => {
      if (t.date) ySet.add(parseDate(t.date).getFullYear());
    });
    const sorted = Array.from(ySet).sort((a, b) => b - a);
    if (sorted.length === 0) sorted.push(currentYear());
    return sorted;
  }, [transactions]);

  const [selectedYear, setSelectedYear] = useState<number>(years[0] || currentYear());

  // Year transactions
  const yearTxns = useMemo(() => {
    return transactions.filter((t) => {
      if (!t.date) return false;
      return parseDate(t.date).getFullYear() === selectedYear;
    });
  }, [transactions, selectedYear]);

  const yearSummary = useMemo(() => summarize(yearTxns), [yearTxns]);

  // Monthly breakdown
  const monthlyData = useMemo(() => {
    return groupByMonth(transactions, selectedYear).map((m) => ({
      month: MONTHS[m.month],
      Income: m.income,
      Expense: m.expense,
      Net: m.income - m.expense,
    }));
  }, [transactions, selectedYear]);

  // Trend data (cumulative)
  const trendData = useMemo(() => {
    const months = groupByMonth(transactions, selectedYear);
    let cumIncome = 0;
    let cumExpense = 0;
    let cumNet = 0;
    const result: { month: string; Income: number; Expense: number; 'Net Savings': number }[] = [];
    for (const m of months) {
      cumIncome = cumIncome + m.income;
      cumExpense = cumExpense + m.expense;
      cumNet = cumNet + m.income - m.expense;
      result.push({
        month: MONTHS[m.month],
        Income: cumIncome,
        Expense: cumExpense,
        'Net Savings': cumNet,
      });
    }
    return result;
  }, [transactions, selectedYear]);

  // Category breakdown
  const expenseCategories = useMemo(() => {
    return groupByCategory(yearTxns, 'expense');
  }, [yearTxns]);

  const maxCatAmount = useMemo(() => {
    if (expenseCategories.length === 0) return 1;
    return Math.max(...expenseCategories.map((c) => c.amount));
  }, [expenseCategories]);

  // Statistics
  const stats = useMemo(() => {
    const monthlyData = groupByMonth(transactions, selectedYear).filter((m) => m.income > 0 || m.expense > 0);
    const monthsWithData = monthlyData.length || 1;

    const avgIncome = yearSummary.income / monthsWithData;
    const avgExpense = yearSummary.expense / monthsWithData;

    const largestExpense = yearTxns
      .filter((t) => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)[0];

    const largestIncome = yearTxns
      .filter((t) => t.type === 'income')
      .sort((a, b) => b.amount - a.amount)[0];

    const topCategory = expenseCategories[0];

    return {
      avgIncome,
      avgExpense,
      totalTxns: yearTxns.length,
      largestExpense,
      largestIncome,
      topCategory,
    };
  }, [yearTxns, yearSummary, expenseCategories, selectedYear, transactions]);

  const tooltipStyle = {
    borderRadius: '8px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--card)',
    color: 'var(--card-foreground)',
  };

  return (
    <div className="space-y-6">
      {/* Year Selector + Summary */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Annual Report</h3>
          <p className="text-sm text-muted-foreground">Financial overview for {selectedYear}</p>
        </div>
        <Select
          value={String(selectedYear)}
          onValueChange={(v) => setSelectedYear(Number(v))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Annual Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="size-4 text-emerald-500" />
              Total Income
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-500">
              {formatCurrency(yearSummary.income, settings.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingDown className="size-4 text-red-500" />
              Total Expenses
            </div>
            <p className="mt-2 text-2xl font-bold text-red-500">
              {formatCurrency(yearSummary.expense, settings.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="size-4 text-blue-500" />
              Net Savings
            </div>
            <p className={cn(
              'mt-2 text-2xl font-bold',
              yearSummary.balance >= 0 ? 'text-blue-500' : 'text-red-500'
            )}>
              {formatCurrency(yearSummary.balance, settings.currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => abbrevNumber(v)} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, settings.currency)}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Trend + Category */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trend Analysis (Cumulative)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => abbrevNumber(v)} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, settings.currency)}
                    contentStyle={tooltipStyle}
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{value}</span>
                    )}
                  />
                  <Line type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Net Savings" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {expenseCategories.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No expense data for this year.
                </p>
              ) : (
                expenseCategories.map((cat, i) => {
                  const pct = maxCatAmount > 0 ? (cat.amount / maxCatAmount) * 100 : 0;
                  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
                  return (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{cat.category}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(cat.amount, settings.currency)}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Year Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Year Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Avg Monthly Income</p>
              <p className="mt-1 text-lg font-bold text-emerald-500">
                {formatCurrency(stats.avgIncome, settings.currency)}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Avg Monthly Expense</p>
              <p className="mt-1 text-lg font-bold text-red-500">
                {formatCurrency(stats.avgExpense, settings.currency)}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Hash className="size-3.5" />
                Total Transactions
              </div>
              <p className="mt-1 text-lg font-bold">{stats.totalTxns}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Top Spending Category</p>
              <p className="mt-1 text-lg font-bold">{stats.topCategory?.category || 'N/A'}</p>
              {stats.topCategory && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(stats.topCategory.amount, settings.currency)}
                </p>
              )}
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ArrowDownRight className="size-3.5 text-red-500" />
                Largest Expense
              </div>
              <p className="mt-1 text-lg font-bold">{stats.largestExpense?.description || 'N/A'}</p>
              {stats.largestExpense && (
                <p className="text-xs text-red-500">
                  {formatCurrency(stats.largestExpense.amount, settings.currency)}
                </p>
              )}
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ArrowUpRight className="size-3.5 text-emerald-500" />
                Largest Income
              </div>
              <p className="mt-1 text-lg font-bold">{stats.largestIncome?.description || 'N/A'}</p>
              {stats.largestIncome && (
                <p className="text-xs text-emerald-500">
                  {formatCurrency(stats.largestIncome.amount, settings.currency)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

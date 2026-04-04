'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFinTrackStore } from '@/lib/store';
import {
  formatCurrency,
  formatDate,
  summarize,
  filterByPeriod,
  groupByCategory,
  groupByMonth,
  MONTHS,
  abbrevNumber,
  currentYear,
} from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#e11d48', '#84cc16', '#a855f7'];

export default function Dashboard() {
  const { transactions, budgets, settings, period, setPeriod } = useFinTrackStore();

  const filteredTxns = useMemo(() => filterByPeriod(transactions, period), [transactions, period]);
  const summary = useMemo(() => summarize(filteredTxns), [filteredTxns]);

  const incomeCount = filteredTxns.filter((t) => t.type === 'income').length;
  const expenseCount = filteredTxns.filter((t) => t.type === 'expense').length;

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const name = settings.userName || 'there';

  // Cash flow chart - last 6 months
  const cashFlowData = useMemo(() => {
    const y = currentYear();
    const months = groupByMonth(transactions, y);
    return months.map((m) => ({
      month: MONTHS[m.month],
      Income: m.income,
      Expense: m.expense,
    }));
  }, [transactions]);

  // Category spending pie chart
  const categoryData = useMemo(() => {
    return groupByCategory(filteredTxns, 'expense').map((c) => ({
      name: c.category,
      value: c.amount,
    }));
  }, [filteredTxns]);

  // Recent transactions
  const recentTxns = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);
  }, [transactions]);

  // Smart insights
  const insights = useMemo(() => {
    const items: { icon: React.ReactNode; text: string; type: 'warning' | 'success' | 'info' }[] = [];

    if (summary.income > 0 && summary.savingsRate < settings.savingsTarget) {
      items.push({
        icon: <AlertTriangle className="size-4 text-amber-400" />,
        text: `Your savings rate (${summary.savingsRate.toFixed(1)}%) is below your target of ${settings.savingsTarget}%. Try reducing discretionary spending.`,
        type: 'warning',
      });
    }

    if (summary.savingsRate >= settings.savingsTarget && summary.income > 0) {
      items.push({
        icon: <CheckCircle2 className="size-4 text-emerald-400" />,
        text: `Great job! You're saving ${summary.savingsRate.toFixed(1)}% of your income, exceeding your ${settings.savingsTarget}% target!`,
        type: 'success',
      });
    }

    budgets.forEach((b) => {
      const spent = filteredTxns
        .filter((t) => t.type === 'expense' && t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0);
      if (spent > b.amount) {
        items.push({
          icon: <AlertTriangle className="size-4 text-red-400" />,
          text: `You've exceeded your ${b.category} budget by ${formatCurrency(spent - b.amount, settings.currency)}.`,
          type: 'warning',
        });
      }
    });

    if (summary.expense > summary.income && summary.income > 0) {
      items.push({
        icon: <TrendingDown className="size-4 text-red-400" />,
        text: 'You are spending more than you earn this period. Consider reviewing your expenses.',
        type: 'warning',
      });
    }

    if (items.length === 0) {
      items.push({
        icon: <Info className="size-4 text-blue-400" />,
        text: 'Add more transactions to get personalized financial insights.',
        type: 'info',
      });
    }

    return items.slice(0, 4);
  }, [summary, budgets, filteredTxns, settings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, {name} 👋</h1>
          <p className="text-muted-foreground text-sm">Here&apos;s your financial overview.</p>
        </div>
        <div className="flex rounded-lg border bg-card p-1">
          {(['week', 'month', 'year', 'all'] as const).map((p) => (
            <Button
              key={p}
              variant="ghost"
              size="sm"
              onClick={() => setPeriod(p)}
              className={cn(
                'capitalize',
                period === p && 'bg-primary text-primary-foreground shadow-xs'
              )}
            >
              {p === 'all' ? 'All Time' : `This ${p}`}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="size-5 text-emerald-500" />
              </div>
              <Badge variant="secondary" className="text-xs">{incomeCount} txns</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Total Income</p>
            <p className="text-2xl font-bold text-emerald-500">
              {formatCurrency(summary.income, settings.currency)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-red-500/10">
                <TrendingDown className="size-5 text-red-500" />
              </div>
              <Badge variant="secondary" className="text-xs">{expenseCount} txns</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-red-500">
              {formatCurrency(summary.expense, settings.currency)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                <DollarSign className="size-5 text-blue-500" />
              </div>
              <Badge variant="secondary" className="text-xs">net</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Net Balance</p>
            <p className={cn(
              'text-2xl font-bold',
              summary.balance >= 0 ? 'text-blue-500' : 'text-red-500'
            )}>
              {formatCurrency(summary.balance, settings.currency)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                <PiggyBank className="size-5 text-amber-500" />
              </div>
              <Badge variant="secondary" className="text-xs">of income</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Savings Rate</p>
            <p className={cn(
              'text-2xl font-bold',
              summary.savingsRate >= settings.savingsTarget ? 'text-emerald-500' : 'text-amber-500'
            )}>
              {summary.savingsRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cash Flow Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => abbrevNumber(v)} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, settings.currency)}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--card-foreground)',
                    }}
                  />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Spending Doughnut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value, settings.currency)}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--card-foreground)',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value: string) => (
                        <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  No expense data for this period
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights + Recent Transactions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Smart Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Smart Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-3 rounded-lg p-3 text-sm',
                    insight.type === 'warning' && 'bg-amber-500/5 border border-amber-500/10',
                    insight.type === 'success' && 'bg-emerald-500/5 border border-emerald-500/10',
                    insight.type === 'info' && 'bg-blue-500/5 border border-blue-500/10',
                  )}
                >
                  {insight.icon}
                  <p className="text-muted-foreground leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentTxns.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No transactions yet. Add your first one!
                </p>
              ) : (
                recentTxns.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        'flex size-8 items-center justify-center rounded-full text-xs font-medium shrink-0',
                        txn.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-red-500/10 text-red-500'
                      )}>
                        {txn.type === 'income' ? '+' : '-'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{txn.description}</p>
                        <p className="text-xs text-muted-foreground">{txn.category} · {formatDate(txn.date, settings.dateFormat)}</p>
                      </div>
                    </div>
                    <span className={cn(
                      'text-sm font-semibold shrink-0 ml-2',
                      txn.type === 'income' ? 'text-emerald-500' : 'text-red-500'
                    )}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount, settings.currency)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

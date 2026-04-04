'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  BarChart3,
  Settings,
  Menu,
  Sun,
  Moon,
  Plus,
  DollarSign,
  Download,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useFinTrackStore } from '@/lib/store';
import { formatCurrency, summarize } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { PageId } from '@/lib/types';
import Dashboard from './Dashboard';
import Transactions from './Transactions';
import BudgetPage from './BudgetPage';
import GoalsPage from './GoalsPage';
import ReportsPage from './ReportsPage';
import SettingsPage from './SettingsPage';
import TransactionForm from './TransactionForm';

const NAV_ITEMS: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-5" /> },
  { id: 'transactions', label: 'Transactions', icon: <ArrowLeftRight className="size-5" /> },
  { id: 'budget', label: 'Budget', icon: <PiggyBank className="size-5" /> },
  { id: 'goals', label: 'Goals', icon: <Target className="size-5" /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="size-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="size-5" /> },
];

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: 'Dashboard',
  transactions: 'Transactions',
  budget: 'Budget',
  goals: 'Goals',
  reports: 'Reports',
  settings: 'Settings',
};

function SidebarNav({ onItemClick }: { onItemClick?: () => void }) {
  const { currentPage, setPage, transactions, settings } = useFinTrackStore();
  const summary = summarize(transactions);

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/20">
          <DollarSign className="size-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-sidebar-foreground">FinTrack Pro</h1>
          <p className="text-[11px] text-sidebar-foreground/50">Personal Finance</p>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <ScrollArea className="flex-1 sidebar-scroll">
        <nav className="flex flex-col gap-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setPage(item.id);
                onItemClick?.();
              }}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                currentPage === item.id
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      {/* Net Balance Footer */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-sidebar-foreground/50">
          <TrendingUp className="size-3.5" />
          <span>Net Balance</span>
        </div>
        <p className={cn(
          'mt-1 text-lg font-bold',
          summary.balance >= 0 ? 'text-emerald-400' : 'text-red-400'
        )}>
          {formatCurrency(summary.balance, settings.currency)}
        </p>
      </div>
    </div>
  );
}

function ExportDataButton() {
  const { transactions, budgets, goals, settings } = useFinTrackStore();
  const { theme } = useTheme();

  const handleExport = () => {
    const data = {
      transactions,
      budgets,
      goals,
      settings,
      exportedAt: new Date().toISOString(),
      theme,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleExport}>
      <Download className="size-4" />
      <span className="sr-only">Export</span>
    </Button>
  );
}

export default function AppShell() {
  const { currentPage, initSampleData, processRecurring } = useFinTrackStore();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  // Initialize data on mount (client-side only)
  useEffect(() => {
    initSampleData();
    processRecurring();
  }, [initSampleData, processRecurring]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'transactions': return <Transactions />;
      case 'budget': return <BudgetPage />;
      case 'goals': return <GoalsPage />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <SidebarNav />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarNav onItemClick={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Page Title */}
          <h2 className="text-lg font-semibold">{PAGE_TITLES[currentPage]}</h2>

          <div className="flex-1" />

          {/* Quick Add */}
          {currentPage !== 'settings' && (
            <Button size="sm" onClick={() => setShowTransactionForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add Transaction</span>
            </Button>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Export */}
          <ExportDataButton />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 lg:p-6">
            {renderPage()}
          </div>
        </main>
      </div>

      {/* Transaction Form Dialog */}
      <TransactionForm
        open={showTransactionForm}
        onOpenChange={setShowTransactionForm}
      />
    </div>
  );
}

'use client';

import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import {
  User,
  DollarSign,
  Calendar,
  Target,
  FolderOpen,
  Download,
  Upload,
  Trash2,
  Plus,
  X,
  Info,
  Github,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFinTrackStore } from '@/lib/store';
import { toCSV, downloadFile } from '@/lib/utils';
import type { CurrencyCode } from '@/lib/types';

const CURRENCY_OPTIONS: { value: CurrencyCode; label: string }[] = [
  { value: 'USD', label: 'USD ($) — US Dollar' },
  { value: 'EUR', label: 'EUR (€) — Euro' },
  { value: 'GBP', label: 'GBP (£) — British Pound' },
  { value: 'BDT', label: 'BDT (৳) — Bangladeshi Taka' },
  { value: 'INR', label: 'INR (₹) — Indian Rupee' },
  { value: 'JPY', label: 'JPY (¥) — Japanese Yen' },
  { value: 'CAD', label: 'CAD (CA$) — Canadian Dollar' },
  { value: 'AUD', label: 'AUD (A$) — Australian Dollar' },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

export default function SettingsPage() {
  const {
    settings,
    transactions,
    updateSettings,
    addCategory,
    removeCategory,
    importData,
    clearAll,
  } = useFinTrackStore();

  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Storage usage
  const getStorageUsage = () => {
    try {
      let total = 0;
      for (const key of ['ftp_transactions', 'ftp_budgets', 'ftp_goals', 'ftp_settings']) {
        const val = localStorage.getItem(key);
        if (val) total += val.length;
      }
      return (total / 1024).toFixed(1);
    } catch {
      return '0';
    }
  };

  const handleAddCategory = (type: 'income' | 'expense') => {
    const name = type === 'income' ? newIncomeCat.trim() : newExpenseCat.trim();
    if (!name) return;
    addCategory(type, name);
    if (type === 'income') setNewIncomeCat('');
    else setNewExpenseCat('');
    toast.success(`Category "${name}" added.`);
  };

  const handleRemoveCategory = (type: 'income' | 'expense', name: string) => {
    removeCategory(type, name);
    toast.success(`Category "${name}" removed.`);
  };

  const handleExportJSON = () => {
    const data = {
      transactions,
      budgets: useFinTrackStore.getState().budgets,
      goals: useFinTrackStore.getState().goals,
      settings,
      exportedAt: new Date().toISOString(),
    };
    downloadFile(JSON.stringify(data, null, 2), `fintrack-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    toast.success('JSON export downloaded!');
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Category', 'Amount', 'Payment', 'Notes', 'Recurring'];
    const keys = ['date', 'type', 'description', 'category', 'amount', 'payment', 'notes', 'recurring'];
    const csv = toCSV(transactions as unknown as Record<string, unknown>[], headers, keys);
    downloadFile(csv, `fintrack-transactions-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    toast.success('CSV export downloaded!');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        importData(data);
        toast.success('Data imported successfully!');
      } catch {
        toast.error('Failed to import. Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = () => {
    clearAll();
    toast.success('All data cleared.');
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Profile & Currency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4" />
            Profile & Currency
          </CardTitle>
          <CardDescription>Customize your profile and display preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Your Name</Label>
            <Input
              id="username"
              placeholder="Enter your name"
              value={settings.userName}
              onChange={(e) => updateSettings({ userName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={settings.currency}
              onValueChange={(v) => updateSettings({ currency: v as CurrencyCode })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(v) => updateSettings({ dateFormat: v as typeof settings.dateFormat })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="savings-target">Savings Target (%)</Label>
              <Input
                id="savings-target"
                type="number"
                min="0"
                max="100"
                value={settings.savingsTarget}
                onChange={(e) => updateSettings({ savingsTarget: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="size-4" />
            Category Management
          </CardTitle>
          <CardDescription>Manage your income and expense categories.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Income Categories */}
          <div className="space-y-3">
            <Label className="text-emerald-500 font-medium">Income Categories</Label>
            <div className="flex flex-wrap gap-2">
              {settings.incomeCategories.map((cat) => (
                <Badge key={cat} variant="secondary" className="gap-1 py-1 px-2.5">
                  {cat}
                  <button
                    onClick={() => handleRemoveCategory('income', cat)}
                    className="ml-0.5 hover:text-red-500 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="New income category"
                value={newIncomeCat}
                onChange={(e) => setNewIncomeCat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory('income')}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" onClick={() => handleAddCategory('income')}>
                <Plus className="size-3.5" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Expense Categories */}
          <div className="space-y-3">
            <Label className="text-red-500 font-medium">Expense Categories</Label>
            <div className="flex flex-wrap gap-2">
              {settings.expenseCategories.map((cat) => (
                <Badge key={cat} variant="secondary" className="gap-1 py-1 px-2.5">
                  {cat}
                  <button
                    onClick={() => handleRemoveCategory('expense', cat)}
                    className="ml-0.5 hover:text-red-500 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="New expense category"
                value={newExpenseCat}
                onChange={(e) => setNewExpenseCat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory('expense')}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" onClick={() => handleAddCategory('expense')}>
                <Plus className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="size-4" />
            Data Management
          </CardTitle>
          <CardDescription>Export, import, or clear your financial data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Button variant="outline" className="w-full" onClick={handleExportJSON}>
              <Download className="size-4" />
              Export JSON
            </Button>
            <Button variant="outline" className="w-full" onClick={handleExportCSV}>
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" />
              Import JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJSON}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Storage Used</span>
              <span className="font-medium">{getStorageUsage()} KB</span>
            </div>
            <Progress value={Math.min(parseFloat(getStorageUsage()) / 500 * 100, 100)} className="h-1.5" />
            <p className="text-xs text-muted-foreground">Local storage limit: ~5MB</p>
          </div>

          <Separator />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <Trash2 className="size-4" />
                Clear All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All Data</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all your transactions, budgets, goals, and settings. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll} className="bg-red-600 hover:bg-red-700">
                  Yes, Clear Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="size-4" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <DollarSign className="size-5 text-emerald-500" />
            </div>
            <div>
              <p className="font-semibold">FinTrack Pro</p>
              <p className="text-xs text-muted-foreground">v3.0.0 · Built {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Developed by <span className="font-medium text-foreground">Faruk Islam</span>{' '}
              <a
                href="https://github.com/farukislamyt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
              >
                @farukislamyt
                <ExternalLink className="size-3" />
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Tech Stack</p>
            <div className="flex flex-wrap gap-1.5">
              {['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Recharts', 'Zustand'].map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://github.com/farukislamyt"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="size-4" />
                GitHub
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://fintrackpro.vercel.app" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                Live Demo
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

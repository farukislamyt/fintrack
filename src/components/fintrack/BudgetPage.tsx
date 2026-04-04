'use client';

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { useFinTrackStore } from '@/lib/store';
import { formatCurrency, filterByPeriod } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Budget } from '@/lib/types';

export default function BudgetPage() {
  const { transactions, budgets, settings, period, addBudget, updateBudget, removeBudget } = useFinTrackStore();

  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');

  // Filter expenses for current period
  const filteredExpenses = useMemo(() => {
    return filterByPeriod(
      transactions.filter((t) => t.type === 'expense'),
      period
    );
  }, [transactions, period]);

  // Calculate spending per budget category
  const budgetData = useMemo(() => {
    return budgets.map((b) => {
      const spent = filteredExpenses
        .filter((t) => t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0);
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      return { ...b, spent, pct };
    }).sort((a, b) => b.pct - a.pct); // over-budget first
  }, [budgets, filteredExpenses]);

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0);
  const remaining = totalBudget - totalSpent;

  // Available expense categories (not already budgeted)
  const availableCategories = useMemo(() => {
    const used = new Set(budgets.filter((b) => b.id !== editingBudget?.id).map((b) => b.category));
    return settings.expenseCategories.filter((c) => !used.has(c));
  }, [settings.expenseCategories, budgets, editingBudget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid budget amount.');
      return;
    }
    if (!formCategory) {
      toast.error('Please select a category.');
      return;
    }

    if (editingBudget) {
      updateBudget({ ...editingBudget, category: formCategory, amount });
      toast.success('Budget updated!');
    } else {
      addBudget({ category: formCategory, amount });
      toast.success('Budget added!');
    }
    setShowForm(false);
    setEditingBudget(null);
    resetForm();
  };

  const resetForm = () => {
    setFormCategory('');
    setFormAmount('');
  };

  const openEdit = (b: Budget) => {
    setEditingBudget(b);
    setFormCategory(b.category);
    setFormAmount(String(b.amount));
    setShowForm(true);
  };

  const openAdd = () => {
    setEditingBudget(null);
    resetForm();
    setShowForm(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      removeBudget(deleteId);
      toast.success('Budget deleted.');
      setDeleteId(null);
    }
  };

  const getProgressColor = (pct: number) => {
    if (pct > 100) return 'bg-red-500';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getProgressClass = (pct: number) => {
    if (pct > 100) return '[&>div]:bg-red-500';
    if (pct >= 80) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <PiggyBank className="size-4" />
              Total Budget
            </div>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(totalBudget, settings.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="size-4 text-amber-500" />
              Total Spent
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-500">{formatCurrency(totalSpent, settings.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Remaining
            </div>
            <p className={cn(
              'mt-2 text-2xl font-bold',
              remaining >= 0 ? 'text-emerald-500' : 'text-red-500'
            )}>
              {formatCurrency(remaining, settings.currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Budget Categories</h3>
        <Button onClick={openAdd} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="size-4" />
          Add Budget
        </Button>
      </div>

      {budgetData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PiggyBank className="mx-auto size-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">No budgets set. Create your first budget to start tracking.</p>
            <Button onClick={openAdd} className="mt-4" variant="outline">
              <Plus className="size-4" />
              Add Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {budgetData.map((b) => (
            <Card key={b.id} className={cn(b.pct > 100 && 'border-red-500/30')}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{b.category}</p>
                      {b.pct > 100 && (
                        <span className="text-xs text-red-500 font-medium">Over Budget!</span>
                      )}
                    </div>
                    <div className="mt-3 space-y-2">
                      <Progress
                        value={Math.min(b.pct, 100)}
                        className={cn('h-2', getProgressClass(b.pct))}
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(b.spent, settings.currency)} of {formatCurrency(b.amount, settings.currency)}
                        </span>
                        <span className={cn(
                          'font-medium',
                          b.pct > 100 ? 'text-red-500' : b.pct >= 80 ? 'text-amber-500' : 'text-emerald-500'
                        )}>
                          {b.pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(b)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-red-500 hover:text-red-600" onClick={() => setDeleteId(b.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Budget Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBudget ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {editingBudget && (
                    <SelectItem value={editingBudget.category}>{editingBudget.category}</SelectItem>
                  )}
                  {availableCategories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-amount">Monthly Limit</Label>
              <Input
                id="budget-amount"
                type="number"
                step="0.01"
                min="1"
                placeholder="0.00"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingBudget(null); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingBudget ? 'Update' : 'Add'} Budget
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this budget? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

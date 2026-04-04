'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFinTrackStore } from '@/lib/store';
import { todayStr } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/types';

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTransaction?: Transaction | null;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'mobile', label: 'Mobile Payment' },
  { value: 'other', label: 'Other' },
];

const RECURRING_FREQS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function TransactionForm({ open, onOpenChange, editingTransaction }: TransactionFormProps) {
  const { settings, addTransaction, updateTransaction } = useFinTrackStore();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayStr());
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [payment, setPayment] = useState<string>('card');
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState<string>('monthly');

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setDate(todayStr());
    setDescription('');
    setCategory('');
    setPayment('card');
    setNotes('');
    setRecurring(false);
    setRecurringFreq('monthly');
  };

  const [formKey, setFormKey] = React.useState(0);

  const formState = React.useMemo(() => ({
    type, amount, date, description, category, payment, notes, recurring, recurringFreq
  }), [type, amount, date, description, category, payment, notes, recurring, recurringFreq]);

  React.useEffect(() => {
    if (!open) {
      setFormKey(k => k + 1);
      return;
    }
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setDate(editingTransaction.date);
      setDescription(editingTransaction.description);
      setCategory(editingTransaction.category);
      setPayment(editingTransaction.payment);
      setNotes(editingTransaction.notes || '');
      setRecurring(editingTransaction.recurring || false);
      setRecurringFreq(editingTransaction.recurringFreq || 'monthly');
    } else {
      setFormKey(k => k + 1);
    }
  }, [open, editingTransaction]);


  const categories = type === 'income' ? settings.incomeCategories : settings.expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a description.');
      return;
    }
    if (!category) {
      toast.error('Please select a category.');
      return;
    }
    if (!date) {
      toast.error('Please select a date.');
      return;
    }

    const data = {
      type,
      amount: parsedAmount,
      date,
      description: description.trim(),
      category,
      payment: payment as Transaction['payment'],
      notes: notes.trim() || undefined,
      recurring,
      recurringFreq: recurring ? (recurringFreq as Transaction['recurringFreq']) : undefined,
    };

    if (editingTransaction) {
      updateTransaction({
        ...editingTransaction,
        ...data,
        recurring: recurring || undefined,
        recurringFreq: recurring ? data.recurringFreq : undefined,
      } as Transaction);
      toast.success('Transaction updated successfully!');
    } else {
      addTransaction(data);
      toast.success('Transaction added successfully!');
    }

    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex rounded-lg border bg-muted p-1">
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory('');
                }}
                className={cn(
                  'flex-1 rounded-md py-2 text-sm font-medium transition-all',
                  type === 'income'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setCategory('');
                }}
                className={cn(
                  'flex-1 rounded-md py-2 text-sm font-medium transition-all',
                  type === 'expense'
                    ? 'bg-red-500 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Expense
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {settings.currency}
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-14"
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g., Grocery shopping"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={payment} onValueChange={setPayment}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm">Recurring Transaction</Label>
              <p className="text-xs text-muted-foreground">Automatically repeat this transaction</p>
            </div>
            <Switch checked={recurring} onCheckedChange={setRecurring} />
          </div>

          {recurring && (
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={recurringFreq} onValueChange={setRecurringFreq}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRING_FREQS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className={
              type === 'income'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            }>
              {editingTransaction ? 'Update' : 'Add'} Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

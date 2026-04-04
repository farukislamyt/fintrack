'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Landmark,
  Calculator,
  TrendingDown,
  AlertCircle,
  CalendarClock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useFinTrackStore } from '@/lib/store';
import {
  formatCurrency,
  formatDate,
  calculateMonthlyPayment,
  calculateAmortizationSchedule,
  monthsPassedSince,
  formatPercentage,
  todayStr,
  cn,
} from '@/lib/utils';
import type { Loan } from '@/lib/types';

const LOAN_TYPE_OPTIONS: { value: Loan['type']; label: string }[] = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'car', label: 'Car Loan' },
  { value: 'personal', label: 'Personal Loan' },
  { value: 'student', label: 'Student Loan' },
  { value: 'other', label: 'Other' },
];

const LOAN_EMOJIS = ['🏠', '🚗', '💰', '🎓', '📋', '🏦', '💳', '💼', '🛒', '🏗️', '✈️', '⚕️'];

const TYPE_BADGE_COLORS: Record<Loan['type'], string> = {
  mortgage: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  car: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  personal: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  student: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

interface LoanFormData {
  name: string;
  type: Loan['type'];
  principal: string;
  annualRate: string;
  termMonths: string;
  termUnit: 'months' | 'years';
  startDate: string;
  emoji: string;
  notes: string;
}

const defaultFormData: LoanFormData = {
  name: '',
  type: 'personal',
  principal: '',
  annualRate: '',
  termMonths: '',
  termUnit: 'years',
  startDate: todayStr(),
  emoji: '💰',
  notes: '',
};

function progressColor(percent: number): string {
  if (percent < 50) return '[&>div]:bg-emerald-500';
  if (percent <= 80) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-red-500';
}

function LoanFormDialog({
  open,
  onOpenChange,
  editLoan,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editLoan: Loan | null;
}) {
  const { addLoan, updateLoan } = useFinTrackStore();
  const [form, setForm] = useState<LoanFormData>(defaultFormData);

  React.useEffect(() => {
    if (editLoan) {
      setForm({
        name: editLoan.name,
        type: editLoan.type,
        principal: String(editLoan.principal),
        annualRate: String(editLoan.annualRate),
        termMonths: String(editLoan.termMonths),
        termUnit: editLoan.termMonths % 12 === 0 ? 'years' : 'months',
        startDate: editLoan.startDate,
        emoji: editLoan.emoji,
        notes: editLoan.notes || '',
      });
    } else {
      setForm(defaultFormData);
    }
  }, [editLoan, open]);

  const termValue = form.termUnit === 'years'
    ? Number(form.termMonths || 0) * 12
    : Number(form.termMonths || 0);

  const emiPreview = useMemo(() => {
    const p = Number(form.principal || 0);
    const r = Number(form.annualRate || 0);
    const t = termValue;
    if (p <= 0 || t <= 0) return 0;
    return calculateMonthlyPayment(p, r, t);
  }, [form.principal, form.annualRate, termValue]);

  const handleSave = () => {
    const p = Number(form.principal);
    const r = Number(form.annualRate);
    const t = termValue;

    if (!form.name.trim() || p <= 0 || t <= 0) return;

    const loanData = {
      name: form.name.trim(),
      type: form.type,
      principal: p,
      annualRate: r,
      termMonths: t,
      startDate: form.startDate || todayStr(),
      emoji: form.emoji,
      notes: form.notes.trim() || undefined,
    };

    if (editLoan) {
      updateLoan({ ...loanData, id: editLoan.id });
    } else {
      addLoan(loanData);
    }
    onOpenChange(false);
  };

  const isValid = form.name.trim() && Number(form.principal) > 0 && termValue > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editLoan ? 'Edit Loan' : 'Add New Loan'}</DialogTitle>
          <DialogDescription>
            {editLoan ? 'Update the loan details below.' : 'Enter the loan details to track your debt.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Emoji selector */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Emoji</Label>
            <div className="flex flex-wrap gap-1.5">
              {LOAN_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, emoji: em }))}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-lg text-lg transition-all hover:scale-110',
                    form.emoji === em
                      ? 'bg-primary/20 ring-2 ring-primary'
                      : 'hover:bg-muted'
                  )}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loan-name">Loan Name</Label>
            <Input
              id="loan-name"
              placeholder="e.g. Home Mortgage"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={60}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Loan Type</Label>
            <Select value={form.type} onValueChange={(v: Loan['type']) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOAN_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="loan-principal">Principal Amount</Label>
              <Input
                id="loan-principal"
                type="number"
                placeholder="25000"
                value={form.principal}
                onChange={(e) => setForm((f) => ({ ...f, principal: e.target.value }))}
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-rate">Annual Rate %</Label>
              <Input
                id="loan-rate"
                type="number"
                placeholder="5.5"
                value={form.annualRate}
                onChange={(e) => setForm((f) => ({ ...f, annualRate: e.target.value }))}
                min={0}
                step={0.1}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="loan-term">Term</Label>
              <div className="flex gap-2">
                <Input
                  id="loan-term"
                  type="number"
                  placeholder="5"
                  value={form.termMonths}
                  onChange={(e) => setForm((f) => ({ ...f, termMonths: e.target.value }))}
                  min={1}
                  className="flex-1"
                />
                <Select
                  value={form.termUnit}
                  onValueChange={(v: 'months' | 'years') => setForm((f) => ({ ...f, termUnit: v }))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="years">Years</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-start">Start Date</Label>
              <Input
                id="loan-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
          </div>

          {/* EMI Preview */}
          {emiPreview > 0 && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calculator className="size-4" />
                <span>Estimated Monthly EMI</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-primary">
                {formatCurrency(emiPreview)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total payment: {formatCurrency(emiPreview * termValue)} over {termValue} months
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="loan-notes">Notes (optional)</Label>
            <Input
              id="loan-notes"
              placeholder="Any additional details..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              maxLength={100}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {editLoan ? 'Save Changes' : 'Add Loan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AmortizationTable({ loan }: { loan: Loan }) {
  const schedule = useMemo(
    () => calculateAmortizationSchedule(loan.principal, loan.annualRate, loan.termMonths, loan.startDate),
    [loan.principal, loan.annualRate, loan.termMonths, loan.startDate]
  );

  return (
    <ScrollArea className="max-h-96">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Payment</TableHead>
            <TableHead className="text-right">Principal</TableHead>
            <TableHead className="text-right">Interest</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedule.map((row) => (
            <TableRow key={row.month}>
              <TableCell className="text-muted-foreground">{row.month}</TableCell>
              <TableCell>{formatDate(row.date)}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(row.payment)}</TableCell>
              <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                {formatCurrency(row.principal)}
              </TableCell>
              <TableCell className="text-right text-red-500">
                {formatCurrency(row.interest)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(row.balance)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
          <Landmark className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No Loans Yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          Track your mortgages, car loans, student loans, and more. Add your first loan to get started.
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoansPage() {
  const { loans, loanPayments, settings, addLoan, updateLoan, removeLoan } = useFinTrackStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLoan, setEditLoan] = useState<Loan | null>(null);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Summary calculations
  const summary = useMemo(() => {
    let totalDebt = 0;
    let monthlyPayments = 0;
    let totalInterest = 0;

    for (const loan of loans) {
      totalDebt += loan.principal;
      const emi = calculateMonthlyPayment(loan.principal, loan.annualRate, loan.termMonths);
      monthlyPayments += emi;
      const schedule = calculateAmortizationSchedule(loan.principal, loan.annualRate, loan.termMonths, loan.startDate);
      const interest = schedule.reduce((sum, s) => sum + s.interest, 0);
      totalInterest += interest;
    }

    return { totalDebt, monthlyPayments, totalInterest };
  }, [loans]);

  const handleEdit = (loan: Loan) => {
    setEditLoan(loan);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditLoan(null);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    removeLoan(id);
    setDeleteConfirm(null);
  };

  const getLoanProgress = (loan: Loan): { percent: number; monthsElapsed: number; monthsRemaining: number } => {
    const monthsElapsed = Math.max(monthsPassedSince(loan.startDate), 0);
    const monthsRemaining = Math.max(loan.termMonths - monthsElapsed, 0);
    const percent = loan.termMonths > 0 ? Math.min((monthsElapsed / loan.termMonths) * 100, 100) : 0;
    return { percent, monthsElapsed, monthsRemaining };
  };

  if (loans.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Loans</h1>
            <p className="text-sm text-muted-foreground">Manage and track all your loans</p>
          </div>
          <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="size-4 mr-1" />
            Add Loan
          </Button>
        </div>
        <EmptyState />
        <LoanFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editLoan={editLoan} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Loans</h1>
          <p className="text-sm text-muted-foreground">Manage and track all your loans</p>
        </div>
        <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="size-4 mr-1" />
          Add Loan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-red-500/10">
                <Landmark className="size-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Debt</p>
                <p className="text-xl font-bold text-red-500">
                  {formatCurrency(summary.totalDebt, settings.currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                <CalendarClock className="size-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Payments</p>
                <p className="text-xl font-bold text-amber-500">
                  {formatCurrency(summary.monthlyPayments, settings.currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingDown className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Interest</p>
                <p className="text-xl font-bold text-blue-500">
                  {formatCurrency(summary.totalInterest, settings.currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan List */}
      <div className="space-y-4">
        {loans.map((loan) => {
          const emi = calculateMonthlyPayment(loan.principal, loan.annualRate, loan.termMonths);
          const { percent, monthsRemaining } = getLoanProgress(loan);
          const isExpanded = expandedLoan === loan.id;

          return (
            <Card key={loan.id} className="animate-slide-up">
              <CardContent className="p-4 sm:p-6">
                {/* Loan Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{loan.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold">{loan.name}</h3>
                        <Badge variant="outline" className={cn('text-xs', TYPE_BADGE_COLORS[loan.type])}>
                          {LOAN_TYPE_OPTIONS.find((o) => o.value === loan.type)?.label || loan.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {formatCurrency(loan.principal, settings.currency)} &middot; {formatPercentage(loan.annualRate)} APR &middot; {loan.termMonths} months
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => handleEdit(loan)}>
                      <Pencil className="size-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    {deleteConfirm === loan.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleDelete(loan.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => setDeleteConfirm(loan.id)}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Loan Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly EMI</p>
                    <p className="text-base font-bold">{formatCurrency(emi, settings.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Months Remaining</p>
                    <p className="text-base font-bold">{monthsRemaining}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className="text-base font-bold">{formatPercentage(percent)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Started</p>
                    <p className="text-base font-bold">{formatDate(loan.startDate, settings.dateFormat)}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <Progress value={percent} className={cn('h-2.5', progressColor(percent))} />
                  <div className="flex justify-between mt-1">
                    <span className="text-[11px] text-muted-foreground">Paid</span>
                    <span className="text-[11px] text-muted-foreground">{formatPercentage(percent)} complete</span>
                  </div>
                </div>

                {/* Amortization Toggle */}
                <Collapsible
                  open={isExpanded}
                  onOpenChange={(open) => setExpandedLoan(open ? loan.id : null)}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-center text-muted-foreground hover:text-foreground">
                      {isExpanded ? (
                        <>
                          <ChevronUp className="size-4 mr-1" />
                          Hide Schedule
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-4 mr-1" />
                          View Amortization Schedule
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-3 rounded-lg border">
                      <AmortizationTable loan={loan} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form Dialog */}
      <LoanFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editLoan={editLoan} />
    </div>
  );
}

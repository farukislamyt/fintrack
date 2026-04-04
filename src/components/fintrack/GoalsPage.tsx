'use client';

import React, { useState, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Target,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Goal } from '@/lib/types';

const EMOJIS = ['💰', '✈️', '💻', '🏠', '🚗', '🎓', '💍', '👶', '🏥', '🎮', '📱', '🏖️'];

export default function GoalsPage() {
  const { goals, settings, addGoal, updateGoal, removeGoal, addGoalContribution } = useFinTrackStore();

  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formSaved, setFormSaved] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formEmoji, setFormEmoji] = useState('💰');

  // Contribution inputs
  const contribInputs = useRef<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(formTarget);
    if (!formName.trim()) {
      toast.error('Please enter a goal name.');
      return;
    }
    if (!target || target <= 0) {
      toast.error('Please enter a valid target amount.');
      return;
    }

    const saved = editingGoal ? parseFloat(formSaved) || 0 : 0;

    if (editingGoal) {
      const wasBelowTarget = editingGoal.saved < editingGoal.target;
      const updated: Goal = {
        ...editingGoal,
        name: formName.trim(),
        target,
        saved,
        deadline: formDeadline || undefined,
        emoji: formEmoji,
      };
      updateGoal(updated);
      // Check if just completed
      if (wasBelowTarget && saved >= target) {
        toast.success('🎉 Goal completed! Amazing work!');
      } else {
        toast.success('Goal updated!');
      }
    } else {
      addGoal({
        name: formName.trim(),
        target,
        saved: 0,
        deadline: formDeadline || undefined,
        emoji: formEmoji,
      });
      toast.success('Goal added!');
    }
    setShowForm(false);
    setEditingGoal(null);
    resetForm();
  };

  const resetForm = () => {
    setFormName('');
    setFormTarget('');
    setFormSaved('');
    setFormDeadline('');
    setFormEmoji('💰');
  };

  const openEdit = (g: Goal) => {
    setEditingGoal(g);
    setFormName(g.name);
    setFormTarget(String(g.target));
    setFormSaved(String(g.saved));
    setFormDeadline(g.deadline || '');
    setFormEmoji(g.emoji);
    setShowForm(true);
  };

  const openAdd = () => {
    setEditingGoal(null);
    resetForm();
    setShowForm(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      removeGoal(deleteId);
      toast.success('Goal deleted.');
      setDeleteId(null);
    }
  };

  const handleContribution = (goalId: string) => {
    const input = contribInputs.current[goalId];
    const amount = parseFloat(input || '');
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid contribution amount.');
      return;
    }
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const wasBelowTarget = goal.saved < goal.target;
    addGoalContribution(goalId, amount);
    contribInputs.current[goalId] = '';

    // Check if just completed
    if (wasBelowTarget && goal.saved + amount >= goal.target) {
      toast.success('🎉 Congratulations! Goal completed!', {
        duration: 5000,
      });
    } else {
      toast.success(`Added ${formatCurrency(amount, settings.currency)} to "${goal.name}".`);
    }
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return '[&>div]:bg-emerald-500';
    if (pct >= 60) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-blue-500';
  };

  const getProgressTextColor = (pct: number) => {
    if (pct >= 100) return 'text-emerald-500';
    if (pct >= 60) return 'text-amber-500';
    return 'text-blue-500';
  };

  const getDeadlineBadge = (deadline?: string) => {
    if (!deadline) return null;
    const days = daysUntil(deadline);
    if (days < 0) {
      return <Badge variant="destructive" className="text-xs">{Math.abs(days)}d overdue</Badge>;
    }
    if (days <= 7) {
      return <Badge className="bg-amber-500 text-white text-xs hover:bg-amber-600">{days}d left</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">{days}d left</Badge>;
  };

  const getMonthlyNeeded = (goal: Goal): string => {
    if (!goal.deadline) return '';
    const days = daysUntil(goal.deadline);
    if (days <= 0) return '';
    const remaining = goal.target - goal.saved;
    if (remaining <= 0) return '';
    const months = days / 30;
    const monthly = remaining / months;
    return formatCurrency(monthly, settings.currency);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Your Goals</h3>
          <p className="text-sm text-muted-foreground">{goals.length} goal{goals.length !== 1 ? 's' : ''} tracking</p>
        </div>
        <Button onClick={openAdd} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="size-4" />
          Add Goal
        </Button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Target className="mx-auto size-12 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-medium">No goals yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Create a savings goal to start tracking your progress.</p>
            <Button onClick={openAdd} className="mt-6" variant="outline">
              <Plus className="size-4" />
              Create Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const pct = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
            const isComplete = pct >= 100;
            const monthlyNeeded = getMonthlyNeeded(goal);

            return (
              <Card key={goal.id} className={cn(isComplete && 'border-emerald-500/30 bg-emerald-500/5')}>
                <CardContent className="pt-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{goal.emoji}</span>
                      <div>
                        <p className="font-semibold">{goal.name}</p>
                        {isComplete && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-medium">
                            <Sparkles className="size-3" />
                            Completed!
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(goal)}>
                        <Pencil className="size-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7 text-red-500" onClick={() => setDeleteId(goal.id)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className={getProgressTextColor(pct)}>
                        {formatCurrency(goal.saved, settings.currency)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        of {formatCurrency(goal.target, settings.currency)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(pct, 100)}
                      className={cn('h-2', getProgressColor(pct))}
                    />
                    <div className="flex items-center justify-between">
                      <span className={cn('text-sm font-medium', getProgressTextColor(pct))}>
                        {pct.toFixed(0)}%
                      </span>
                      {getDeadlineBadge(goal.deadline)}
                    </div>
                  </div>

                  {/* Monthly needed */}
                  {monthlyNeeded && !isComplete && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      ~{monthlyNeeded}/month needed
                    </p>
                  )}

                  {/* Contribution Input */}
                  {!isComplete && (
                    <div className="mt-4 flex gap-2">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Amount"
                        className="h-8 text-sm"
                        onChange={(e) => {
                          contribInputs.current[goal.id] = e.target.value;
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleContribution(goal.id)}
                      >
                        Add
                      </Button>
                    </div>
                  )}

                  {goal.deadline && (
                    <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(goal.deadline, settings.dateFormat)}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Goal Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'New Goal'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Emoji Picker */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setFormEmoji(e)}
                    className={cn(
                      'flex size-10 items-center justify-center rounded-lg border text-xl transition-all',
                      formEmoji === e
                        ? 'border-primary bg-primary/10 scale-110'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-name">Goal Name</Label>
              <Input
                id="goal-name"
                placeholder="e.g., Emergency Fund"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="goal-target">Target Amount</Label>
                <Input
                  id="goal-target"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                />
              </div>
              {editingGoal && (
                <div className="space-y-2">
                  <Label htmlFor="goal-saved">Saved So Far</Label>
                  <Input
                    id="goal-saved"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formSaved}
                    onChange={(e) => setFormSaved(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-deadline">Deadline (optional)</Label>
              <Input
                id="goal-deadline"
                type="date"
                value={formDeadline}
                onChange={(e) => setFormDeadline(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingGoal(null); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingGoal ? 'Update' : 'Create'} Goal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this goal? This action cannot be undone.
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

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFinTrackStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { ArrowRight, ArrowLeft, Sparkles, ChevronRight } from 'lucide-react';
import type { CurrencyCode } from '@/lib/types';

const CURRENCY_OPTIONS: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'BDT', symbol: '৳', label: 'Bangladeshi Taka' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
];

const GOAL_EMOJIS = ['🎯', '💰', '✈️', '🏠', '🚗', '🎓', '💍', '💻', '🎒', '🏥', '🏖️', '🎮'];

const CONFETTI_EMOJIS = ['🎉', '🎊', '✨', '🌟', '💫', '🎈', '🎆', '🥳', '👏', '💪'];

function ConfettiEmoji({ emoji, delay, left }: { emoji: string; delay: number; left: number }) {
  return (
    <span
      className="pointer-events-none absolute text-2xl animate-slide-up"
      style={{
        left: `${left}%`,
        top: '30%',
        animationDelay: `${delay}ms`,
        animationDuration: '1.5s',
        animationFillMode: 'backwards',
        opacity: 0,
      }}
    >
      {emoji}
    </span>
  );
}

export default function Onboarding() {
  const { settings, updateSettings, addGoal } = useFinTrackStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.userName || '');
  const [currency, setCurrency] = useState<CurrencyCode>(settings.currency || 'USD');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalEmoji, setGoalEmoji] = useState('🎯');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const totalSteps = 5;

  const handleNext = useCallback(() => {
    setDirection('forward');
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }, []);

  const handleBack = useCallback(() => {
    setDirection('backward');
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleSkip = useCallback(() => {
    updateSettings({ onboardingComplete: true });
  }, [updateSettings]);

  const handleFinish = useCallback(() => {
    if (goalName.trim() && Number(goalTarget) > 0) {
      addGoal({
        name: goalName.trim(),
        target: Number(goalTarget),
        saved: 0,
        deadline: goalDeadline || undefined,
        emoji: goalEmoji,
      });
    }
    updateSettings({
      onboardingComplete: true,
      userName: name.trim() || settings.userName,
      currency,
    });
  }, [goalName, goalTarget, goalDeadline, goalEmoji, name, currency, settings.userName, updateSettings, addGoal]);

  const confetti = useMemo(() => {
    return CONFETTI_EMOJIS.map((emoji, i) => ({
      emoji,
      delay: i * 120,
      left: 5 + (i / CONFETTI_EMOJIS.length) * 90,
    }));
  }, []);

  const stepContent = (() => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col items-center text-center space-y-6 animate-scale-in">
            <div className="relative">
              <span className="text-7xl block" role="img" aria-label="Money bag">
                💰
              </span>
              <span className="absolute -top-2 -right-2 text-xl animate-pulse">✨</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Welcome to FinTrack Pro</h1>
              <p className="text-muted-foreground text-lg max-w-sm">Your personal finance companion for smarter money management</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {['Track Expenses', 'Set Goals', 'Manage Loans', 'Visual Reports'].map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  <Sparkles className="size-3" />
                  {f}
                </span>
              ))}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6 animate-slide-up" key="name-step">
            <div className="text-center space-y-2">
              <span className="text-4xl block mb-2">👋</span>
              <h2 className="text-2xl sm:text-3xl font-bold">What should we call you?</h2>
              <p className="text-muted-foreground">We&apos;ll personalize your experience</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboard-name" className="text-sm font-medium">Your Name</Label>
              <Input
                id="onboard-name"
                placeholder="e.g. Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 text-lg text-center"
                maxLength={30}
                autoFocus
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-slide-up" key="currency-step">
            <div className="text-center space-y-2">
              <span className="text-4xl block mb-2">🌍</span>
              <h2 className="text-2xl sm:text-3xl font-bold">Choose Your Currency</h2>
              <p className="text-muted-foreground">Select your preferred currency</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CURRENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setCurrency(opt.code)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition-all hover:scale-[1.02] active:scale-[0.98]',
                    currency === opt.code
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                      : 'border-border bg-card hover:border-muted-foreground/30'
                  )}
                >
                  <span className="text-2xl font-bold">{opt.symbol}</span>
                  <span className={cn(
                    'text-xs font-medium',
                    currency === opt.code ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                  )}>
                    {opt.code}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5 animate-slide-up" key="goal-step">
            <div className="text-center space-y-2">
              <span className="text-4xl block mb-2">🎯</span>
              <h2 className="text-2xl sm:text-3xl font-bold">Set a Financial Goal</h2>
              <p className="text-muted-foreground">Optional — you can always add goals later</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="goal-name" className="text-sm font-medium">Goal Name</Label>
                <Input
                  id="goal-name"
                  placeholder="e.g. Emergency Fund"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal-target" className="text-sm font-medium">Target Amount</Label>
                <Input
                  id="goal-target"
                  type="number"
                  placeholder="10000"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  min={0}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal-deadline" className="text-sm font-medium">Deadline</Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Choose an Emoji</Label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setGoalEmoji(em)}
                      className={cn(
                        'flex size-10 items-center justify-center rounded-lg text-xl transition-all hover:scale-110',
                        goalEmoji === em
                          ? 'bg-emerald-500/20 ring-2 ring-emerald-500'
                          : 'hover:bg-muted'
                      )}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={handleNext}
            >
              Skip this step
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col items-center text-center space-y-6 animate-scale-in" key="done-step">
            <div className="relative w-full h-32 flex items-center justify-center overflow-hidden">
              {confetti.map((c, i) => (
                <ConfettiEmoji key={i} emoji={c.emoji} delay={c.delay} left={c.left} />
              ))}
              <span className="relative z-10 text-6xl">🎉</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-bold">
                {name.trim() ? `You're all set, ${name.trim()}! 🎉` : "You're all set! 🎉"}
              </h2>
              <p className="text-muted-foreground text-lg">
                Welcome aboard! Start tracking your finances and reach your goals.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs text-sm">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-muted-foreground">Currency</p>
                <p className="font-semibold">{currency}</p>
              </div>
              {goalName.trim() && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-muted-foreground">First Goal</p>
                  <p className="font-semibold">{goalEmoji} {goalName.trim()}</p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="animate-fade-in w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-6 px-2">
          <div className="flex items-center gap-2 mb-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <React.Fragment key={i}>
                <div
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-all duration-500',
                    i <= step
                      ? 'bg-emerald-500'
                      : 'bg-white/20'
                  )}
                />
              </React.Fragment>
            ))}
          </div>
          <p className="text-xs text-white/60 text-right">{step + 1} of {totalSteps}</p>
        </div>

        {/* Step Card */}
        <Card className="border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            <div
              className={cn(
                'transition-all duration-300',
                direction === 'forward' ? 'animate-slide-up' : 'animate-fade-in'
              )}
              key={step}
            >
              {stepContent}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-4">
              <div>
                {step > 0 && step < totalSteps - 1 && (
                  <Button variant="ghost" onClick={handleBack} className="text-muted-foreground">
                    <ArrowLeft className="size-4 mr-1" />
                    Back
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {step < totalSteps - 1 && step !== 3 && (
                  <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                    Skip for now
                  </Button>
                )}

                {step < totalSteps - 1 && (
                  <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {step === 0 ? 'Get Started' : 'Continue'}
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                )}

                {step === totalSteps - 1 && (
                  <Button onClick={handleFinish} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px]">
                    Go to Dashboard
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { type FinTrackState, type Transaction, type Budget, type Goal, type Settings, type CurrencyCode } from './types';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$', EUR: '€', GBP: '£', BDT: '৳', INR: '₹', JPY: '¥', CAD: 'CA$', AUD: 'A$',
};

const DEFAULT_INCOME_CATS = ['Salary', 'Freelance', 'Business', 'Investment', 'Rental', 'Gift', 'Other Income'];
const DEFAULT_EXPENSE_CATS = ['Food & Dining', 'Transportation', 'Shopping', 'Housing', 'Utilities', 'Healthcare', 'Entertainment', 'Education', 'Personal Care', 'Travel', 'Insurance', 'Savings', 'Other Expense'];

const DEFAULT_SETTINGS: Settings = {
  userName: '',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  savingsTarget: 20,
  incomeCategories: [...DEFAULT_INCOME_CATS],
  expenseCategories: [...DEFAULT_EXPENSE_CATS],
};

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function addPeriod(dateStr: string, freq: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  if (freq === 'daily') d.setDate(d.getDate() + 1);
  else if (freq === 'weekly') d.setDate(d.getDate() + 7);
  else if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (freq === 'yearly') d.setFullYear(d.getFullYear() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Load from localStorage
function loadState(): { transactions: Transaction[]; budgets: Budget[]; goals: Goal[]; settings: Settings } {
  if (typeof window === 'undefined') return { transactions: [], budgets: [], goals: [], settings: DEFAULT_SETTINGS };
  try {
    const t = localStorage.getItem('ftp_transactions');
    const b = localStorage.getItem('ftp_budgets');
    const g = localStorage.getItem('ftp_goals');
    const s = localStorage.getItem('ftp_settings');
    let settings = s ? JSON.parse(s) : DEFAULT_SETTINGS;
    // Merge categories (union) so no custom categories are lost
    if (settings.incomeCategories) {
      settings.incomeCategories = [...new Set([...DEFAULT_INCOME_CATS, ...settings.incomeCategories])].sort();
    }
    if (settings.expenseCategories) {
      settings.expenseCategories = [...new Set([...DEFAULT_EXPENSE_CATS, ...settings.expenseCategories])].sort();
    }
    return {
      transactions: t ? JSON.parse(t) : [],
      budgets: b ? JSON.parse(b) : [],
      goals: g ? JSON.parse(g) : [],
      settings: { ...DEFAULT_SETTINGS, ...settings },
    };
  } catch {
    return { transactions: [], budgets: [], goals: [], settings: DEFAULT_SETTINGS };
  }
}

function seedSampleData(): { transactions: Transaction[]; budgets: Budget[]; goals: Goal[] } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const pm = now.getMonth() === 0 ? `${y - 1}-12` : `${y}-${String(now.getMonth()).padStart(2, '0')}`;

  const txns: Transaction[] = [
    { id: uid(), type: 'income', amount: 5000, date: `${y}-${m}-01`, description: 'Monthly Salary', category: 'Salary', payment: 'bank', recurring: true, recurringFreq: 'monthly', createdAt: new Date().toISOString() },
    { id: uid(), type: 'income', amount: 850, date: `${y}-${m}-05`, description: 'Freelance Project', category: 'Freelance', payment: 'bank', notes: 'Web design project', createdAt: new Date().toISOString() },
    { id: uid(), type: 'income', amount: 200, date: `${y}-${m}-12`, description: 'Stock Dividend', category: 'Investment', payment: 'bank', createdAt: new Date().toISOString() },
    { id: uid(), type: 'expense', amount: 1200, date: `${y}-${m}-01`, description: 'Rent Payment', category: 'Housing', payment: 'bank', recurring: true, recurringFreq: 'monthly', createdAt: new Date().toISOString() },
    { id: uid(), type: 'expense', amount: 320, date: `${y}-${m}-03`, description: 'Grocery Shopping', category: 'Food & Dining', payment: 'card', createdAt: new Date().toISOString() },
    { id: uid(), type: 'expense', amount: 45, date: `${y}-${m}-04`, description: 'Internet Bill', category: 'Utilities', payment: 'card', recurring: true, recurringFreq: 'monthly', createdAt: new Date().toISOString() },
    { id: uid(), type: 'expense', amount: 80, date: `${y}-${m}-06`, description: 'Restaurant Dinner', category: 'Food & Dining', payment: 'card', createdAt: new Date().toISOString() },
    { id: uid(), type: 'expense', amount: 150, date: `${y}-${m}-08`, description: 'Transport / Uber', category: 'Transportation', payment: 'mobile', createdAt: new Date().toISOString() },
    { id: uid(), type: 'expense', amount: 60, date: `${y}-${m}-10`, description: 'Netflix & Spotify', category: 'Entertainment', payment: 'card', recurring: true, recurringFreq: 'monthly', createdAt: new Date().toISOString() },
    { id: uid(), type: 'expense', amount: 200, date: `${y}-${m}-14`, description: 'Clothing & Shoes', category: 'Shopping', payment: 'card', createdAt: new Date().toISOString() },
    { id: uid(), type: 'expense', amount: 30, date: `${y}-${m}-15`, description: 'Doctor Visit', category: 'Healthcare', payment: 'cash', createdAt: new Date().toISOString() },
    { id: uid(), type: 'expense', amount: 100, date: `${y}-${m}-18`, description: 'Online Course', category: 'Education', payment: 'card', createdAt: new Date().toISOString() },
    { id: uid(), type: 'expense', amount: 250, date: `${y}-${m}-20`, description: 'Weekend Trip', category: 'Travel', payment: 'card', createdAt: new Date().toISOString() },
    // Previous month
    { id: uid(), type: 'income', amount: 5000, date: `${pm}-01`, description: 'Monthly Salary', category: 'Salary', payment: 'bank', createdAt: new Date().toISOString() },
    { id: uid(), type: 'expense', amount: 1200, date: `${pm}-01`, description: 'Rent Payment', category: 'Housing', payment: 'bank', createdAt: new Date().toISOString() },
    { id: uid(), type: 'expense', amount: 290, date: `${pm}-05`, description: 'Grocery Shopping', category: 'Food & Dining', payment: 'card', createdAt: new Date().toISOString() },
    { id: uid(), type: 'expense', amount: 45, date: `${pm}-04`, description: 'Internet Bill', category: 'Utilities', payment: 'card', createdAt: new Date().toISOString() },
    { id: uid(), type: 'expense', amount: 120, date: `${pm}-12`, description: 'Transport', category: 'Transportation', payment: 'mobile', createdAt: new Date().toISOString() },
  ];

  const budgets: Budget[] = [
    { id: uid(), category: 'Food & Dining', amount: 600 },
    { id: uid(), category: 'Transportation', amount: 250 },
    { id: uid(), category: 'Entertainment', amount: 150 },
    { id: uid(), category: 'Shopping', amount: 300 },
    { id: uid(), category: 'Housing', amount: 1500 },
  ];

  const goals: Goal[] = [
    { id: uid(), name: 'Emergency Fund', target: 10000, saved: 3500, deadline: '2026-12-31', emoji: '💰' },
    { id: uid(), name: 'Dream Vacation', target: 5000, saved: 1200, deadline: '2026-08-01', emoji: '✈️' },
    { id: uid(), name: 'New Laptop', target: 2000, saved: 800, deadline: '2026-06-01', emoji: '💻' },
  ];

  return { transactions: txns, budgets, goals };
}

import { create } from 'zustand';

export const useFinTrackStore = create<FinTrackState>((set, get) => {
  const saved = loadState();

  return {
    transactions: saved.transactions,
    budgets: saved.budgets,
    goals: saved.goals,
    settings: saved.settings,
    currentPage: 'dashboard',
    period: 'month',

    addTransaction: (t) => set((s) => {
      const txn: Transaction = { ...t, id: t.id || uid(), createdAt: new Date().toISOString() } as Transaction;
      const exists = s.transactions.find(x => x.id === txn.id);
      const transactions = exists
        ? s.transactions.map(x => x.id === txn.id ? txn : x)
        : [txn, ...s.transactions];
      return { transactions };
    }),

    updateTransaction: (t) => set((s) => ({
      transactions: s.transactions.map(x => x.id === t.id ? t : x),
    })),

    removeTransaction: (id) => set((s) => ({
      transactions: s.transactions.filter(x => x.id !== id),
    })),

    addBudget: (b) => set((s) => {
      const budget: Budget = { ...b, id: b.id || uid() } as Budget;
      const exists = s.budgets.find(x => x.id === budget.id);
      const budgets = exists
        ? s.budgets.map(x => x.id === budget.id ? budget : x)
        : [...s.budgets, budget];
      return { budgets };
    }),

    updateBudget: (b) => set((s) => ({
      budgets: s.budgets.map(x => x.id === b.id ? b : x),
    })),

    removeBudget: (id) => set((s) => ({
      budgets: s.budgets.filter(x => x.id !== id),
    })),

    addGoal: (g) => set((s) => {
      const goal: Goal = { ...g, id: g.id || uid() } as Goal;
      const exists = s.goals.find(x => x.id === goal.id);
      const goals = exists
        ? s.goals.map(x => x.id === goal.id ? goal : x)
        : [...s.goals, goal];
      return { goals };
    }),

    updateGoal: (g) => set((s) => ({
      goals: s.goals.map(x => x.id === g.id ? g : x),
    })),

    removeGoal: (id) => set((s) => ({
      goals: s.goals.filter(x => x.id !== id),
    })),

    addGoalContribution: (id, amount) => set((s) => ({
      goals: s.goals.map(g => g.id === id ? { ...g, saved: g.saved + amount } : g),
    })),

    updateSettings: (partial) => set((s) => ({
      settings: { ...s.settings, ...partial },
    })),

    addCategory: (type, name) => set((s) => {
      const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
      const cats = s.settings[key];
      if (cats.includes(name)) return s;
      return { settings: { ...s.settings, [key]: [...cats, name].sort() } };
    }),

    removeCategory: (type, name) => set((s) => {
      const key = type === 'income' ? 'incomeCategories' : 'expenseCategories';
      return { settings: { ...s.settings, [key]: s.settings[key].filter(c => c !== name) } };
    }),

    setPage: (page) => set({ currentPage: page }),
    setPeriod: (period) => set({ period }),

    clearAll: () => set({ transactions: [], budgets: [], goals: [], settings: DEFAULT_SETTINGS }),

    importData: (data) => {
      try {
        const partial: Partial<FinTrackState> = {};
        if (data.transactions) partial.transactions = data.transactions as Transaction[];
        if (data.budgets) partial.budgets = data.budgets as Budget[];
        if (data.goals) partial.goals = data.goals as Goal[];
        if (data.settings) {
          const saved = data.settings as Settings;
          partial.settings = { ...DEFAULT_SETTINGS, ...saved };
        }
        set(partial);
      } catch { /* ignore */ }
    },

    initSampleData: () => {
      if (get().transactions.length > 0) return;
      const { transactions, budgets, goals } = seedSampleData();
      set({ transactions, budgets, goals });
    },

    processRecurring: () => {
      const state = get();
      const today = todayStr();
      const newTxns: Transaction[] = [];

      state.transactions.forEach(t => {
        if (!t.recurring || !t.recurringFreq || !t.date) return;
        let lastDate = t.lastGenerated || t.date;
        let nextDate = addPeriod(lastDate, t.recurringFreq);
        let count = 0;
        while (nextDate <= today && count < 12) {
          newTxns.push({
            ...t,
            id: uid(),
            date: nextDate,
            createdAt: new Date().toISOString(),
            lastGenerated: undefined,
            sourceId: t.id,
          });
          lastDate = nextDate;
          nextDate = addPeriod(lastDate, t.recurringFreq);
          count++;
        }
      });

      if (newTxns.length > 0) {
        set({ transactions: [...newTxns, ...state.transactions] });
      }
    },
  };
});

// Persist to localStorage on every state change
if (typeof window !== 'undefined') {
  useFinTrackStore.subscribe((state) => {
    try {
      localStorage.setItem('ftp_transactions', JSON.stringify(state.transactions));
      localStorage.setItem('ftp_budgets', JSON.stringify(state.budgets));
      localStorage.setItem('ftp_goals', JSON.stringify(state.goals));
      localStorage.setItem('ftp_settings', JSON.stringify(state.settings));
    } catch { /* quota exceeded */ }
  });
}

export { CURRENCY_SYMBOLS, uid, todayStr, currentMonth, DEFAULT_INCOME_CATS, DEFAULT_EXPENSE_CATS };

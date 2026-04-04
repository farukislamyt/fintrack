export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  description: string;
  category: string;
  payment: 'cash' | 'card' | 'bank' | 'mobile' | 'other';
  notes?: string;
  recurring?: boolean;
  recurringFreq?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  lastGenerated?: string;
  sourceId?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline?: string;
  emoji: string;
}

export interface Loan {
  id: string;
  name: string;
  type: 'mortgage' | 'car' | 'personal' | 'student' | 'other';
  principal: number;
  annualRate: number;
  termMonths: number;
  startDate: string;
  emoji: string;
  notes?: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  date: string;
  amount: number;
  principalPortion: number;
  interestPortion: number;
  remainingBalance: number;
}

export interface Settings {
  userName: string;
  currency: CurrencyCode;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  savingsTarget: number;
  incomeCategories: string[];
  expenseCategories: string[];
  onboardingComplete: boolean;
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'BDT' | 'INR' | 'JPY' | 'CAD' | 'AUD';

export type PageId = 'dashboard' | 'transactions' | 'budget' | 'goals' | 'loans' | 'reports' | 'settings';

export interface FinTrackState {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  loans: Loan[];
  loanPayments: LoanPayment[];
  settings: Settings;
  currentPage: PageId;
  period: 'week' | 'month' | 'year' | 'all';
  // Transaction actions
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  updateTransaction: (t: Transaction) => void;
  removeTransaction: (id: string) => void;
  // Budget actions
  addBudget: (b: Omit<Budget, 'id'> & { id?: string }) => void;
  updateBudget: (b: Budget) => void;
  removeBudget: (id: string) => void;
  // Goal actions
  addGoal: (g: Omit<Goal, 'id'> & { id?: string }) => void;
  updateGoal: (g: Goal) => void;
  removeGoal: (id: string) => void;
  addGoalContribution: (id: string, amount: number) => void;
  withdrawGoalContribution: (id: string, amount: number) => void;
  // Loan actions
  addLoan: (l: Omit<Loan, 'id'> & { id?: string }) => void;
  updateLoan: (l: Loan) => void;
  removeLoan: (id: string) => void;
  addLoanPayment: (p: Omit<LoanPayment, 'id'> & { id?: string }) => void;
  // Settings
  updateSettings: (s: Partial<Settings>) => void;
  addCategory: (type: 'income' | 'expense', name: string) => void;
  removeCategory: (type: 'income' | 'expense', name: string) => void;
  // Navigation
  setPage: (page: PageId) => void;
  setPeriod: (period: 'week' | 'month' | 'year' | 'all') => void;
  // Data management
  clearAll: () => void;
  importData: (data: Record<string, unknown>) => void;
  initSampleData: () => void;
  processRecurring: () => void;
}

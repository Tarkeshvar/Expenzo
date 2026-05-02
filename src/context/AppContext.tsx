import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { AppState, Transaction, Budget, Reminder, UserProfile } from '../constants/types';
import { loadState, saveState, defaultState } from '../utils/storage';
import uuid from 'react-native-uuid';

type Action =
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'ADD_TRANSACTION'; payload: Omit<Transaction, 'id' | 'createdAt'> }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_BUDGET'; payload: Omit<Budget, 'id' | 'createdAt'> }
  | { type: 'UPDATE_BUDGET'; payload: Budget }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'ADD_REMINDER'; payload: Omit<Reminder, 'id' | 'createdAt'> }
  | { type: 'UPDATE_REMINDER'; payload: Reminder }
  | { type: 'DELETE_REMINDER'; payload: string }
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESET_ALL' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_STATE': return action.payload;
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [{ ...action.payload, id: uuid.v4() as string, createdAt: new Date().toISOString() }, ...state.transactions] };
    case 'UPDATE_TRANSACTION':
      return { ...state, transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
    case 'ADD_BUDGET':
      return { ...state, budgets: [...state.budgets.filter(b => b.category !== action.payload.category), { ...action.payload, id: uuid.v4() as string, createdAt: new Date().toISOString() }] };
    case 'UPDATE_BUDGET':
      return { ...state, budgets: state.budgets.map(b => b.id === action.payload.id ? action.payload : b) };
    case 'DELETE_BUDGET':
      return { ...state, budgets: state.budgets.filter(b => b.id !== action.payload) };
    case 'ADD_REMINDER':
      return { ...state, reminders: [{ ...action.payload, id: uuid.v4() as string, createdAt: new Date().toISOString() }, ...(state.reminders || [])] };
    case 'UPDATE_REMINDER':
      return { ...state, reminders: (state.reminders || []).map(r => r.id === action.payload.id ? action.payload : r) };
    case 'DELETE_REMINDER':
      return { ...state, reminders: (state.reminders || []).filter(r => r.id !== action.payload) };
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingComplete: true };
    case 'RESET_ALL':
      return { ...defaultState, onboardingComplete: false };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  isLoading: boolean;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addBudget: (b: Omit<Budget, 'id' | 'createdAt'>) => void;
  updateBudget: (b: Budget) => void;
  deleteBudget: (id: string) => void;
  addReminder: (r: Omit<Reminder, 'id' | 'createdAt'>) => void;
  updateReminder: (r: Reminder) => void;
  deleteReminder: (id: string) => void;
  updateProfile: (p: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  resetAll: () => void;
  getMonthlyStats: (monthKey: string) => { income: number; expense: number; balance: number };
  getYearlyStats: (year: number) => { income: number; expense: number; balance: number };
  getCategorySpend: (monthKey: string) => Record<string, number>;
  getYearlyCategorySpend: (year: number) => Record<string, number>;
  getBudgetUsage: (categoryId: string) => { spent: number; limit: number; percentage: number } | null;
  getRecentTransactions: (limit?: number) => Transaction[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { ...defaultState });
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    loadState().then(saved => { dispatch({ type: 'LOAD_STATE', payload: saved }); setIsLoading(false); });
  }, []);

  useEffect(() => { if (!isLoading) saveState(state); }, [state, isLoading]);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt'>) => dispatch({ type: 'ADD_TRANSACTION', payload: t }), []);
  const updateTransaction = useCallback((t: Transaction) => dispatch({ type: 'UPDATE_TRANSACTION', payload: t }), []);
  const deleteTransaction = useCallback((id: string) => dispatch({ type: 'DELETE_TRANSACTION', payload: id }), []);
  const addBudget = useCallback((b: Omit<Budget, 'id' | 'createdAt'>) => dispatch({ type: 'ADD_BUDGET', payload: b }), []);
  const updateBudget = useCallback((b: Budget) => dispatch({ type: 'UPDATE_BUDGET', payload: b }), []);
  const deleteBudget = useCallback((id: string) => dispatch({ type: 'DELETE_BUDGET', payload: id }), []);
  const addReminder = useCallback((r: Omit<Reminder, 'id' | 'createdAt'>) => dispatch({ type: 'ADD_REMINDER', payload: r }), []);
  const updateReminder = useCallback((r: Reminder) => dispatch({ type: 'UPDATE_REMINDER', payload: r }), []);
  const deleteReminder = useCallback((id: string) => dispatch({ type: 'DELETE_REMINDER', payload: id }), []);
  const updateProfile = useCallback((p: Partial<UserProfile>) => dispatch({ type: 'UPDATE_PROFILE', payload: p }), []);
  const completeOnboarding = useCallback(() => dispatch({ type: 'COMPLETE_ONBOARDING' }), []);
  const resetAll = useCallback(() => dispatch({ type: 'RESET_ALL' }), []);

  const getMonthlyStats = useCallback((monthKey: string) => {
    const txns = state.transactions.filter(t => t.date.startsWith(monthKey));
    const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [state.transactions]);

  const getYearlyStats = useCallback((year: number) => {
    const txns = state.transactions.filter(t => t.date.startsWith(String(year)));
    const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [state.transactions]);

  const getCategorySpend = useCallback((monthKey: string) => {
    const txns = state.transactions.filter(t => t.type === 'expense' && t.date.startsWith(monthKey));
    return txns.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {} as Record<string, number>);
  }, [state.transactions]);

  const getYearlyCategorySpend = useCallback((year: number) => {
    const txns = state.transactions.filter(t => t.type === 'expense' && t.date.startsWith(String(year)));
    return txns.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {} as Record<string, number>);
  }, [state.transactions]);

  const getBudgetUsage = useCallback((categoryId: string) => {
    const budget = state.budgets.find(b => b.category === categoryId);
    if (!budget) return null;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const spent = state.transactions.filter(t => t.type === 'expense' && t.category === categoryId && t.date.startsWith(monthKey)).reduce((s, t) => s + t.amount, 0);
    return { spent, limit: budget.limit, percentage: Math.min(100, (spent / budget.limit) * 100) };
  }, [state.transactions, state.budgets]);

  const getRecentTransactions = useCallback((limit = 10) => {
    return [...state.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
  }, [state.transactions]);

  return (
    <AppContext.Provider value={{
      state, isLoading,
      addTransaction, updateTransaction, deleteTransaction,
      addBudget, updateBudget, deleteBudget,
      addReminder, updateReminder, deleteReminder,
      updateProfile, completeOnboarding, resetAll,
      getMonthlyStats, getYearlyStats,
      getCategorySpend, getYearlyCategorySpend,
      getBudgetUsage, getRecentTransactions,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

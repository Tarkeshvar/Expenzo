export type TransactionType = "expense" | "income";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  title: string;
  note?: string;
  date: string; // ISO string
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: "monthly" | "weekly";
  createdAt: string;
}

export interface UserProfile {
  name: string;
  currency: string;
  monthlyBudget: number;
  createdAt: string;
}

export type ReminderType = "gave" | "took" | "note";
export type ReminderStatus = "pending" | "settled";

export interface Reminder {
  id: string;
  type: ReminderType;
  // Money fields (used when type === 'gave' | 'took')
  amount: number;
  person: string;
  note?: string;
  status: ReminderStatus;
  settledAt?: string;
  // Note fields (used when type === 'note')
  noteTitle?: string;
  noteBody?: string;
  // Common
  date: string;
  createdAt: string;
}

export interface AppState {
  transactions: Transaction[];
  budgets: Budget[];
  reminders: Reminder[];
  profile: UserProfile;
  onboardingComplete: boolean;
}

export interface MonthlySummary {
  month: string;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Record<string, number>;
}

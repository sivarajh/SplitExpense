// TypeScript types mirroring the Supabase database schema (see supabase/schema.sql).

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
  // Joined profile (when selected with a relation).
  profile?: Profile;
}

export type SplitMode = 'equal' | 'exact' | 'percent';

export interface Expense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  paid_by: string;
  category: string | null;
  expense_date: string;
  created_by: string;
  created_at: string;
  // Joined relations (when selected).
  splits?: ExpenseSplit[];
  payer?: Profile;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  created_at: string;
  // Joined relation (when selected).
  profile?: Profile;
}

export interface Settlement {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  note: string | null;
  created_at: string;
  // Joined relations (when selected).
  from_profile?: Profile;
  to_profile?: Profile;
}

// A single split share used when creating an expense.
export interface SplitShare {
  userId: string;
  amount: number;
}

// A simplified transfer suggestion: `from` should pay `to` `amount`.
export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

// Unified activity feed entry.
export type ActivityItem =
  | { kind: 'expense'; id: string; date: string; expense: Expense; groupName: string }
  | { kind: 'settlement'; id: string; date: string; settlement: Settlement; groupName: string };

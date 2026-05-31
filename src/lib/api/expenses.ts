import { supabase } from '../supabase';
import type { Expense, SplitShare } from '../types';

export interface NewExpenseInput {
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  category?: string | null;
  expenseDate?: string | null;
  splits: SplitShare[];
}

// Inserts an expense and its splits atomically via the add_expense_with_splits RPC.
export async function addExpense(input: NewExpenseInput): Promise<string> {
  const { data, error } = await supabase.rpc('add_expense_with_splits', {
    p_group_id: input.groupId,
    p_description: input.description.trim(),
    p_amount: input.amount,
    p_paid_by: input.paidBy,
    p_category: input.category ?? null,
    p_expense_date: input.expenseDate ?? null,
    p_splits: input.splits.map((s) => ({ user_id: s.userId, amount: s.amount })),
  });
  if (error) throw error;
  return data as string;
}

export async function getExpense(expenseId: string): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .select(
      '*, payer:profiles!expenses_paid_by_fkey(*), splits:expense_splits(*, profile:profiles(*))'
    )
    .eq('id', expenseId)
    .single();
  if (error) throw error;
  return data as unknown as Expense;
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw error;
}

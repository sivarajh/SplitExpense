import { supabase } from '../supabase';
import type { ActivityItem, Expense, Settlement } from '../types';
import { listMyGroups } from './groups';

// Builds a unified, newest-first activity feed across all of the user's groups.
export async function getActivity(limit = 50): Promise<ActivityItem[]> {
  const groups = await listMyGroups();
  if (groups.length === 0) return [];

  const groupIds = groups.map((g) => g.id);
  const groupNames: Record<string, string> = Object.fromEntries(
    groups.map((g) => [g.id, g.name])
  );

  const [expensesRes, settlementsRes] = await Promise.all([
    supabase
      .from('expenses')
      .select('*, payer:profiles!expenses_paid_by_fkey(*), splits:expense_splits(*)')
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('settlements')
      .select(
        '*, from_profile:profiles!settlements_from_user_fkey(*), to_profile:profiles!settlements_to_user_fkey(*)'
      )
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  if (expensesRes.error) throw expensesRes.error;
  if (settlementsRes.error) throw settlementsRes.error;

  const expenses = (expensesRes.data ?? []) as unknown as Expense[];
  const settlements = (settlementsRes.data ?? []) as unknown as Settlement[];

  const items: ActivityItem[] = [
    ...expenses.map(
      (e): ActivityItem => ({
        kind: 'expense',
        id: e.id,
        date: e.created_at,
        expense: e,
        groupName: groupNames[e.group_id] ?? 'Group',
      })
    ),
    ...settlements.map(
      (s): ActivityItem => ({
        kind: 'settlement',
        id: s.id,
        date: s.created_at,
        settlement: s,
        groupName: groupNames[s.group_id] ?? 'Group',
      })
    ),
  ];

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return items.slice(0, limit);
}

import { supabase } from '../supabase';
import type { Expense, ExpenseSplit, Group, GroupMember, Profile, Settlement } from '../types';

// Groups the current user belongs to (RLS already restricts to the user's groups).
export async function listMyGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Group[];
}

export async function getGroup(groupId: string): Promise<Group> {
  const { data, error } = await supabase.from('groups').select('*').eq('id', groupId).single();
  if (error) throw error;
  return data as Group;
}

// Create a group and add the creator as the first member, atomically.
// Uses the create_group RPC so both inserts happen in one transaction and the
// new row is returned without tripping the "must be a member to read" RLS policy.
// (userId is kept for call-site compatibility; the RPC uses auth.uid() server-side.)
export async function createGroup(name: string, _userId?: string): Promise<Group> {
  const { data, error } = await supabase.rpc('create_group', { p_name: name.trim() });
  if (error) throw error;
  return data as Group;
}

export interface GroupData {
  members: GroupMember[];
  expenses: Expense[];
  splits: ExpenseSplit[];
  settlements: Settlement[];
}

// Everything needed to render a group detail screen and compute balances.
export async function getGroupData(groupId: string): Promise<GroupData> {
  const [membersRes, expensesRes, settlementsRes] = await Promise.all([
    supabase
      .from('group_members')
      .select('*, profile:profiles(*)')
      .eq('group_id', groupId),
    supabase
      .from('expenses')
      .select('*, payer:profiles!expenses_paid_by_fkey(*), splits:expense_splits(*)')
      .eq('group_id', groupId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('settlements')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false }),
  ]);

  if (membersRes.error) throw membersRes.error;
  if (expensesRes.error) throw expensesRes.error;
  if (settlementsRes.error) throw settlementsRes.error;

  const members = (membersRes.data ?? []) as unknown as GroupMember[];
  const expenses = (expensesRes.data ?? []) as unknown as Expense[];
  const settlements = (settlementsRes.data ?? []) as unknown as Settlement[];
  const splits = expenses.flatMap((e) => e.splits ?? []);

  return { members, expenses, splits, settlements };
}

// Convenience: a userId -> Profile map for the members of a group.
export function profileMap(members: GroupMember[]): Record<string, Profile> {
  const map: Record<string, Profile> = {};
  for (const m of members) {
    if (m.profile) map[m.user_id] = m.profile;
  }
  return map;
}

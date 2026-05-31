import { supabase } from '../supabase';
import type { GroupMember } from '../types';
import { findProfileByEmail } from './profiles';

export async function listMembers(groupId: string): Promise<GroupMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('*, profile:profiles(*)')
    .eq('group_id', groupId);
  if (error) throw error;
  return (data ?? []) as unknown as GroupMember[];
}

// Add an existing user (by email) to a group. Returns a friendly error message
// when the person hasn't signed up yet.
export async function addMemberByEmail(
  groupId: string,
  email: string
): Promise<{ ok: boolean; message?: string }> {
  const profile = await findProfileByEmail(email);
  if (!profile) {
    return { ok: false, message: `No SplitExpense user found with email "${email}".` };
  }

  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: profile.id });

  if (error) {
    // Unique-violation => already a member.
    if (error.code === '23505') {
      return { ok: false, message: `${profile.full_name ?? email} is already in this group.` };
    }
    throw error;
  }
  return { ok: true };
}

export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase.from('group_members').delete().eq('id', memberId);
  if (error) throw error;
}

import { supabase } from '../supabase';
import type { Profile } from '../types';

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(userId: string, fullName: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', userId);
  if (error) throw error;
}

// Look up a profile by exact email (used to add members to a group).
export async function findProfileByEmail(email: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', email.trim())
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

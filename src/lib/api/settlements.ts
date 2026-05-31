import { supabase } from '../supabase';
import type { Settlement } from '../types';

export interface NewSettlementInput {
  groupId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  note?: string | null;
}

export async function addSettlement(input: NewSettlementInput): Promise<Settlement> {
  const { data, error } = await supabase
    .from('settlements')
    .insert({
      group_id: input.groupId,
      from_user: input.fromUser,
      to_user: input.toUser,
      amount: input.amount,
      note: input.note ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Settlement;
}

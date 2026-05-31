// Pure balance + debt-simplification logic. Works in integer cents internally.
import type { Expense, ExpenseSplit, Settlement, Transfer } from './types';
import { fromCents, toCents } from './splits';

/**
 * Net balance per user, in dollars. Positive = the user is owed money overall;
 * negative = the user owes money overall. Balances always sum to ~0.
 *
 * For each expense: the payer is credited the full amount, and every split
 * participant is debited their share. For each settlement: the payer (`from`)
 * reduces what they owe (credited), the receiver (`to`) is debited.
 */
export function computeBalances(
  expenses: Expense[],
  splits: ExpenseSplit[],
  settlements: Settlement[],
  memberIds: string[]
): Record<string, number> {
  const cents: Record<string, number> = {};
  for (const id of memberIds) cents[id] = 0;

  const ensure = (id: string) => {
    if (cents[id] === undefined) cents[id] = 0;
  };

  const splitsByExpense = new Map<string, ExpenseSplit[]>();
  for (const s of splits) {
    const arr = splitsByExpense.get(s.expense_id) ?? [];
    arr.push(s);
    splitsByExpense.set(s.expense_id, arr);
  }

  for (const exp of expenses) {
    ensure(exp.paid_by);
    cents[exp.paid_by] += toCents(exp.amount);
    const expSplits = exp.splits ?? splitsByExpense.get(exp.id) ?? [];
    for (const sp of expSplits) {
      ensure(sp.user_id);
      cents[sp.user_id] -= toCents(sp.amount);
    }
  }

  for (const st of settlements) {
    ensure(st.from_user);
    ensure(st.to_user);
    cents[st.from_user] += toCents(st.amount);
    cents[st.to_user] -= toCents(st.amount);
  }

  const result: Record<string, number> = {};
  for (const [id, c] of Object.entries(cents)) result[id] = fromCents(c);
  return result;
}

/**
 * Reduce a set of net balances to a minimal-ish list of transfers using a greedy
 * largest-creditor / largest-debtor matching. Each returned transfer says
 * `from` should pay `to` `amount` (dollars).
 */
export function simplifyDebts(balances: Record<string, number>): Transfer[] {
  // Work in cents so comparisons are exact.
  const creditors: { id: string; cents: number }[] = [];
  const debtors: { id: string; cents: number }[] = [];

  for (const [id, amount] of Object.entries(balances)) {
    const c = toCents(amount);
    if (c > 0) creditors.push({ id, cents: c });
    else if (c < 0) debtors.push({ id, cents: -c });
  }

  // Largest first for fewer, larger transfers.
  creditors.sort((a, b) => b.cents - a.cents);
  debtors.sort((a, b) => b.cents - a.cents);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const pay = Math.min(debtor.cents, creditor.cents);
    if (pay > 0) {
      transfers.push({ from: debtor.id, to: creditor.id, amount: fromCents(pay) });
    }
    debtor.cents -= pay;
    creditor.cents -= pay;
    if (debtor.cents === 0) i += 1;
    if (creditor.cents === 0) j += 1;
  }

  return transfers;
}

/** Net balance for a single user from a balances map (0 if absent). */
export function balanceFor(balances: Record<string, number>, userId: string): number {
  return balances[userId] ?? 0;
}

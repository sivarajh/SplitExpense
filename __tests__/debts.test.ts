import { describe, expect, it } from '@jest/globals';

import { computeBalances, simplifyDebts } from '../src/lib/debts';
import type { Expense, ExpenseSplit, Settlement } from '../src/lib/types';

function expense(id: string, paidBy: string, amount: number): Expense {
  return {
    id,
    group_id: 'g1',
    description: id,
    amount,
    paid_by: paidBy,
    category: null,
    expense_date: '2026-01-01',
    created_by: paidBy,
    created_at: '2026-01-01T00:00:00Z',
  };
}

function split(expenseId: string, userId: string, amount: number): ExpenseSplit {
  return {
    id: `${expenseId}-${userId}`,
    expense_id: expenseId,
    user_id: userId,
    amount,
    created_at: '2026-01-01T00:00:00Z',
  };
}

function settlement(from: string, to: string, amount: number): Settlement {
  return {
    id: `${from}-${to}`,
    group_id: 'g1',
    from_user: from,
    to_user: to,
    amount,
    note: null,
    created_at: '2026-01-02T00:00:00Z',
  };
}

describe('computeBalances', () => {
  it('credits the payer and debits split participants', () => {
    const expenses = [expense('e1', 'a', 30)];
    const splits = [split('e1', 'a', 10), split('e1', 'b', 10), split('e1', 'c', 10)];
    const balances = computeBalances(expenses, splits, [], ['a', 'b', 'c']);
    expect(balances.a).toBeCloseTo(20, 2);
    expect(balances.b).toBeCloseTo(-10, 2);
    expect(balances.c).toBeCloseTo(-10, 2);
  });

  it('balances sum to zero', () => {
    const expenses = [expense('e1', 'a', 30), expense('e2', 'b', 9)];
    const splits = [
      split('e1', 'a', 10),
      split('e1', 'b', 10),
      split('e1', 'c', 10),
      split('e2', 'a', 3),
      split('e2', 'b', 3),
      split('e2', 'c', 3),
    ];
    const balances = computeBalances(expenses, splits, [], ['a', 'b', 'c']);
    const total = Object.values(balances).reduce((acc, v) => acc + v, 0);
    expect(Math.round(total * 100)).toBe(0);
  });

  it('settlements reduce balances', () => {
    const expenses = [expense('e1', 'a', 30)];
    const splits = [split('e1', 'a', 10), split('e1', 'b', 10), split('e1', 'c', 10)];
    const settlements = [settlement('b', 'a', 10)];
    const balances = computeBalances(expenses, splits, settlements, ['a', 'b', 'c']);
    expect(balances.a).toBeCloseTo(10, 2);
    expect(balances.b).toBeCloseTo(0, 2);
    expect(balances.c).toBeCloseTo(-10, 2);
  });
});

describe('simplifyDebts', () => {
  it('produces transfers that net out the balances', () => {
    const transfers = simplifyDebts({ a: 20, b: -10, c: -10 });
    expect(transfers).toHaveLength(2);
    // Both debtors pay creditor a.
    for (const t of transfers) expect(t.to).toBe('a');
    const totalToA = transfers.reduce((acc, t) => acc + t.amount, 0);
    expect(totalToA).toBeCloseTo(20, 2);
  });

  it('returns no transfers when everyone is settled', () => {
    expect(simplifyDebts({ a: 0, b: 0 })).toEqual([]);
  });

  it('minimizes transfers in a circular-debt scenario', () => {
    // a owes 10, b owes 10, c is owed 20 -> 2 transfers, not 3.
    const transfers = simplifyDebts({ a: -10, b: -10, c: 20 });
    expect(transfers).toHaveLength(2);
  });
});

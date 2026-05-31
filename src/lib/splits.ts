// Pure split-calculation logic. All arithmetic is done in integer cents so the
// individual shares always sum back exactly to the original amount (no penny drift).
import type { SplitShare } from './types';

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Split `amount` evenly across `userIds`. Any leftover cents (when the amount
 * doesn't divide evenly) are distributed one-per-user to the first users so the
 * shares sum exactly to `amount`.
 */
export function splitEqual(amount: number, userIds: string[]): SplitShare[] {
  if (userIds.length === 0) return [];
  const total = toCents(amount);
  const base = Math.floor(total / userIds.length);
  let remainder = total - base * userIds.length;
  return userIds.map((userId) => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    return { userId, amount: fromCents(base + extra) };
  });
}

/**
 * Use exact per-user amounts. Validates that they sum to `amount`.
 * `amounts` maps userId -> dollar amount.
 */
export function splitByExact(
  amount: number,
  amounts: Record<string, number>
): { shares: SplitShare[]; error?: string } {
  const shares = Object.entries(amounts).map(([userId, a]) => ({ userId, amount: a }));
  const sum = shares.reduce((acc, s) => acc + toCents(s.amount), 0);
  if (sum !== toCents(amount)) {
    return {
      shares,
      error: `Shares add up to ${fromCents(sum).toFixed(2)} but the total is ${amount.toFixed(2)}.`,
    };
  }
  return { shares };
}

/**
 * Split by percentage. `percents` maps userId -> percent (e.g. 25 for 25%).
 * Percentages must sum to 100. Rounding remainder cents go to the first users.
 */
export function splitByPercent(
  amount: number,
  percents: Record<string, number>
): { shares: SplitShare[]; error?: string } {
  const entries = Object.entries(percents);
  const pctSum = entries.reduce((acc, [, p]) => acc + p, 0);
  if (Math.round(pctSum * 100) !== 100 * 100) {
    return {
      shares: entries.map(([userId, p]) => ({ userId, amount: fromCents(0) })),
      error: `Percentages add up to ${pctSum}% — they must total 100%.`,
    };
  }
  const total = toCents(amount);
  const raw = entries.map(([userId, p]) => ({ userId, exact: (total * p) / 100 }));
  const floored = raw.map((r) => ({ userId: r.userId, cents: Math.floor(r.exact) }));
  let remainder = total - floored.reduce((acc, r) => acc + r.cents, 0);
  const shares = floored.map((r) => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    return { userId: r.userId, amount: fromCents(r.cents + extra) };
  });
  return { shares };
}

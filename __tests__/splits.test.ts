import { describe, expect, it } from '@jest/globals';

import { splitByExact, splitByPercent, splitEqual, toCents } from '../src/lib/splits';

const sumCents = (shares: { amount: number }[]) =>
  shares.reduce((acc, s) => acc + toCents(s.amount), 0);

describe('splitEqual', () => {
  it('splits an even amount evenly', () => {
    const shares = splitEqual(30, ['a', 'b', 'c']);
    expect(shares).toEqual([
      { userId: 'a', amount: 10 },
      { userId: 'b', amount: 10 },
      { userId: 'c', amount: 10 },
    ]);
  });

  it('distributes leftover cents so shares sum exactly to the total', () => {
    const shares = splitEqual(10, ['a', 'b', 'c']); // 3.34 / 3.33 / 3.33
    expect(sumCents(shares)).toBe(toCents(10));
    expect(shares[0].amount).toBeCloseTo(3.34, 2);
    expect(shares[1].amount).toBeCloseTo(3.33, 2);
    expect(shares[2].amount).toBeCloseTo(3.33, 2);
  });

  it('returns empty for no users', () => {
    expect(splitEqual(10, [])).toEqual([]);
  });
});

describe('splitByExact', () => {
  it('accepts amounts that sum to the total', () => {
    const { shares, error } = splitByExact(20, { a: 5, b: 15 });
    expect(error).toBeUndefined();
    expect(shares).toEqual([
      { userId: 'a', amount: 5 },
      { userId: 'b', amount: 15 },
    ]);
  });

  it('rejects amounts that do not reconcile', () => {
    const { error } = splitByExact(20, { a: 5, b: 10 });
    expect(error).toBeDefined();
  });
});

describe('splitByPercent', () => {
  it('splits by percentage and sums exactly to total', () => {
    const { shares, error } = splitByPercent(100, { a: 25, b: 75 });
    expect(error).toBeUndefined();
    expect(sumCents(shares)).toBe(toCents(100));
    expect(shares[0].amount).toBe(25);
    expect(shares[1].amount).toBe(75);
  });

  it('rejects percentages that do not total 100', () => {
    const { error } = splitByPercent(100, { a: 25, b: 50 });
    expect(error).toBeDefined();
  });

  it('handles rounding so cents reconcile', () => {
    const { shares } = splitByPercent(10, { a: 33.33, b: 33.33, c: 33.34 });
    expect(sumCents(shares)).toBe(toCents(10));
  });
});

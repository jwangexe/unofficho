import { describe, expect, it } from 'vitest';
import { findRoots } from '@/engine/solver';

describe('findRoots', () => {
  it('positive root on the log grid', () => {
    const r = findRoots((x) => [x * x, 2], { positive: true });
    expect(r).toHaveLength(1);
    expect(r[0]).toBeCloseTo(Math.SQRT2, 12);
  });

  it('signed roots, including negative ones', () => {
    expect(findRoots((x) => [x ** 3, -8])[0]).toBeCloseTo(-2, 12);
    const two = findRoots((x) => [(x - 1) * (x - 3), 0]);
    expect(two).toHaveLength(2);
    expect(two[0]).toBeCloseTo(1, 10);
    expect(two[1]).toBeCloseTo(3, 10);
  });

  it('finds an exact zero', () => {
    const r = findRoots((x) => [x, 0]);
    expect(r).toEqual([0]);
  });

  it('handles values tens of orders of magnitude from 1', () => {
    expect(findRoots((x) => [Math.log(x), Math.log(3e-42)], { positive: true })[0]! / 3e-42).toBeCloseTo(1, 10);
    expect(findRoots((x) => [x, 6.02e23], { positive: true })[0]! / 6.02e23).toBeCloseTo(1, 10);
  });

  it('returns nothing when there is no real solution', () => {
    expect(findRoots((x) => [x * x, -1])).toEqual([]);
  });

  it('rejects poles that look like sign changes', () => {
    expect(findRoots((x) => [1 / (x - 2), 0])).toEqual([]);
  });

  it('respects a bracket and finds roots near its edge', () => {
    // x²/(c − x) = K with large K: root very close to c.
    const c = 0.1;
    const K = 1e8;
    const r = findRoots((x) => [x * x / (c - x), K], { positive: true, bracket: [0, c] });
    expect(r).toHaveLength(1);
    // Stable form of the quadratic root (the textbook form cancels catastrophically here).
    expect(r[0]! / ((2 * K * c) / (K + Math.sqrt(K * K + 4 * K * c)))).toBeCloseTo(1, 12);
  });
});

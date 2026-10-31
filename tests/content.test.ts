import { describe, expect, it } from 'vitest';
import { reagents } from '@/data';

describe('content', () => {
  it('loads and validates reagents', () => {
    expect(reagents.length).toBeGreaterThan(0);
  });

  it('has unique reagent ids', () => {
    const ids = reagents.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

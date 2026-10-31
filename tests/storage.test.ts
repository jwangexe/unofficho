import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UnoffIChODB } from '@/storage/db';
import { exportAll, importAll } from '@/storage/exportImport';

let n = 0;
let db: UnoffIChODB;

beforeEach(() => {
  db = new UnoffIChODB(`test-${n++}`);
});
afterEach(async () => {
  await db.delete();
});

const srs = (itemId: string, lastReviewed: number) => ({
  itemId,
  section: 'calc' as const,
  topic: 'thermo',
  ease: 2.5,
  intervalDays: 1,
  due: lastReviewed + 86_400_000,
  reps: 1,
  lapses: 0,
  lastReviewed,
});

describe('export/import', () => {
  it('round-trips through replace', async () => {
    await db.srs.put(srs('a', 100));
    await db.attempts.add({ itemId: 'a', section: 'calc', topic: 'thermo', ts: 100, score: 1 });
    await db.flags.add({ itemId: 'nabh4', section: 'reagents', note: 'check', createdAt: 5 });
    const file = JSON.parse(JSON.stringify(await exportAll(db)));

    const other = new UnoffIChODB(`test-${n++}`);
    await importAll(file, 'replace', other);
    expect(await other.srs.count()).toBe(1);
    expect(await other.attempts.count()).toBe(1);
    expect((await other.flags.toArray())[0]?.note).toBe('check');
    await other.delete();
  });

  it('merges without duplicating and keeps the newer SRS state', async () => {
    await db.srs.put(srs('a', 200));
    await db.attempts.add({ itemId: 'a', section: 'calc', topic: 'thermo', ts: 100, score: 1 });
    const file = await exportAll(db);
    file.data.srs = [srs('a', 50), srs('b', 300)];
    file.data.attempts.push({ itemId: 'b', section: 'calc', topic: 'thermo', ts: 300, score: 0 });

    const res = await importAll(file, 'merge', db);
    expect(res).toEqual({ srs: 1, attempts: 1, flags: 0 });
    expect((await db.srs.get('a'))?.lastReviewed).toBe(200);
    expect(await db.attempts.count()).toBe(2);
  });

  it('rejects files that are not progress exports', async () => {
    await expect(importAll({ hello: 1 }, 'merge', db)).rejects.toThrow(/Not a valid/);
  });
});

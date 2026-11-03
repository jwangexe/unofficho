import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { UnoffIChODB } from '@/storage/db';
import { exportAll, importAll } from '@/storage/exportImport';
import { normaliseAttemptId } from '@/storage/itemIds';
import { recordAttempt } from '@/storage/progress';
import { DAY, endOfDay, newState, quality, RELEARN_MS, review } from '@/storage/srs';

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
  it('carries the level and the easier-levels switch', async () => {
    await db.settings.bulkPut([
      { key: 'level', value: 'c3l6' },
      { key: 'includeEasier', value: false },
    ]);
    const file = JSON.parse(JSON.stringify(await exportAll(db)));
    const other = new UnoffIChODB(`test-${n++}`);
    await importAll(file, 'replace', other);
    expect((await other.settings.get('level'))?.value).toBe('c3l6');
    expect((await other.settings.get('includeEasier'))?.value).toBe(false);
    await other.delete();
  });

  it('round-trips through replace', async () => {
    await db.srs.put(srs('calc:a', 100));
    await db.attempts.add({ itemId: 'calc:a', section: 'calc', topic: 'thermo', ts: 100, score: 1 });
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
    await db.srs.put(srs('calc:a', 200));
    await db.attempts.add({ itemId: 'calc:a', section: 'calc', topic: 'thermo', ts: 100, score: 1 });
    const file = await exportAll(db);
    file.data.srs = [srs('calc:a', 50), srs('calc:b', 300)];
    file.data.attempts.push({ itemId: 'calc:b', section: 'calc', topic: 'thermo', ts: 300, score: 0 });

    const res = await importAll(file, 'merge', db);
    expect(res).toEqual({ srs: 1, attempts: 1, flags: 0 });
    expect((await db.srs.get('calc:a'))?.lastReviewed).toBe(200);
    expect(await db.attempts.count()).toBe(2);
  });

  it('rejects files that are not progress exports', async () => {
    await expect(importAll({ hello: 1 }, 'merge', db)).rejects.toThrow(/Not a valid/);
  });
});

describe('spaced repetition', () => {
  const t0 = new Date(2026, 9, 1, 12).getTime();
  const fresh = () => newState('calc:x', 'calc', 'thermo', t0);

  it('maps scores to SM-2 quality', () => {
    expect([1, 0.8, 0.5, 0.3, 0].map(quality)).toEqual([5, 4, 3, 1, 0]);
  });

  it('follows 1, 6, then interval × ease days on correct answers', () => {
    let s = review(fresh(), 1, t0);
    expect(s.intervalDays).toBe(1);
    s = review(s, 1, s.due);
    expect(s.intervalDays).toBe(6);
    const ease = s.ease;
    s = review(s, 1, s.due);
    expect(s.intervalDays).toBe(Math.round(6 * (ease + 0.1)));
    expect(s.reps).toBe(3);
  });

  it('resets on a lapse and brings the item back soon', () => {
    let s = review(review(fresh(), 1, t0), 1, t0 + DAY);
    s = review(s, 0, s.due);
    expect(s).toMatchObject({ reps: 0, lapses: 1, intervalDays: 0 });
    expect(s.due - s.lastReviewed).toBe(RELEARN_MS);
    expect(s.ease).toBeGreaterThanOrEqual(1.3);
  });

  it('does not grow the interval when an item is met again before it is due', () => {
    const s = review(fresh(), 1, t0);
    expect(review(s, 1, t0 + 60_000)).toBe(s);
  });

  it('lowers ease for hard passes but never below 1.3', () => {
    let s = fresh();
    for (let i = 0; i < 30; i++) s = review(s, 0.5, s.due);
    expect(s.ease).toBe(1.3);
  });

  it('computes the end of the local day', () => {
    expect(new Date(endOfDay(t0)).getHours()).toBe(0);
    expect(endOfDay(t0) - t0).toBe(12 * 3_600_000);
  });
});

describe('recordAttempt', () => {
  it('logs the attempt and schedules the item together', async () => {
    await recordAttempt({ itemId: 'reagent:nabh4', section: 'reagents', topic: 'reduction', score: 1, ts: 1000 }, db);
    expect(await db.attempts.count()).toBe(1);
    expect(await db.srs.get('reagent:nabh4')).toMatchObject({ reps: 1, intervalDays: 1, due: 1000 + DAY });
  });

  it('normalises bare ids from before namespacing', () => {
    expect(normaliseAttemptId({ itemId: 'nabh4', section: 'reagents', mode: 'fast' }).itemId).toBe('reagent:nabh4');
    expect(normaliseAttemptId({ itemId: 'wir-x', section: 'reagents', mode: 'react' }).itemId).toBe('react:wir-x');
    expect(normaliseAttemptId({ itemId: 'calc-y', section: 'calc' }).itemId).toBe('calc:calc-y');
    expect(normaliseAttemptId({ itemId: 'book:p:q', section: 'book' }).itemId).toBe('book:p:q');
  });
});

describe('database upgrade', () => {
  it('namespaces attempt ids recorded before version 2', async () => {
    const name = `test-upgrade-${n++}`;
    const v1 = new Dexie(name);
    v1.version(1).stores({ srs: 'itemId, section, topic, due', attempts: '++id, itemId, section, topic, ts, [itemId+ts]', flags: '++id, itemId, createdAt', settings: 'key' });
    await v1.table('attempts').bulkAdd([
      { itemId: 'nabh4', section: 'reagents', topic: 't', ts: 1, score: 1, mode: 'classify' },
      { itemId: 'wir-x', section: 'reagents', topic: 't', ts: 2, score: 1, mode: 'react' },
      { itemId: 'calc-y', section: 'calc', topic: 't', ts: 3, score: 1 },
    ]);
    v1.close();

    const v2 = new UnoffIChODB(name);
    expect((await v2.attempts.orderBy('ts').toArray()).map((a) => a.itemId)).toEqual(['reagent:nabh4', 'react:wir-x', 'calc:calc-y']);
    await v2.delete();
  });
});

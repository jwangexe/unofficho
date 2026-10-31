/**
 * The one place answers are recorded: each attempt is logged and the item's
 * spaced-repetition state is updated in the same transaction.
 */
import { db as defaultDb, type Attempt, type UnoffIChODB } from './db';
import { newState, review } from './srs';

export { itemId, parseItemId, type ItemKind } from './itemIds';

export async function recordAttempt(a: Omit<Attempt, 'id' | 'ts'> & { ts?: number }, db: UnoffIChODB = defaultDb) {
  const ts = a.ts ?? Date.now();
  await db.transaction('rw', [db.attempts, db.srs], async () => {
    await db.attempts.add({ ...a, ts });
    const prev = (await db.srs.get(a.itemId)) ?? newState(a.itemId, a.section, a.topic, ts);
    await db.srs.put({ ...review(prev, a.score, ts), topic: a.topic });
  });
}

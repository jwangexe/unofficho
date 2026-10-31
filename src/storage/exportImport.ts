import { z } from 'zod';
import { db as defaultDb, type UnoffIChODB } from './db';

export const EXPORT_FORMAT = 'unofficho-progress';
export const EXPORT_VERSION = 1;

const Section = z.enum(['book', 'reagents', 'calc']);

const ExportFile = z.object({
  format: z.literal(EXPORT_FORMAT),
  version: z.literal(EXPORT_VERSION),
  exportedAt: z.number(),
  data: z.object({
    srs: z.array(
      z.object({
        itemId: z.string(),
        section: Section,
        topic: z.string(),
        ease: z.number(),
        intervalDays: z.number(),
        due: z.number(),
        reps: z.number(),
        lapses: z.number(),
        lastReviewed: z.number(),
      }),
    ),
    attempts: z.array(
      z.object({
        itemId: z.string(),
        section: Section,
        topic: z.string(),
        ts: z.number(),
        score: z.number().min(0).max(1),
        mode: z.string().optional(),
        meta: z.record(z.string(), z.unknown()).optional(),
      }),
    ),
    flags: z.array(
      z.object({
        itemId: z.string(),
        section: Section,
        note: z.string(),
        createdAt: z.number(),
      }),
    ),
    settings: z.array(z.object({ key: z.string(), value: z.unknown() })),
  }),
});
export type ExportFile = z.infer<typeof ExportFile>;

const stripId = <T extends { id?: number }>({ id: _id, ...rest }: T) => rest;

export async function exportAll(db: UnoffIChODB = defaultDb): Promise<ExportFile> {
  const [srs, attempts, flags, settings] = await Promise.all([
    db.srs.toArray(),
    db.attempts.toArray(),
    db.flags.toArray(),
    db.settings.toArray(),
  ]);
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    data: { srs, attempts: attempts.map(stripId), flags: flags.map(stripId), settings },
  };
}

/** Flags only, for sending content corrections. */
export async function exportFlags(db: UnoffIChODB = defaultDb) {
  return { format: 'unofficho-flags', exportedAt: Date.now(), flags: (await db.flags.toArray()).map(stripId) };
}

/**
 * Import a progress file.
 * - `replace` wipes local progress first.
 * - `merge` keeps the more recently reviewed SRS state per item and de-duplicates
 *   attempts (itemId + ts) and flags (itemId + createdAt).
 */
export async function importAll(
  raw: unknown,
  mode: 'replace' | 'merge',
  db: UnoffIChODB = defaultDb,
): Promise<{ srs: number; attempts: number; flags: number }> {
  const parsed = ExportFile.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Not a valid UnoffIChO progress file:\n${z.prettifyError(parsed.error)}`);
  }
  const { data } = parsed.data;

  return db.transaction('rw', [db.srs, db.attempts, db.flags, db.settings], async () => {
    if (mode === 'replace') {
      await Promise.all([db.srs.clear(), db.attempts.clear(), db.flags.clear(), db.settings.clear()]);
      await db.srs.bulkPut(data.srs);
      await db.attempts.bulkAdd(data.attempts);
      await db.flags.bulkAdd(data.flags);
      await db.settings.bulkPut(data.settings);
      return { srs: data.srs.length, attempts: data.attempts.length, flags: data.flags.length };
    }

    const existingSrs = new Map((await db.srs.toArray()).map((s) => [s.itemId, s]));
    const srs = data.srs.filter((s) => {
      const cur = existingSrs.get(s.itemId);
      return !cur || s.lastReviewed > cur.lastReviewed;
    });
    await db.srs.bulkPut(srs);

    const attemptKeys = new Set((await db.attempts.toArray()).map((a) => `${a.itemId}|${a.ts}`));
    const attempts = data.attempts.filter((a) => !attemptKeys.has(`${a.itemId}|${a.ts}`));
    await db.attempts.bulkAdd(attempts);

    const flagKeys = new Set((await db.flags.toArray()).map((f) => `${f.itemId}|${f.createdAt}`));
    const flags = data.flags.filter((f) => !flagKeys.has(`${f.itemId}|${f.createdAt}`));
    await db.flags.bulkAdd(flags);

    // Settings: local wins on merge.
    for (const s of data.settings) {
      if (!(await db.settings.get(s.key))) await db.settings.put(s);
    }
    return { srs: srs.length, attempts: attempts.length, flags: flags.length };
  });
}

/** Trigger a browser download of a JSON value. */
export function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

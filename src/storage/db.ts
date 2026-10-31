import Dexie, { type EntityTable } from 'dexie';

export type Section = 'book' | 'reagents' | 'calc';

/** Spaced-repetition state, one row per item. */
export interface SrsState {
  itemId: string;
  section: Section;
  topic: string;
  ease: number;
  intervalDays: number;
  /** Epoch ms when the item is next due. */
  due: number;
  reps: number;
  lapses: number;
  lastReviewed: number;
}

/** One answer to one item. `score` is 0–1 so partial credit fits. */
export interface Attempt {
  id?: number;
  itemId: string;
  section: Section;
  topic: string;
  ts: number;
  score: number;
  mode?: string;
  meta?: Record<string, unknown>;
}

/** "Flag as wrong" report on a content item. */
export interface Flag {
  id?: number;
  itemId: string;
  section: Section;
  note: string;
  createdAt: number;
}

export interface Setting {
  key: string;
  value: unknown;
}

export class UnoffIChODB extends Dexie {
  srs!: EntityTable<SrsState, 'itemId'>;
  attempts!: EntityTable<Attempt, 'id'>;
  flags!: EntityTable<Flag, 'id'>;
  settings!: EntityTable<Setting, 'key'>;

  constructor(name = 'unofficho') {
    super(name);
    this.version(1).stores({
      srs: 'itemId, section, topic, due',
      attempts: '++id, itemId, section, topic, ts, [itemId+ts]',
      flags: '++id, itemId, createdAt',
      settings: 'key',
    });
  }
}

export const db = new UnoffIChODB();

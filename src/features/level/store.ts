/**
 * The student's level and the "Include easier levels" toggle. Kept in the Dexie `settings`
 * table so they travel with progress export/import; loaded once at startup.
 */
import { useMemo } from 'react';
import { create } from 'zustand';
import { LEVEL_IDS, type LevelId } from '@/data/levels';
import type { LevelPrefs } from '@/data/levels/pool';
import { db } from '@/storage/db';

export const LEVEL_KEY = 'level';
export const EASIER_KEY = 'includeEasier';
export const ALL_FORMULAS_KEY = 'allFormulas';
/** What "Skip" chooses. */
export const DEFAULT_LEVEL: LevelId = 'ukcho1';

const isLevel = (x: unknown): x is LevelId => LEVEL_IDS.includes(x as LevelId);

/** A copy in localStorage: a fallback when IndexedDB is missing, and a way for tests to preset a level. */
const MIRROR = 'unofficho.level';
function readMirror(): LevelId | null {
  try {
    const v = localStorage.getItem(MIRROR);
    return isLevel(v) ? v : null;
  } catch {
    return null;
  }
}
function writeMirror(level: LevelId) {
  try {
    localStorage.setItem(MIRROR, level);
  } catch {
    // Not persisted in private mode; fine.
  }
}

interface LevelState {
  loaded: boolean;
  /** Null until the student has chosen (or skipped): the picker shows. */
  level: LevelId | null;
  includeEasier: boolean;
  /** Show every formula in the operation sheet, not just those at the student's level. */
  allFormulas: boolean;
  load: () => Promise<void>;
  setLevel: (level: LevelId) => Promise<void>;
  setIncludeEasier: (on: boolean) => Promise<void>;
  setAllFormulas: (on: boolean) => Promise<void>;
}

export const useLevelStore = create<LevelState>((set) => ({
  loaded: false,
  level: null,
  includeEasier: true,
  allFormulas: false,
  load: async () => {
    try {
      const [level, easier, all] = await Promise.all([
        db.settings.get(LEVEL_KEY),
        db.settings.get(EASIER_KEY),
        db.settings.get(ALL_FORMULAS_KEY),
      ]);
      const chosen = isLevel(level?.value) ? level.value : readMirror();
      if (chosen && chosen !== level?.value) await db.settings.put({ key: LEVEL_KEY, value: chosen });
      if (chosen) writeMirror(chosen);
      set({ loaded: true, level: chosen, includeEasier: easier?.value !== false, allFormulas: all?.value === true });
    } catch {
      // No IndexedDB (some private modes): fall back to the copy, then the default, rather than block the app.
      set({ loaded: true, level: readMirror() ?? DEFAULT_LEVEL });
    }
  },
  setLevel: async (level) => {
    set({ level });
    writeMirror(level);
    await db.settings.put({ key: LEVEL_KEY, value: level }).catch(() => {});
  },
  setIncludeEasier: async (includeEasier) => {
    set({ includeEasier });
    await db.settings.put({ key: EASIER_KEY, value: includeEasier }).catch(() => {});
  },
  setAllFormulas: async (allFormulas) => {
    set({ allFormulas });
    await db.settings.put({ key: ALL_FORMULAS_KEY, value: allFormulas }).catch(() => {});
  },
}));

/** The current level preferences; before a choice is made, the default level. */
export function useLevelPrefs(): LevelPrefs {
  const level = useLevelStore((s) => s.level) ?? DEFAULT_LEVEL;
  const includeEasier = useLevelStore((s) => s.includeEasier);
  return useMemo(() => ({ level, includeEasier }), [level, includeEasier]);
}

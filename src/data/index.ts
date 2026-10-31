/**
 * Content registry: loads and validates every bundled data file.
 * Drop a new JSON file into src/data/reagents/ and it is picked up automatically.
 */
import { z } from 'zod';
import { ReactItem, Reagent } from './schemas';
import reactData from './react-items.json';

const reagentFiles = import.meta.glob<unknown>('./reagents/*.json', {
  eager: true,
  import: 'default',
});

function loadReagents(): Reagent[] {
  const all: Reagent[] = [];
  for (const [path, data] of Object.entries(reagentFiles)) {
    const parsed = z.array(Reagent).safeParse(data);
    if (!parsed.success) {
      throw new Error(`Invalid reagent data in ${path}:\n${z.prettifyError(parsed.error)}`);
    }
    all.push(...parsed.data);
  }
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export const reagents: readonly Reagent[] = loadReagents();
export const reagentById = new Map(reagents.map((r) => [r.id, r]));

function loadReactItems(): ReactItem[] {
  const parsed = z.array(ReactItem).safeParse(reactData);
  if (!parsed.success) throw new Error(`Invalid react-items.json:\n${z.prettifyError(parsed.error)}`);
  for (const item of parsed.data) {
    if (!reagentById.has(item.reagentId)) throw new Error(`${item.id}: unknown reagent ${item.reagentId}`);
  }
  return parsed.data;
}

/** "Will it react?" questions. */
export const reactItems: readonly ReactItem[] = loadReactItems();

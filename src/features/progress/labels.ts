/** Human-readable names and practice links for item ids and topics. */
import { reactItems, reagentById } from '@/data';
import { BOOK_OUTLINE, bookPageById, bookPages } from '@/data/book';
import { CHAPTERS, type Chapter } from '@/data/schemas';
import { mechanismById } from '@/data/mechanisms';
import { calcTemplateById } from '@/data/templates';
import { formulaById } from '@/engine/formulas';
import { TOPIC_TAG } from '@/features/calc/topics';
import { topicLabel } from '@/features/reagents/ReagentHeader';
import type { Section } from '@/storage/db';
import { parseItemId } from '@/storage/itemIds';
import { focusQuery } from '../focus';

export const SECTION_LABEL: Record<Section, string> = { book: 'Book', reagents: 'Reagents', calc: 'Calculations' };
export const SECTION_PATH: Record<Section, string> = { book: '/book', reagents: '/reagents', calc: '/calc' };

const reactById = new Map(reactItems.map((x) => [x.id, x]));

export function topicName(section: Section, topic: string): string {
  if (section === 'calc') return TOPIC_TAG[topic] ?? topic;
  if (section === 'book') {
    const [chapter, sec] = topic.split('/') as [Chapter, string];
    const c = CHAPTERS.includes(chapter) ? BOOK_OUTLINE[chapter] : undefined;
    return c ? `${c.title} · ${c.sections.find((s) => s.id === sec)?.title ?? sec}` : topic;
  }
  return topicLabel(topic);
}

export function itemName(id: string): string {
  const p = parseItemId(id);
  if (!p) return id;
  switch (p.kind) {
    case 'reagent':
      return reagentById.get(p.id)?.name ?? p.id;
    case 'react': {
      const x = reactById.get(p.id);
      return x ? `${x.substrate.name} + ${reagentById.get(x.reagentId)?.formula ?? x.reagentId}` : p.id;
    }
    case 'calc':
      return calcTemplateById.get(p.id)?.title ?? p.id;
    case 'mech':
      return mechanismById.get(p.id)?.title ?? p.id;
    case 'book': {
      const page = bookPageById.get(p.id);
      const n = page ? page.quickChecks.findIndex((q) => q.id === p.sub) + 1 : 0;
      return page ? `${page.title}${n ? ` (check ${n})` : ''}` : p.id;
    }
  }
}

export const formulaName = (id: string) => formulaById.get(id)?.name ?? id;

export function topicHref(section: Section, topic: string): string {
  if (section === 'book') {
    const [chapter, sec] = topic.split('/');
    const page = bookPages.find((p) => p.chapter === chapter && p.section === sec && !p.stub);
    return page ? `/book/${page.id}` : '/book';
  }
  return `${SECTION_PATH[section]}${focusQuery({ topic, label: topicName(section, topic) })}`;
}

export function itemHref(id: string): string {
  const p = parseItemId(id);
  if (!p) return '/';
  if (p.kind === 'book') return `/book/${p.id}`;
  const path = p.kind === 'calc' || p.kind === 'mech' ? '/calc' : '/reagents';
  return `${path}${focusQuery({ ids: [id], label: itemName(id) })}`;
}

export const formulaHref = (id: string) => `/calc${focusQuery({ formula: id, label: formulaName(id) })}`;

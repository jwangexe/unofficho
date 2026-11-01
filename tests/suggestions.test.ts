import { describe, expect, it } from 'vitest';
import { LIMITS, parseSuggestion } from '../worker/suggestions';

describe('suggestion validation', () => {
  it('accepts a normal suggestion and trims it', () => {
    expect(parseSuggestion({ kind: 'idea', message: '  More organic pages please ', name: ' Sam ', page: '/book' })).toEqual({
      ok: true,
      value: { kind: 'idea', message: 'More organic pages please', name: 'Sam', page: '/book' },
    });
  });

  it('treats a missing name and page as null', () => {
    const r = parseSuggestion({ kind: 'bug', message: 'The exam timer froze' });
    expect(r.ok && r.value).toMatchObject({ name: null, page: null });
  });

  it('rejects unknown kinds, empty or overlong messages, and anything in the honeypot', () => {
    expect(parseSuggestion({ kind: 'spam', message: 'hello there' }).ok).toBe(false);
    expect(parseSuggestion({ kind: 'idea', message: '  ' }).ok).toBe(false);
    expect(parseSuggestion({ kind: 'idea', message: 'x'.repeat(LIMITS.message + 1) }).ok).toBe(false);
    expect(parseSuggestion({ kind: 'idea', message: 'Nice app', website: 'http://spam.example' }).ok).toBe(false);
    expect(parseSuggestion('not an object').ok).toBe(false);
  });

  it('cuts an overlong name and page instead of rejecting', () => {
    const r = parseSuggestion({ kind: 'other', message: 'Hello!', name: 'n'.repeat(500), page: '/'.repeat(500) });
    expect(r.ok && [r.value.name!.length, r.value.page!.length]).toEqual([LIMITS.name, LIMITS.page]);
  });
});

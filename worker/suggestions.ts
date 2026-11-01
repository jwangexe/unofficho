/** Suggestion payloads: shared by the Worker (validation) and the app (the form's options). */

export const SUGGESTION_KINDS = ['idea', 'content-error', 'bug', 'other'] as const;
export type SuggestionKind = (typeof SUGGESTION_KINDS)[number];

export const SUGGESTION_KIND_LABEL: Record<SuggestionKind, string> = {
  idea: 'Idea',
  'content-error': 'Chemistry error',
  bug: 'Something broken',
  other: 'Other',
};

export const LIMITS = { message: 2000, name: 100, page: 200 } as const;

export interface Suggestion {
  kind: SuggestionKind;
  message: string;
  /** Optional name or contact, so you can reply. */
  name: string | null;
  /** Where in the app it was sent from, e.g. "/calc". */
  page: string | null;
}

export type Parsed = { ok: true; value: Suggestion } | { ok: false; error: string };

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Validate an untrusted request body. `website` is a honeypot field that people never fill in. */
export function parseSuggestion(body: unknown): Parsed {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Expected a JSON object.' };
  const b = body as Record<string, unknown>;
  if (str(b.website)) return { ok: false, error: 'Rejected.' };
  const kind = b.kind as SuggestionKind;
  if (!SUGGESTION_KINDS.includes(kind)) return { ok: false, error: 'Unknown kind.' };
  const message = str(b.message);
  if (message.length < 3) return { ok: false, error: 'Please write a little more.' };
  if (message.length > LIMITS.message) return { ok: false, error: `Please keep it under ${LIMITS.message} characters.` };
  const name = str(b.name).slice(0, LIMITS.name) || null;
  const page = str(b.page).slice(0, LIMITS.page) || null;
  return { ok: true, value: { kind, message, name, page } };
}

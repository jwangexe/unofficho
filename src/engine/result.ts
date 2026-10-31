/** Engine functions never throw for user mistakes; they return a Result the UI can show. */
export type ErrorCode =
  | 'dimension' // wrong physical dimension for a slot or operation
  | 'kind' // absolute temperature vs temperature change mix-up
  | 'molar-mix' // per-mole and extensive quantities mixed in one formula
  | 'domain' // e.g. ln of a negative number, negative value in a positive-only slot
  | 'missing' // a required input is not filled
  | 'not-solvable' // the variable is a fixed parameter of the formula
  | 'no-solution'; // the solver found no real root satisfying the constraints

export interface EngineError {
  code: ErrorCode;
  message: string;
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: EngineError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = <T = never>(code: ErrorCode, message: string): Result<T> => ({
  ok: false,
  error: { code, message },
});

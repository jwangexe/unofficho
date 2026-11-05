/** People who have checked content for accuracy, shown on /credits. Add one entry per reviewer. */
export interface Reviewer {
  name: string;
  /** What they reviewed, e.g. "Organic Book pages". */
  reviewed?: string;
}

export const REVIEWERS: Reviewer[] = [];

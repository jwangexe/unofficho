/**
 * Panels open under the question, so the question's own chips fill their slots: a tap on a
 * chip goes to the panel that asked for chips most recently, instead of selecting the chip.
 */
import { createContext, useContext, useEffect, useRef } from 'react';
import type { Chip } from './store';

export interface PickRouter {
  add: (id: symbol, pick: (chip: Chip) => void) => void;
  remove: (id: symbol) => void;
}

export const PickContext = createContext<PickRouter | null>(null);

/** Receive taps on the question's chips while mounted. True when taps are routed here. */
export function useChipPicks(onPick: (chip: Chip) => void): boolean {
  const router = useContext(PickContext);
  // The latest handler, so the registration survives re-renders that change it.
  const latest = useRef(onPick);
  latest.current = onPick;
  useEffect(() => {
    if (!router) return;
    const id = Symbol('picker');
    router.add(id, (c) => latest.current(c));
    return () => router.remove(id);
  }, [router]);
  return router !== null;
}

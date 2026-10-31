import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

function read<M extends string>(key: string, valid: readonly M[], fallback: M): M {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('mode');
    if (valid.includes(fromUrl as M)) {
      localStorage.setItem(key, fromUrl!);
      return fromUrl as M;
    }
    const saved = localStorage.getItem(key);
    return valid.includes(saved as M) ? (saved as M) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * A screen's mode (e.g. Feed / Exam), remembered on this device. A `?mode=` link (from the
 * homepage) selects and saves a mode, then the parameter is removed from the address.
 */
export function useSavedMode<M extends string>(key: string, valid: readonly M[], fallback: M): [M, (m: M) => void] {
  const [mode, setMode] = useState<M>(() => read(key, valid, fallback));
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (!params.has('mode')) return;
    const next = new URLSearchParams(params);
    next.delete('mode');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const pick = (m: M) => {
    setMode(m);
    try {
      localStorage.setItem(key, m);
    } catch {
      // Not persisted in private mode; fine.
    }
  };
  return [mode, pick];
}

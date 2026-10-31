import { useEffect, useRef, useState } from 'react';
import { db } from '@/storage/db';
import { downloadJson, exportAll, exportFlags, importAll } from '@/storage/exportImport';
import { Page } from '@/ui/Page';
import { Placeholder } from '@/ui/Placeholder';

const btn = 'min-h-11 rounded-xl bg-surface-2 px-4 text-sm font-medium active:opacity-70';

export default function ProgressHome() {
  const [counts, setCounts] = useState<{ attempts: number; flags: number } | null>(null);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () =>
    Promise.all([db.attempts.count(), db.flags.count()]).then(([attempts, flags]) =>
      setCounts({ attempts, flags }),
    );
  useEffect(() => {
    refresh();
  }, []);

  const stamp = () => new Date().toISOString().slice(0, 10);

  async function onImport(file: File) {
    try {
      const res = await importAll(JSON.parse(await file.text()), 'merge');
      setMsg(`Imported ${res.attempts} attempts, ${res.flags} flags, ${res.srs} review states.`);
      refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Page title="Progress">
      <p className="mb-4 text-sm text-muted">
        {counts ? `${counts.attempts} answers recorded · ${counts.flags} flagged items` : '…'}
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        <button className={btn} onClick={async () => downloadJson(await exportAll(), `unofficho-progress-${stamp()}.json`)}>
          Export progress
        </button>
        <button className={btn} onClick={() => fileRef.current?.click()}>
          Import progress
        </button>
        <button className={btn} onClick={async () => downloadJson(await exportFlags(), `unofficho-flags-${stamp()}.json`)}>
          Export flagged list
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.target.value = '';
          }}
        />
      </div>
      {msg && <p className="mb-4 whitespace-pre-wrap text-sm" role="status">{msg}</p>}
      <Placeholder phase={7} />
    </Page>
  );
}

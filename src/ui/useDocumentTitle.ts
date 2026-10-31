import { useEffect } from 'react';
import { APP_NAME } from '@/app/brand';

/** "<title> · UnoffIChO" while the screen is shown. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
    return () => {
      document.title = APP_NAME;
    };
  }, [title]);
}

import { useEffect } from 'react';
import { APP_NAME } from '@/app/brand';
import { fullTitle } from '@/app/seo';

/** "<title> · UnoffIChO" while the screen is shown (or the title alone if it names the app). */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = fullTitle(title);
    return () => {
      document.title = APP_NAME;
    };
  }, [title]);
}

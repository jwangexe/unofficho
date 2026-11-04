/**
 * Search-engine and link-preview metadata. The build pre-renders the public pages
 * (scripts/prerender.ts) with these tags in their <head>; the screens use the same titles,
 * so the title Google sees after running the app matches the one in the HTML.
 */
import { APP_NAME, AUTHOR, DOMAIN } from './brand';

export const SITE_URL = `https://${DOMAIN}`;

export interface PageMeta {
  title: string;
  description: string;
  /** Path on the site, e.g. "/book/vsepr". */
  path: string;
  type?: 'website' | 'article';
  /** schema.org JSON-LD describing the page. */
  jsonLd?: Record<string, unknown>;
}

const SITE_DESCRIPTION =
  'Free, interactive chemistry olympiad practice for IChO, UKChO, C3L6 and A-Level: step-by-step calculation problems, reagent drills and short revision pages.';

/** Titles shown in the browser tab, shared with the screens. */
export const TITLES = {
  home: `${APP_NAME}: interactive chemistry olympiad practice problems`,
  calc: 'Chemistry calculation practice problems',
  reagents: 'Reagent drill: what each reagent does',
  book: 'Book: short chemistry olympiad revision pages',
  about: 'About',
  practice: 'Chemistry calculation question types with worked examples',
  guides: 'Chemistry olympiad guides: UKChO, C3L6, IChO and A-Level',
} as const;

/** "<title> · UnoffIChO", or the title alone if it already names the app. */
export const fullTitle = (title: string) => (title.startsWith(APP_NAME) ? title : `${title} · ${APP_NAME}`);

export const STATIC_PAGES: PageMeta[] = [
  {
    path: '/',
    title: TITLES.home,
    description: SITE_DESCRIPTION,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: APP_NAME,
      url: `${SITE_URL}/`,
      description: SITE_DESCRIPTION,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any (web browser)',
      inLanguage: 'en-GB',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
      educationalLevel: ['A-Level', 'Cambridge Chemistry Challenge', 'UK Chemistry Olympiad', 'International Chemistry Olympiad'],
      about: ['Chemistry', 'Chemistry olympiad', 'Physical chemistry', 'Organic chemistry', 'Inorganic chemistry'],
      author: { '@type': 'Person', name: AUTHOR.name, description: AUTHOR.credentials },
    },
  },
  {
    path: '/calc',
    title: TITLES.calc,
    description:
      'Interactive chemistry calculation problems for IChO, UKChO, C3L6 and A-Level. Build answers from formulas and get feedback on where your method went wrong.',
  },
  {
    path: '/reagents',
    title: TITLES.reagents,
    description:
      'Learn organic and inorganic reagents for chemistry olympiads: classify each by role, then decide which groups react and which product forms.',
  },
  {
    path: '/book',
    title: TITLES.book,
    description:
      'Two-minute chemistry revision pages for olympiad students: physical, inorganic, organic and analytical chemistry, each with quick checks.',
  },
  {
    path: '/practice',
    title: TITLES.practice,
    description:
      'Every type of chemistry calculation in UnoffIChO, from A-Level to IChO, each with a worked example, the method and the common mistakes.',
  },
  {
    path: '/guides',
    title: TITLES.guides,
    description:
      'How to prepare for each chemistry competition, from A-Level and the Cambridge Chemistry Challenge to the UK and International Chemistry Olympiads.',
  },
  {
    path: '/about',
    title: TITLES.about,
    description: `About ${APP_NAME}, an unofficial, independent chemistry olympiad study resource made by ${AUTHOR.name}, ${AUTHOR.credentials}.`,
  },
];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The <head> tags for a page. */
export function headTags(m: PageMeta): string {
  const url = `${SITE_URL}${m.path}`;
  const title = fullTitle(m.title);
  const lines = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:site_name" content="${APP_NAME}" />`,
    `<meta property="og:type" content="${m.type ?? 'website'}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${SITE_URL}/og.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${APP_NAME}: interactive chemistry olympiad practice" />`,
    `<meta property="og:locale" content="en_GB" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ];
  // "<" is escaped so the JSON can never close the script element.
  if (m.jsonLd) lines.push(`<script type="application/ld+json">${JSON.stringify(m.jsonLd).replace(/</g, '\\u003c')}</script>`);
  return lines.join('\n    ');
}

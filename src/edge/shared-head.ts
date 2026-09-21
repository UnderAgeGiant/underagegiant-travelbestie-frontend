import { SEO_DESCRIPTION_MAX, SEO_TITLE_MAX, canonicalUrl, joinList, truncate } from '../app/core/seo/seo.util';
import type { EdgeLocale } from './edge-routing';

export interface SharedSeoSummary {
  id: string;
  tripName: string;
  cities: string[];
  attractionCount: number;
  updatedAt: string;
  indexable: boolean;
}

const COPY: Record<EdgeLocale, {
  ogLocale: string;
  title: (name: string) => string;
  description: (cities: string, count: number) => string;
  notFound: string;
}> = {
  'es-CL': {
    ogLocale: 'es_CL',
    title: n => `${n} — itinerario en Tripilove`,
    description: (c, n) => `Itinerario por ${c} con ${n} atracciones planificadas. Créalo, edítalo y compártelo en Tripilove.`,
    notFound: 'Viaje no encontrado | Tripilove',
  },
  'en-US': {
    ogLocale: 'en_US',
    title: n => `${n} — itinerary on Tripilove`,
    description: (c, n) => `Itinerary through ${c} with ${n} planned attractions. Build, edit and share yours on Tripilove.`,
    notFound: 'Trip not found | Tripilove',
  },
};

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const ROBOTS_NOINDEX = '<meta name="robots" content="noindex,follow">';

export function buildSharedHead(
  s: SharedSeoSummary, locale: EdgeLocale, siteUrl: string,
): { title: string; head: string } {
  const c = COPY[locale];
  const title = truncate(c.title(s.tripName), SEO_TITLE_MAX);
  const description = truncate(c.description(joinList(s.cities, locale), s.attractionCount), SEO_DESCRIPTION_MAX);
  const url = canonicalUrl(siteUrl, `/shared/${encodeURIComponent(s.id)}`);
  const image = `${siteUrl.replace(/\/+$/, '')}/og-default.png`;
  const ld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: s.tripName,
    description,
    url,
    itinerary: {
      '@type': 'ItemList',
      itemListElement: s.cities.map((name, i) => ({
        '@type': 'ListItem', position: i + 1, item: { '@type': 'City', name },
      })),
    },
  }).replace(/</g, '\\u003c');

  const head = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    ...(s.indexable ? [] : [ROBOTS_NOINDEX]),
    `<meta property="og:type" content="article">`,
    `<meta property="og:site_name" content="Tripilove">`,
    `<meta property="og:locale" content="${c.ogLocale}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:image" content="${escapeHtml(image)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(image)}">`,
    `<script type="application/ld+json" id="tb-jsonld-shared">${ld}</script>`,
  ].join('\n  ');
  return { title, head };
}

export function buildNotFoundHead(locale: EdgeLocale): string {
  return [`<title>${escapeHtml(COPY[locale].notFound)}</title>`, ROBOTS_NOINDEX].join('\n  ');
}

// Tags the shell (see scripts/seo-head.mjs) may already carry; they are replaced wholesale by `head`.
const STRIP: RegExp[] = [
  /<title>[\s\S]*?<\/title>/gi,
  /<meta\s+name="description"[^>]*>/gi,
  /<meta\s+name="robots"[^>]*>/gi,
  /<meta\s+property="og:[^"]*"[^>]*>/gi,
  /<meta\s+name="twitter:[^"]*"[^>]*>/gi,
  /<link\s+rel="canonical"[^>]*>/gi,
];

export function applyHead(html: string, head: string): string {
  let out = html;
  for (const re of STRIP) out = out.replace(re, '');
  // Function replacer: `head` may contain "$&"-style sequences (e.g. inside a trip name).
  return out.replace('</head>', () => `  ${head}\n</head>`);
}

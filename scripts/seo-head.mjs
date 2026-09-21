export const SEO_HEAD_MARKER = '<!--tb-seo-head-->';

export const HOME_META = {
  'es-CL': {
    lang: 'es-CL',
    ogLocale: 'es_CL',
    title: 'Tripilove — Planificador de viajes con IA',
    description: 'Arma tu itinerario ciudad por ciudad con atracciones reales, clima, visas y transporte. Planifica con IA, edita con amigos y comparte tu plan.',
  },
  'en-US': {
    lang: 'en-US',
    ogLocale: 'en_US',
    title: 'Tripilove — AI travel planner',
    description: 'Build your itinerary city by city with real attractions, weather, visa info and transport. Plan with AI, co-edit with friends and share your trip.',
  },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function buildHomeHead(locale, siteUrl, sameAs = []) {
  const m = HOME_META[locale];
  const origin = siteUrl.replace(/\/+$/, '');
  const image = `${origin}/og-default.png`;
  const org = { '@type': 'Organization', '@id': `${origin}/#org`, name: 'Tripilove', url: `${origin}/`, logo: `${origin}/favicon.svg` };
  if (sameAs.length) org.sameAs = sameAs;
  const site = { '@type': 'WebSite', '@id': `${origin}/#site`, name: 'Tripilove', url: `${origin}/`, inLanguage: m.lang, publisher: { '@id': `${origin}/#org` } };
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, site] }).replace(/</g, '\\u003c');
  return [
    `<meta name="description" content="${esc(m.description)}">`,
    `<meta name="theme-color" content="#7C3AED">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Tripilove">`,
    `<meta property="og:locale" content="${m.ogLocale}">`,
    `<meta property="og:title" content="${esc(m.title)}">`,
    `<meta property="og:description" content="${esc(m.description)}">`,
    `<meta property="og:url" content="${origin}/">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(m.title)}">`,
    `<meta name="twitter:description" content="${esc(m.description)}">`,
    `<meta name="twitter:image" content="${image}">`,
    `<script type="application/ld+json" id="tb-jsonld-site">${ld}</script>`,
  ].join('\n  ');
}

export function injectSeoHead(html, locale, siteUrl, sameAs = []) {
  const m = HOME_META[locale];
  // Function replacers: a title/description containing "$&" or "$1" must never be interpreted as a pattern.
  return html
    .replace(SEO_HEAD_MARKER, () => buildHomeHead(locale, siteUrl, sameAs))
    .replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${esc(m.title)}</title>`)
    .replace(/<html\s+lang="[^"]*"/i, () => `<html lang="${m.lang}"`);
}

export function buildRobotsTxt(siteUrl) {
  const origin = siteUrl.replace(/\/+$/, '');
  return ['User-agent: *', 'Allow: /', 'Disallow: /karma-history', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n');
}

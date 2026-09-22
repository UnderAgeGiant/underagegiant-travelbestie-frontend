// IMPORT-FREE on purpose (see guide-quality.util.ts). Editorial copy is Spanish (es-CL) only.
// Rules for every field: verifiable facts only — no prices, no opening hours, no unsourced superlatives;
// flight info is "aprox."; never claim a visa outcome as law (the page shows the dataset's answer separately).
export interface CityGuideEntry {
  slug: string;
  cityId: string;
  displayName: string;
  wave: 1 | 2 | 3;
  timeZone: string;        // IANA — used for the "diferencia horaria con Chile" fact
  reviewed: boolean;       // owner-approved copy; only reviewed guides can be indexed
  intro: string;           // 2–3 sentences
  bestTime: string;        // one sentence: best seasons and why
  gettingThere: string;    // 1–2 sentences, from Chile, "aprox."
  tips: string[];          // 3–5 short practical tips
  faq: { q: string; a: string }[];   // 3–5, each answer a self-contained 1–3 sentences
}

export const HOME_TIME_ZONE = 'America/Santiago';

export const CITY_GUIDES: CityGuideEntry[] = [
  {
    slug: 'madrid',
    cityId: 'madrid',
    displayName: 'Madrid',
    wave: 1,
    timeZone: 'Europe/Madrid',
    reviewed: false,
    intro:
      'Madrid es la capital de España y una de las ciudades europeas con más museos y más vida de calle. En pocos días puedes recorrer el Triángulo del Arte (Prado, Reina Sofía y Thyssen), pasear por el Retiro y el Madrid de los Austrias, y salir de excursión a Toledo o Segovia.',
    bestTime:
      'Primavera (abril a junio) y otoño (septiembre y octubre) son las épocas más agradables; el verano es muy caluroso y el invierno es frío pero soleado.',
    gettingThere:
      'Desde Santiago hay vuelos con escala y, según la temporada, directos; el vuelo directo dura aprox. 13 horas. Del aeropuerto Madrid-Barajas al centro se llega en metro, cercanías o bus.',
    tips: [
      'Muchos museos tienen tramos de entrada gratuita o reducida en ciertos días y horarios: confírmalo en el sitio oficial de cada museo antes de ir.',
      'La cena es más tarde que en Chile: muchas cocinas abren recién desde las 20:30.',
      'El centro se recorre bien a pie; para distancias mayores el metro y los buses cubren casi toda la ciudad.',
      'Reserva con anticipación el Palacio Real y los museos principales en temporada alta para evitar filas.',
    ],
    faq: [
      {
        q: '¿Cuántos días necesito para conocer Madrid?',
        a: 'Con 3 días recorres lo esencial: los museos principales, el Palacio Real, el Retiro y los barrios del centro. Con 4 o 5 días puedes sumar una excursión a Toledo o Segovia.',
      },
      {
        q: '¿Necesito visa para viajar a Madrid desde Chile?',
        a: 'Como turista, los chilenos pueden ingresar a España (espacio Schengen) sin visa por estadías cortas. Antes de viajar confirma siempre los requisitos vigentes, incluidas autorizaciones electrónicas nuevas si corresponden.',
      },
      {
        q: '¿Qué excursiones puedo hacer desde Madrid en un día?',
        a: 'Las más populares son Toledo, Segovia, El Escorial y Alcalá de Henares. Todas quedan a poca distancia y se pueden hacer en tren o bus.',
      },
    ],
  },
];

export const guideBySlug = (slug: string): CityGuideEntry | undefined => CITY_GUIDES.find(g => g.slug === slug);
export const guideByCityId = (cityId: string): CityGuideEntry | undefined => CITY_GUIDES.find(g => g.cityId === cityId);

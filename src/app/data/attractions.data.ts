import { Attraction } from '../core/models/comment.model';
import { City } from '../core/models/city.model';
import { AttractionCategory } from '../core/models/attraction-category';
import { CURATED_ALL } from './attractions-curated';

type RegionTemplate = { n: (c: City) => string; t: string; c: AttractionCategory; i: string; bg: string; e: number }[];
const REGION_TMPL: Record<string, RegionTemplate> = {
  europe: [
    { n: c => `${c.name} Casco Antiguo`, c: 'poi',    t: 'Histórico',  i: '🏰', bg: '#FDF5E8', e: 90  },
    { n: _ => 'Catedral Nacional',        c: 'poi',    t: 'Histórico',  i: '⛪', bg: '#E8F0FD', e: 60  },
    { n: _ => 'Museo Nacional',           c: 'poi',    t: 'Museo',      i: '🏛️', bg: '#EEE8FD', e: 120 },
    { n: c => `Mercado de ${c.name}`,     c: 'foodie', t: 'Foodie',     i: '🥐', bg: '#FDF5E8', e: 90  },
    { n: c => `Parque de ${c.name}`,      c: 'poi',    t: 'Parque',     i: '🌳', bg: '#E8FDE8', e: 75  },
  ],
  asia: [
    { n: c => `Templo de ${c.name}`,    c: 'poi',    t: 'Templo',   i: '⛩️', bg: '#FDE8E8', e: 60  },
    { n: _ => 'Mercado Nocturno',        c: 'foodie', t: 'Foodie',   i: '🏮', bg: '#FDF5E8', e: 90  },
    { n: _ => 'Jardín Botánico',         c: 'poi',    t: 'Jardín',   i: '🌸', bg: '#FDE8F5', e: 90  },
    { n: _ => 'Museo del Patrimonio',    c: 'poi',    t: 'Museo',    i: '🏛️', bg: '#E8F0FD', e: 120 },
    { n: c => `Malecón de ${c.name}`,   c: 'poi',    t: 'Mirador',  i: '🌊', bg: '#E8F5FD', e: 60  },
  ],
  americas: [
    { n: c => `Centro Histórico de ${c.name}`, c: 'poi',    t: 'Histórico', i: '🏛️', bg: '#E8F0FD', e: 90  },
    { n: _ => 'Museo de Arte',                  c: 'poi',    t: 'Museo',     i: '🖼️', bg: '#EEE8FD', e: 120 },
    { n: c => `Parque de ${c.name}`,            c: 'poi',    t: 'Parque',    i: '🌳', bg: '#E8FDE8', e: 75  },
    { n: c => `Mercado de ${c.name}`,           c: 'foodie', t: 'Foodie',    i: '🌮', bg: '#FDF5E8', e: 90  },
    { n: _ => 'Paseo Costero',                  c: 'poi',    t: 'Mirador',   i: '🌅', bg: '#FDF5E8', e: 60  },
  ],
  africa: [
    { n: _ => 'Medina Antigua',         c: 'poi',    t: 'Histórico', i: '🕌', bg: '#FDF5E8', e: 90  },
    { n: _ => 'Museo Nacional',          c: 'poi',    t: 'Museo',     i: '🏛️', bg: '#E8F0FD', e: 120 },
    { n: c => `Mercado de ${c.name}`,   c: 'foodie', t: 'Foodie',    i: '🧺', bg: '#FDF5E8', e: 90  },
    { n: _ => 'Jardín Botánico',         c: 'poi',    t: 'Jardín',    i: '🌴', bg: '#E8FDE8', e: 75  },
    { n: _ => 'Centro Cultural',         c: 'poi',    t: 'Cultura',   i: '🎭', bg: '#EEE8FD', e: 90  },
  ],
  oceania: [
    { n: c => `Puerto de ${c.name}`,  c: 'poi',  t: 'Malecón', i: '⛵', bg: '#E8F5FD', e: 60  },
    { n: _ => 'Jardín Botánico',       c: 'poi',  t: 'Jardín',  i: '🌿', bg: '#E8FDE8', e: 90  },
    { n: _ => 'Galería de Arte',        c: 'poi',  t: 'Museo',   i: '🖼️', bg: '#EEE8FD', e: 90  },
    { n: c => `Playa de ${c.name}`,   c: 'poi',  t: 'Playa',   i: '🏄', bg: '#FDE8F5', e: 120 },
    { n: _ => 'Museo Nacional',         c: 'poi',  t: 'Museo',   i: '🏛️', bg: '#FDF5E8', e: 120 },
  ],
};

function hashRating(cityId: string, index: number): number {
  let h = 0;
  for (const ch of cityId) h = ((h << 5) - h) + ch.charCodeAt(0);
  return Math.abs(h + index * 31) % 10;
}

export function getAttractions(city: City): Attraction[] {
  if (CURATED_ALL[city.id]) {
    return CURATED_ALL[city.id]
      .filter(a => a.active)
      .map(a => ({
        ...a,
        imageUrl: a.imageUrl?.startsWith('http://') ? undefined : a.imageUrl,
      }));
  }
  const tmpl = REGION_TMPL[city.region] ?? REGION_TMPL['europe'];
  return tmpl.map((x, i) => ({
    id: `${city.id}_${i}`,
    name: x.n(city),
    type: x.t,
    category: x.c,
    active: true,
    icon: x.i,
    bg: x.bg,
    rating: parseFloat((4.0 + hashRating(city.id, i) / 10).toFixed(1)),
    estimatedMinutes: x.e,
  }));
}

/** Returns an attraction by id regardless of its active flag — use when rendering existing trip stops. */
export function findCuratedAttraction(cityId: string, attractionId: string): Attraction | undefined {
  return CURATED_ALL[cityId]?.find(a => a.id === attractionId);
}

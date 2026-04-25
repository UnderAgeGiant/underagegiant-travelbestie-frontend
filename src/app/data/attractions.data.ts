import { Attraction } from '../core/models/comment.model';
import { City } from '../core/models/city.model';

type CuratedMap = Record<string, Omit<Attraction, 'id'>[]>;

const CURATED: CuratedMap = {
  paris: [
    { name: 'Torre Eiffel',      type: 'Atractivo',  icon: '🗼', bg: '#FDE8F5', rating: 4.9, estimatedMinutes: 120 },
    { name: 'El Louvre',         type: 'Museo',       icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 180 },
    { name: 'Montmartre',        type: 'Barrio',      icon: '🎨', bg: '#FDF5E8', rating: 4.7, estimatedMinutes: 90  },
    { name: "Musée d'Orsay",     type: 'Museo',       icon: '🖼️', bg: '#E8FDF0', rating: 4.8, estimatedMinutes: 150 },
    { name: 'Sainte-Chapelle',   type: 'Histórico',   icon: '⛪', bg: '#EEE8FD', rating: 4.7, estimatedMinutes: 60  },
  ],
  london: [
    { name: 'Torre de Londres',     type: 'Histórico',       icon: '🏰', bg: '#FDE8E8', rating: 4.8, estimatedMinutes: 120 },
    { name: 'Museo Británico',      type: 'Museo',           icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 150 },
    { name: 'Palacio de Buckingham',type: 'Atractivo',       icon: '👑', bg: '#FDF5E8', rating: 4.6, estimatedMinutes: 60  },
    { name: 'Camden Market',        type: 'Mercado',         icon: '🎪', bg: '#EEE8FD', rating: 4.5, estimatedMinutes: 90  },
    { name: 'Tate Modern',          type: 'Museo',           icon: '🖼️', bg: '#E8FDE8', rating: 4.7, estimatedMinutes: 120 },
  ],
  tokyo: [
    { name: 'Templo Senso-ji',      type: 'Templo',    icon: '⛩️', bg: '#FDE8E8', rating: 4.8, estimatedMinutes: 60  },
    { name: 'Cruce de Shibuya',     type: 'Atractivo', icon: '🚦', bg: '#E8F5FD', rating: 4.6, estimatedMinutes: 30  },
    { name: 'Jardín Shinjuku',      type: 'Parque',    icon: '🌸', bg: '#FDE8F5', rating: 4.8, estimatedMinutes: 90  },
    { name: 'Akihabara',            type: 'Distrito',  icon: '🎮', bg: '#EEE8FD', rating: 4.5, estimatedMinutes: 120 },
    { name: 'teamLab Borderless',   type: 'Arte',      icon: '✨', bg: '#E8FDF5', rating: 4.9, estimatedMinutes: 120 },
  ],
  rome: [
    { name: 'Coliseo',             type: 'Histórico', icon: '🏟️', bg: '#FDF5E8', rating: 4.9, estimatedMinutes: 120 },
    { name: 'Museos Vaticanos',    type: 'Museo',     icon: '🏛️', bg: '#E8F0FD', rating: 4.8, estimatedMinutes: 180 },
    { name: 'Fontana di Trevi',    type: 'Atractivo', icon: '⛲', bg: '#E8FDF5', rating: 4.7, estimatedMinutes: 30  },
    { name: 'Panteón',             type: 'Histórico', icon: '🏺', bg: '#EEE8FD', rating: 4.8, estimatedMinutes: 60  },
    { name: 'Trastevere',          type: 'Barrio',    icon: '🍝', bg: '#FDE8F5', rating: 4.6, estimatedMinutes: 90  },
  ],
  barcelona: [
    { name: 'Sagrada Família',  type: 'Atractivo', icon: '⛪', bg: '#FDE8F5', rating: 4.9, estimatedMinutes: 120 },
    { name: 'Park Güell',       type: 'Parque',    icon: '🌈', bg: '#E8FDF0', rating: 4.7, estimatedMinutes: 90  },
    { name: 'Las Ramblas',      type: 'Bulevar',   icon: '🌺', bg: '#FDF5E8', rating: 4.4, estimatedMinutes: 60  },
    { name: 'Barrio Gótico',    type: 'Barrio',    icon: '🏰', bg: '#EEE8FD', rating: 4.7, estimatedMinutes: 90  },
    { name: 'Camp Nou',         type: 'Estadio',   icon: '⚽', bg: '#E8F0FD', rating: 4.6, estimatedMinutes: 120 },
  ],
  amsterdam: [
    { name: 'Rijksmuseum',            type: 'Museo',     icon: '🖼️', bg: '#E8F0FD', rating: 4.8, estimatedMinutes: 150 },
    { name: 'Museo Van Gogh',         type: 'Museo',     icon: '🌻', bg: '#FDF5E8', rating: 4.8, estimatedMinutes: 120 },
    { name: 'Casa de Ana Frank',      type: 'Histórico', icon: '📖', bg: '#FDE8E8', rating: 4.7, estimatedMinutes: 90  },
    { name: 'Barrio Jordaan',         type: 'Barrio',    icon: '🚲', bg: '#E8FDF5', rating: 4.6, estimatedMinutes: 90  },
    { name: 'Jardines de Keukenhof',  type: 'Jardín',    icon: '🌷', bg: '#FDE8F5', rating: 4.8, estimatedMinutes: 120 },
  ],
  newyork: [
    { name: 'Central Park',     type: 'Parque',    icon: '🌳', bg: '#E8FDE8', rating: 4.8, estimatedMinutes: 90  },
    { name: 'MoMA',             type: 'Museo',     icon: '🖼️', bg: '#EEE8FD', rating: 4.8, estimatedMinutes: 120 },
    { name: 'Puente de Brooklyn', type: 'Atractivo', icon: '🌉', bg: '#E8F5FD', rating: 4.7, estimatedMinutes: 60  },
    { name: 'The High Line',    type: 'Parque',    icon: '🌿', bg: '#E8FDF0', rating: 4.6, estimatedMinutes: 60  },
    { name: 'Times Square',     type: 'Atractivo', icon: '🗽', bg: '#FDE8F5', rating: 4.3, estimatedMinutes: 45  },
  ],
  dubai: [
    { name: 'Burj Khalifa',     type: 'Atractivo',       icon: '🏙️', bg: '#E8F5FD', rating: 4.8, estimatedMinutes: 90  },
    { name: 'Dubai Mall',       type: 'Centro Comercial', icon: '🛍️', bg: '#FDE8F5', rating: 4.5, estimatedMinutes: 120 },
    { name: 'Palm Jumeirah',    type: 'Atractivo',        icon: '🌴', bg: '#E8FDE8', rating: 4.6, estimatedMinutes: 60  },
    { name: 'Museo de Dubái',   type: 'Museo',            icon: '🏛️', bg: '#FDF5E8', rating: 4.4, estimatedMinutes: 60  },
    { name: 'Dubai Creek',      type: 'Histórico',        icon: '⛵', bg: '#EEE8FD', rating: 4.5, estimatedMinutes: 60  },
  ],
  marrakech: [
    { name: 'Djemaa el-Fna',    type: 'Plaza',     icon: '🎭', bg: '#FDE8E8', rating: 4.7, estimatedMinutes: 90  },
    { name: 'Jardín Majorelle', type: 'Jardín',    icon: '🪴', bg: '#E8FDF5', rating: 4.8, estimatedMinutes: 60  },
    { name: 'La Medina',        type: 'Histórico', icon: '🕌', bg: '#FDF5E8', rating: 4.6, estimatedMinutes: 120 },
    { name: 'Palacio Bahia',    type: 'Palacio',   icon: '👑', bg: '#EEE8FD', rating: 4.5, estimatedMinutes: 60  },
    { name: 'Los Zocos',        type: 'Mercado',   icon: '🧿', bg: '#FDE8F5', rating: 4.6, estimatedMinutes: 90  },
  ],
  sydney: [
    { name: 'Casa de la Ópera',    type: 'Atractivo', icon: '🎭', bg: '#E8F5FD', rating: 4.9, estimatedMinutes: 90  },
    { name: 'Playa de Bondi',      type: 'Playa',     icon: '🏄', bg: '#FDE8E8', rating: 4.7, estimatedMinutes: 120 },
    { name: 'Puente del Puerto',   type: 'Atractivo', icon: '🌉', bg: '#E8FDE8', rating: 4.8, estimatedMinutes: 60  },
    { name: 'Jardín Botánico Real',type: 'Jardín',    icon: '🌿', bg: '#E8FDF0', rating: 4.6, estimatedMinutes: 90  },
    { name: 'Darling Harbour',     type: 'Malecón',   icon: '⛵', bg: '#EEE8FD', rating: 4.5, estimatedMinutes: 90  },
  ],
};

type RegionTemplate = { n: (c: City) => string; t: string; i: string; bg: string; e: number }[];
const REGION_TMPL: Record<string, RegionTemplate> = {
  europe: [
    { n: c => `${c.name} Casco Antiguo`, t: 'Histórico',      i: '🏰', bg: '#FDF5E8', e: 90  },
    { n: _ => 'Catedral Nacional',        t: 'Sitio Religioso', i: '⛪', bg: '#E8F0FD', e: 60  },
    { n: _ => 'Museo Nacional',           t: 'Museo',           i: '🏛️', bg: '#EEE8FD', e: 120 },
    { n: c => `Mercado de ${c.name}`,     t: 'Mercado',         i: '🥐', bg: '#FDE8F5', e: 90  },
    { n: c => `Parque de ${c.name}`,      t: 'Parque',          i: '🌳', bg: '#E8FDE8', e: 75  },
  ],
  asia: [
    { n: c => `Templo de ${c.name}`,    t: 'Templo',   i: '⛩️', bg: '#FDE8E8', e: 60  },
    { n: _ => 'Mercado Nocturno',        t: 'Mercado',  i: '🏮', bg: '#FDF5E8', e: 90  },
    { n: _ => 'Jardín Botánico',         t: 'Jardín',   i: '🌸', bg: '#FDE8F5', e: 90  },
    { n: _ => 'Museo del Patrimonio',    t: 'Museo',    i: '🏛️', bg: '#E8F0FD', e: 120 },
    { n: c => `Malecón de ${c.name}`,   t: 'Mirador',  i: '🌊', bg: '#E8F5FD', e: 60  },
  ],
  americas: [
    { n: c => `Centro Histórico de ${c.name}`, t: 'Histórico', i: '🏛️', bg: '#E8F0FD', e: 90  },
    { n: _ => 'Museo de Arte',                  t: 'Museo',     i: '🖼️', bg: '#EEE8FD', e: 120 },
    { n: c => `Parque de ${c.name}`,            t: 'Parque',    i: '🌳', bg: '#E8FDE8', e: 75  },
    { n: c => `Mercado de ${c.name}`,           t: 'Mercado',   i: '🌮', bg: '#FDE8F5', e: 90  },
    { n: _ => 'Paseo Costero',                  t: 'Mirador',   i: '🌅', bg: '#FDF5E8', e: 60  },
  ],
  africa: [
    { n: _ => 'Medina Antigua',         t: 'Histórico', i: '🕌', bg: '#FDF5E8', e: 90  },
    { n: _ => 'Museo Nacional',          t: 'Museo',     i: '🏛️', bg: '#E8F0FD', e: 120 },
    { n: c => `Mercado de ${c.name}`,   t: 'Mercado',   i: '🧺', bg: '#FDE8E8', e: 90  },
    { n: _ => 'Jardín Botánico',         t: 'Jardín',    i: '🌴', bg: '#E8FDE8', e: 75  },
    { n: _ => 'Centro Cultural',         t: 'Cultura',   i: '🎭', bg: '#EEE8FD', e: 90  },
  ],
  oceania: [
    { n: c => `Puerto de ${c.name}`,  t: 'Malecón', i: '⛵', bg: '#E8F5FD', e: 60  },
    { n: _ => 'Jardín Botánico',       t: 'Jardín',  i: '🌿', bg: '#E8FDE8', e: 90  },
    { n: _ => 'Galería de Arte',        t: 'Museo',   i: '🖼️', bg: '#EEE8FD', e: 90  },
    { n: c => `Playa de ${c.name}`,   t: 'Playa',   i: '🏄', bg: '#FDE8F5', e: 120 },
    { n: _ => 'Museo Nacional',         t: 'Museo',   i: '🏛️', bg: '#FDF5E8', e: 120 },
  ],
};

function hashRating(cityId: string, index: number): number {
  let h = 0;
  for (const ch of cityId) h = ((h << 5) - h) + ch.charCodeAt(0);
  return Math.abs(h + index * 31) % 10;
}

export function getAttractions(city: City): Attraction[] {
  if (CURATED[city.id]) {
    return CURATED[city.id].map((a, i) => ({ ...a, id: `${city.id}_${i}` }));
  }
  const tmpl = REGION_TMPL[city.region] ?? REGION_TMPL['europe'];
  return tmpl.map((x, i) => ({
    id: `${city.id}_${i}`,
    name: x.n(city),
    type: x.t,
    icon: x.i,
    bg: x.bg,
    rating: parseFloat((4.0 + hashRating(city.id, i) / 10).toFixed(1)),
    estimatedMinutes: x.e,
  }));
}

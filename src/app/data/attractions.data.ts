import { Attraction } from '../core/models/comment.model';
import { CuratedMap } from '../core/models/curated.model';
import { City } from '../core/models/city.model';
import { CURATED_ALL } from './attractions-curated';

const Q = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

let CURATED: CuratedMap = {
  paris: [
    { name: 'Torre Eiffel',      type: 'Atractivo',  icon: '🗼', bg: '#FDE8F5', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1502602898657-3e91760cbb34') },
    { name: 'El Louvre',         type: 'Museo',       icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 180, imageUrl: Q('1566073002471-9be4d7a1b07b') },
    { name: 'Montmartre',        type: 'Barrio',      icon: '🎨', bg: '#FDF5E8', rating: 4.7, estimatedMinutes: 90,  imageUrl: Q('1502602898657-3e91760cbb34') },
    { name: "Musée d'Orsay",     type: 'Museo',       icon: '🖼️', bg: '#E8FDF0', rating: 4.8, estimatedMinutes: 150, imageUrl: Q('1502602898657-3e91760cbb34') },
    { name: 'Sainte-Chapelle',   type: 'Histórico',   icon: '⛪', bg: '#EEE8FD', rating: 4.7, estimatedMinutes: 60,  imageUrl: Q('1502602898657-3e91760cbb34') },
    { name: 'Paris, Banks of the Seine',        type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1502602898657-3e91760cbb34') },
    { name: 'Palace and Park of Versailles',    type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1502602898657-3e91760cbb34') },
    { name: 'Palace and Park of Fontainebleau', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1502602898657-3e91760cbb34') },
    { name: 'Provins, Town of Medieval Fairs',  type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1502602898657-3e91760cbb34') },
    { name: 'Chartres Cathedral',               type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1502602898657-3e91760cbb34') },
  ],
  london: [
    { name: 'Torre de Londres',      type: 'Histórico', icon: '🏰', bg: '#FDE8E8', rating: 4.8, estimatedMinutes: 120, imageUrl: Q('1513635269975-59663e0ac1ad') },
    { name: 'Museo Británico',       type: 'Museo',     icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 150, imageUrl: Q('1513635269975-59663e0ac1ad') },
    { name: 'Palacio de Buckingham', type: 'Atractivo', icon: '👑', bg: '#FDF5E8', rating: 4.6, estimatedMinutes: 60,  imageUrl: Q('1513635269975-59663e0ac1ad') },
    { name: 'Camden Market',         type: 'Mercado',   icon: '🎪', bg: '#EEE8FD', rating: 4.5, estimatedMinutes: 90,  imageUrl: Q('1513635269975-59663e0ac1ad') },
    { name: 'Tate Modern',           type: 'Museo',     icon: '🖼️', bg: '#E8FDE8', rating: 4.7, estimatedMinutes: 120, imageUrl: Q('1513635269975-59663e0ac1ad') },
    { name: 'Maritime Greenwich',                                                               type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1513635269975-59663e0ac1ad') },
    { name: 'Tower of London',                                                                  type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1513635269975-59663e0ac1ad') },
    { name: "Palace of Westminster and Westminster Abbey",                                       type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1513635269975-59663e0ac1ad') },
    { name: 'Royal Botanic Gardens, Kew',                                                       type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1513635269975-59663e0ac1ad') },
    { name: 'Canterbury Cathedral and St Augustine\'s Abbey',                                   type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1513635269975-59663e0ac1ad') },
    { name: 'Blenheim Palace',                                                                  type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1513635269975-59663e0ac1ad') },
  ],
  tokyo: [
    { name: 'Templo Senso-ji',    type: 'Templo',    icon: '⛩️', bg: '#FDE8E8', rating: 4.8, estimatedMinutes: 60,  imageUrl: Q('1540959733332-eab4deabeeaf') },
    { name: 'Cruce de Shibuya',   type: 'Atractivo', icon: '🚦', bg: '#E8F5FD', rating: 4.6, estimatedMinutes: 30,  imageUrl: Q('1540959733332-eab4deabeeaf') },
    { name: 'Jardín Shinjuku',    type: 'Parque',    icon: '🌸', bg: '#FDE8F5', rating: 4.8, estimatedMinutes: 90,  imageUrl: Q('1540959733332-eab4deabeeaf') },
    { name: 'Akihabara',          type: 'Distrito',  icon: '🎮', bg: '#EEE8FD', rating: 4.5, estimatedMinutes: 120, imageUrl: Q('1540959733332-eab4deabeeaf') },
    { name: 'teamLab Borderless', type: 'Arte',      icon: '✨', bg: '#E8FDF5', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1540959733332-eab4deabeeaf') },
  ],
  rome: [
    { name: 'Coliseo',          type: 'Histórico', icon: '🏟️', bg: '#FDF5E8', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1552832230-c0197dd311b5') },
    { name: 'Museos Vaticanos', type: 'Museo',     icon: '🏛️', bg: '#E8F0FD', rating: 4.8, estimatedMinutes: 180, imageUrl: Q('1552832230-c0197dd311b5') },
    { name: 'Fontana di Trevi', type: 'Atractivo', icon: '⛲', bg: '#E8FDF5', rating: 4.7, estimatedMinutes: 30,  imageUrl: Q('1552832230-c0197dd311b5') },
    { name: 'Panteón',          type: 'Histórico', icon: '🏺', bg: '#EEE8FD', rating: 4.8, estimatedMinutes: 60,  imageUrl: Q('1552832230-c0197dd311b5') },
    { name: 'Trastevere',       type: 'Barrio',    icon: '🍝', bg: '#FDE8F5', rating: 4.6, estimatedMinutes: 90,  imageUrl: Q('1552832230-c0197dd311b5') },
    { name: 'Historic Centre of Rome',            type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1552832230-c0197dd311b5') },
    { name: 'Vatican City',                       type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1552832230-c0197dd311b5') },
    { name: 'Villa Adriana (Tivoli)',              type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1552832230-c0197dd311b5') },
    { name: "Villa d'Este, Tivoli",               type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1552832230-c0197dd311b5') },
    { name: 'Etruscan Necropolises of Cerveteri', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1552832230-c0197dd311b5') },
  ],
  barcelona: [
    { name: 'Sagrada Família', type: 'Atractivo', icon: '⛪', bg: '#FDE8F5', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1583422409516-2895a77efded') },
    { name: 'Park Güell',      type: 'Parque',    icon: '🌈', bg: '#E8FDF0', rating: 4.7, estimatedMinutes: 90,  imageUrl: Q('1583422409516-2895a77efded') },
    { name: 'Las Ramblas',     type: 'Bulevar',   icon: '🌺', bg: '#FDF5E8', rating: 4.4, estimatedMinutes: 60,  imageUrl: Q('1583422409516-2895a77efded') },
    { name: 'Barrio Gótico',   type: 'Barrio',    icon: '🏰', bg: '#EEE8FD', rating: 4.7, estimatedMinutes: 90,  imageUrl: Q('1583422409516-2895a77efded') },
    { name: 'Camp Nou',        type: 'Estadio',   icon: '⚽', bg: '#E8F0FD', rating: 4.6, estimatedMinutes: 120, imageUrl: Q('1583422409516-2895a77efded') },
    { name: 'Palau de la Musica Catalana',        type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1583422409516-2895a77efded') },
    { name: 'Works of Antoni Gaudi',              type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1583422409516-2895a77efded') },
    { name: 'Archaeological Ensemble of Tarraco', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1583422409516-2895a77efded') },
    { name: 'Poblet Monastery',                   type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1583422409516-2895a77efded') },
  ],
  amsterdam: [
    { name: 'Rijksmuseum',           type: 'Museo',     icon: '🖼️', bg: '#E8F0FD', rating: 4.8, estimatedMinutes: 150, imageUrl: Q('1512470876302-972faa2aa9a4') },
    { name: 'Museo Van Gogh',        type: 'Museo',     icon: '🌻', bg: '#FDF5E8', rating: 4.8, estimatedMinutes: 120, imageUrl: Q('1512470876302-972faa2aa9a4') },
    { name: 'Casa de Ana Frank',     type: 'Histórico', icon: '📖', bg: '#FDE8E8', rating: 4.7, estimatedMinutes: 90,  imageUrl: Q('1512470876302-972faa2aa9a4') },
    { name: 'Barrio Jordaan',        type: 'Barrio',    icon: '🚲', bg: '#E8FDF5', rating: 4.6, estimatedMinutes: 90,  imageUrl: Q('1512470876302-972faa2aa9a4') },
    { name: 'Jardines de Keukenhof', type: 'Jardín',    icon: '🌷', bg: '#FDE8F5', rating: 4.8, estimatedMinutes: 120, imageUrl: Q('1512470876302-972faa2aa9a4') },
    { name: 'Defence Line of Amsterdam',                      type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1512470876302-972faa2aa9a4') },
    { name: 'Seventeenth-Century Canal Ring of Amsterdam',    type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1512470876302-972faa2aa9a4') },
    { name: 'Droogmakerij de Beemster (Beemster Polder)',     type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1512470876302-972faa2aa9a4') },
    { name: 'Mill Network at Kinderdijk-Elshout',             type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1512470876302-972faa2aa9a4') },
    { name: 'Van Nellefabriek',                               type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1512470876302-972faa2aa9a4') },
    { name: 'Schokland and Surroundings',                     type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1512470876302-972faa2aa9a4') },
  ],
  newyork: [
    { name: 'Central Park',       type: 'Parque',    icon: '🌳', bg: '#E8FDE8', rating: 4.8, estimatedMinutes: 90,  imageUrl: Q('1485871981521-5b1fd3805eee') },
    { name: 'MoMA',               type: 'Museo',     icon: '🖼️', bg: '#EEE8FD', rating: 4.8, estimatedMinutes: 120, imageUrl: Q('1485871981521-5b1fd3805eee') },
    { name: 'Puente de Brooklyn', type: 'Atractivo', icon: '🌉', bg: '#E8F5FD', rating: 4.7, estimatedMinutes: 60,  imageUrl: Q('1485871981521-5b1fd3805eee') },
    { name: 'The High Line',      type: 'Parque',    icon: '🌿', bg: '#E8FDF0', rating: 4.6, estimatedMinutes: 60,  imageUrl: Q('1485871981521-5b1fd3805eee') },
    { name: 'Times Square',       type: 'Atractivo', icon: '🗽', bg: '#FDE8F5', rating: 4.3, estimatedMinutes: 45,  imageUrl: Q('1485871981521-5b1fd3805eee') },
    { name: 'Statue of Liberty',  type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1485871981521-5b1fd3805eee') },
  ],
  dubai: [
    { name: 'Burj Khalifa',   type: 'Atractivo',       icon: '🏙️', bg: '#E8F5FD', rating: 4.8, estimatedMinutes: 90,  imageUrl: Q('1512453979798-5ea266f8880c') },
    { name: 'Dubai Mall',     type: 'Centro Comercial', icon: '🛍️', bg: '#FDE8F5', rating: 4.5, estimatedMinutes: 120, imageUrl: Q('1512453979798-5ea266f8880c') },
    { name: 'Palm Jumeirah',  type: 'Atractivo',        icon: '🌴', bg: '#E8FDE8', rating: 4.6, estimatedMinutes: 60,  imageUrl: Q('1512453979798-5ea266f8880c') },
    { name: 'Museo de Dubái', type: 'Museo',            icon: '🏛️', bg: '#FDF5E8', rating: 4.4, estimatedMinutes: 60,  imageUrl: Q('1512453979798-5ea266f8880c') },
    { name: 'Dubai Creek',    type: 'Histórico',        icon: '⛵', bg: '#EEE8FD', rating: 4.5, estimatedMinutes: 60,  imageUrl: Q('1512453979798-5ea266f8880c') },
  ],
  marrakech: [
    { name: 'Djemaa el-Fna',    type: 'Plaza',     icon: '🎭', bg: '#FDE8E8', rating: 4.7, estimatedMinutes: 90,  imageUrl: Q('1543349689-9a4d426bee8e') },
    { name: 'Jardín Majorelle', type: 'Jardín',    icon: '🪴', bg: '#E8FDF5', rating: 4.8, estimatedMinutes: 60,  imageUrl: Q('1543349689-9a4d426bee8e') },
    { name: 'La Medina',        type: 'Histórico', icon: '🕌', bg: '#FDF5E8', rating: 4.6, estimatedMinutes: 120, imageUrl: Q('1543349689-9a4d426bee8e') },
    { name: 'Palacio Bahia',    type: 'Palacio',   icon: '👑', bg: '#EEE8FD', rating: 4.5, estimatedMinutes: 60,  imageUrl: Q('1543349689-9a4d426bee8e') },
    { name: 'Los Zocos',        type: 'Mercado',   icon: '🧿', bg: '#FDE8F5', rating: 4.6, estimatedMinutes: 90,  imageUrl: Q('1543349689-9a4d426bee8e') },
    { name: 'Medina of Marrakesh', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1543349689-9a4d426bee8e') },
  ],
  sydney: [
    { name: 'Casa de la Ópera',     type: 'Atractivo', icon: '🎭', bg: '#E8F5FD', rating: 4.9, estimatedMinutes: 90,  imageUrl: Q('1523482580672-f109ba8cb9be') },
    { name: 'Playa de Bondi',       type: 'Playa',     icon: '🏄', bg: '#FDE8E8', rating: 4.7, estimatedMinutes: 120, imageUrl: Q('1523482580672-f109ba8cb9be') },
    { name: 'Puente del Puerto',    type: 'Atractivo', icon: '🌉', bg: '#E8FDE8', rating: 4.8, estimatedMinutes: 60,  imageUrl: Q('1523482580672-f109ba8cb9be') },
    { name: 'Jardín Botánico Real', type: 'Jardín',    icon: '🌿', bg: '#E8FDF0', rating: 4.6, estimatedMinutes: 90,  imageUrl: Q('1523482580672-f109ba8cb9be') },
    { name: 'Darling Harbour',      type: 'Malecón',   icon: '⛵', bg: '#EEE8FD', rating: 4.5, estimatedMinutes: 90,  imageUrl: Q('1523482580672-f109ba8cb9be') },
    { name: 'Sydney Opera House',       type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1523482580672-f109ba8cb9be') },
    { name: 'Australian Convict Sites', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: Q('1523482580672-f109ba8cb9be') },
  ],
};

// CURATED_ALL fills in cities not hand-curated; hand-curated cities take priority
CURATED = { ...CURATED_ALL, ...CURATED };

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
    return CURATED[city.id].map((a, i) => ({
      ...a,
      id: `${city.id}_${i}`,
      // Strip HTTP UNESCO thumbnails so they never reach the UI
      imageUrl: a.imageUrl?.startsWith('http://') ? undefined : a.imageUrl,
    }));
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

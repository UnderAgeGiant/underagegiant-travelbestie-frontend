import { Attraction } from '../core/models/comment.model';
import { CuratedMap } from '../core/models/curated.model';
import { City } from '../core/models/city.model';
import { CURATED_ALL } from './attractions-curated';

const U = (q: string) => `https://source.unsplash.com/featured/600x400?${q}`;

let CURATED: CuratedMap = {
  paris: [
    { name: 'Torre Eiffel',      type: 'Atractivo',  icon: '🗼', bg: '#FDE8F5', rating: 4.9, estimatedMinutes: 120, imageUrl: U('eiffel,tower,paris') },
    { name: 'El Louvre',         type: 'Museo',       icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 180, imageUrl: U('louvre,museum,paris') },
    { name: 'Montmartre',        type: 'Barrio',      icon: '🎨', bg: '#FDF5E8', rating: 4.7, estimatedMinutes: 90,  imageUrl: U('montmartre,paris,street') },
    { name: "Musée d'Orsay",     type: 'Museo',       icon: '🖼️', bg: '#E8FDF0', rating: 4.8, estimatedMinutes: 150, imageUrl: U('musee,orsay,paris') },
    { name: 'Sainte-Chapelle',   type: 'Histórico',   icon: '⛪', bg: '#EEE8FD', rating: 4.7, estimatedMinutes: 60,  imageUrl: U('sainte,chapelle,paris') },
    { name: 'Paris, Banks of the Seine', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0600_0001-750-0-20110920201837.jpg' },
    { name: 'Palace and Park of Versailles', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0083_0019-750-0-20130523172531.jpg' },
    { name: 'Palace and Park of Fontainebleau', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0160_0001-750-0-20090505174849.jpg' },
    { name: 'Provins, Town of Medieval Fairs', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0873_0011-750-0-20121115154404.jpg' },
    { name: 'Chartres Cathedral', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0081_0001-750-0-20061213122149.jpg' },
  ],
  london: [
    { name: 'Torre de Londres',      type: 'Histórico',        icon: '🏰', bg: '#FDE8E8', rating: 4.8, estimatedMinutes: 120, imageUrl: U('tower,london,castle') },
    { name: 'Museo Británico',       type: 'Museo',            icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 150, imageUrl: U('british,museum,london') },
    { name: 'Palacio de Buckingham', type: 'Atractivo',        icon: '👑', bg: '#FDF5E8', rating: 4.6, estimatedMinutes: 60,  imageUrl: U('buckingham,palace,london') },
    { name: 'Camden Market',         type: 'Mercado',          icon: '🎪', bg: '#EEE8FD', rating: 4.5, estimatedMinutes: 90,  imageUrl: U('camden,market,london') },
    { name: 'Tate Modern',           type: 'Museo',            icon: '🖼️', bg: '#E8FDE8', rating: 4.7, estimatedMinutes: 120, imageUrl: U('tate,modern,art,london') },
    { name: 'Maritime Greenwich', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0795_0007-750-0-20110805144555.jpg' },
    { name: 'Tower of London', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0488_0026-750-0-20140214153431.jpg' },
    { name: 'Palace of Westminster and Westminster Abbey including Saint Margaret\'s Church', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0426_0004-750-0-20110805164029.jpg' },
    { name: 'Royal Botanic Gardens, Kew', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_1084_0026-750-0-20140109125421.jpg' },
    { name: 'Canterbury Cathedral, St Augustine\'s Abbey, and St Martin\'s Church', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0496_0001-750-0-20090923140329.jpg' },
    { name: 'Blenheim Palace', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0425_0001-750-0-20090915122907.jpg' },
  ],
  tokyo: [
    { name: 'Templo Senso-ji',    type: 'Templo',    icon: '⛩️', bg: '#FDE8E8', rating: 4.8, estimatedMinutes: 60,  imageUrl: U('senso-ji,temple,tokyo') },
    { name: 'Cruce de Shibuya',   type: 'Atractivo', icon: '🚦', bg: '#E8F5FD', rating: 4.6, estimatedMinutes: 30,  imageUrl: U('shibuya,crossing,tokyo') },
    { name: 'Jardín Shinjuku',    type: 'Parque',    icon: '🌸', bg: '#FDE8F5', rating: 4.8, estimatedMinutes: 90,  imageUrl: U('shinjuku,garden,tokyo,cherry') },
    { name: 'Akihabara',          type: 'Distrito',  icon: '🎮', bg: '#EEE8FD', rating: 4.5, estimatedMinutes: 120, imageUrl: U('akihabara,tokyo,neon') },
    { name: 'teamLab Borderless', type: 'Arte',      icon: '✨', bg: '#E8FDF5', rating: 4.9, estimatedMinutes: 120, imageUrl: U('digital,art,installation,light') },
  ],
  rome: [
    { name: 'Coliseo',          type: 'Histórico', icon: '🏟️', bg: '#FDF5E8', rating: 4.9, estimatedMinutes: 120, imageUrl: U('colosseum,rome,italy') },
    { name: 'Museos Vaticanos', type: 'Museo',     icon: '🏛️', bg: '#E8F0FD', rating: 4.8, estimatedMinutes: 180, imageUrl: U('vatican,museum,rome') },
    { name: 'Fontana di Trevi', type: 'Atractivo', icon: '⛲', bg: '#E8FDF5', rating: 4.7, estimatedMinutes: 30,  imageUrl: U('trevi,fountain,rome') },
    { name: 'Panteón',          type: 'Histórico', icon: '🏺', bg: '#EEE8FD', rating: 4.8, estimatedMinutes: 60,  imageUrl: U('pantheon,rome,italy') },
    { name: 'Trastevere',       type: 'Barrio',    icon: '🍝', bg: '#FDE8F5', rating: 4.6, estimatedMinutes: 90,  imageUrl: U('trastevere,rome,cobblestone') },
    { name: 'Historic Centre of Rome, the Properties of the Holy See in that City Enjoying Extraterritorial Rights and San Paolo Fuori le Mura', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0091_0061-750-0-20140709164150.jpg' },
    { name: 'Vatican City', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0286_0004-750-0-20101025105041.jpg' },
    { name: 'Villa Adriana (Tivoli)', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0907_0005-750-0-20140623115543.jpg' },
    { name: "Villa d'Este, Tivoli", type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_1025_0006-750-0-20140623115319.jpg' },
    { name: 'Etruscan Necropolises of Cerveteri and Tarquinia', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_1158_0001-750-0-20130912132554.jpg' },
  ],
  barcelona: [
    { name: 'Sagrada Família', type: 'Atractivo', icon: '⛪', bg: '#FDE8F5', rating: 4.9, estimatedMinutes: 120, imageUrl: U('sagrada,familia,barcelona') },
    { name: 'Park Güell',      type: 'Parque',    icon: '🌈', bg: '#E8FDF0', rating: 4.7, estimatedMinutes: 90,  imageUrl: U('park,guell,barcelona') },
    { name: 'Las Ramblas',     type: 'Bulevar',   icon: '🌺', bg: '#FDF5E8', rating: 4.4, estimatedMinutes: 60,  imageUrl: U('las,ramblas,barcelona') },
    { name: 'Barrio Gótico',   type: 'Barrio',    icon: '🏰', bg: '#EEE8FD', rating: 4.7, estimatedMinutes: 90,  imageUrl: U('gothic,quarter,barcelona') },
    { name: 'Camp Nou',        type: 'Estadio',   icon: '⚽', bg: '#E8F0FD', rating: 4.6, estimatedMinutes: 120, imageUrl: U('camp,nou,football,stadium') },
    { name: 'Palau de la Musica Catalana and Hospital de Sant Pau, Barcelona', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0804_0001-750-0-20090828154740.jpg' },
    { name: 'Works of Antoni Gaudi', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0320_0001-750-0-20090828152832.jpg' },
    { name: 'Archaeological Ensemble of Tarraco', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0875_0009-750-0-20140212113510.jpg' },
    { name: 'Poblet Monastery', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0518_0001-750-0-20090924134955.jpg' },
  ],
  amsterdam: [
    { name: 'Rijksmuseum',           type: 'Museo',     icon: '🖼️', bg: '#E8F0FD', rating: 4.8, estimatedMinutes: 150, imageUrl: U('rijksmuseum,amsterdam') },
    { name: 'Museo Van Gogh',        type: 'Museo',     icon: '🌻', bg: '#FDF5E8', rating: 4.8, estimatedMinutes: 120, imageUrl: U('van,gogh,museum,amsterdam') },
    { name: 'Casa de Ana Frank',     type: 'Histórico', icon: '📖', bg: '#FDE8E8', rating: 4.7, estimatedMinutes: 90,  imageUrl: U('anne,frank,amsterdam,canal') },
    { name: 'Barrio Jordaan',        type: 'Barrio',    icon: '🚲', bg: '#E8FDF5', rating: 4.6, estimatedMinutes: 90,  imageUrl: U('jordaan,canal,amsterdam,bicycle') },
    { name: 'Jardines de Keukenhof', type: 'Jardín',    icon: '🌷', bg: '#FDE8F5', rating: 4.8, estimatedMinutes: 120, imageUrl: U('keukenhof,tulips,netherlands') },
    { name: 'Defence Line of Amsterdam', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0759_0001-750-0-20090924115626.jpg' },
    { name: 'Seventeenth-Century Canal Ring Area of Amsterdam inside the Singelgracht', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_1349_0002-750-0-20100730121627.jpg' },
    { name: 'Droogmakerij de Beemster (Beemster Polder)', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0899_0001-750-0-20090922142742.jpg' },
    { name: 'Mill Network at Kinderdijk-Elshout', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0818_0006-750-0-20150518200215.jpg' },
    { name: 'Van Nellefabriek', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_1441_0007-750-0-20140622074147.jpg' },
    { name: 'Schokland and Surroundings', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0739_0001-750-0-20090929114517.jpg' },
  ],
  newyork: [
    { name: 'Central Park',       type: 'Parque',    icon: '🌳', bg: '#E8FDE8', rating: 4.8, estimatedMinutes: 90,  imageUrl: U('central,park,new,york') },
    { name: 'MoMA',               type: 'Museo',     icon: '🖼️', bg: '#EEE8FD', rating: 4.8, estimatedMinutes: 120, imageUrl: U('moma,art,museum,new,york') },
    { name: 'Puente de Brooklyn', type: 'Atractivo', icon: '🌉', bg: '#E8F5FD', rating: 4.7, estimatedMinutes: 60,  imageUrl: U('brooklyn,bridge,new,york') },
    { name: 'The High Line',      type: 'Parque',    icon: '🌿', bg: '#E8FDF0', rating: 4.6, estimatedMinutes: 60,  imageUrl: U('high,line,new,york,park') },
    { name: 'Times Square',       type: 'Atractivo', icon: '🗽', bg: '#FDE8F5', rating: 4.3, estimatedMinutes: 45,  imageUrl: U('times,square,new,york,night') },
    { name: 'Statue of Liberty', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0307_0001-750-0-20110920201028.jpg' },
  ],
  dubai: [
    { name: 'Burj Khalifa',   type: 'Atractivo',        icon: '🏙️', bg: '#E8F5FD', rating: 4.8, estimatedMinutes: 90,  imageUrl: U('burj,khalifa,dubai') },
    { name: 'Dubai Mall',     type: 'Centro Comercial',  icon: '🛍️', bg: '#FDE8F5', rating: 4.5, estimatedMinutes: 120, imageUrl: U('dubai,mall,luxury,shopping') },
    { name: 'Palm Jumeirah',  type: 'Atractivo',         icon: '🌴', bg: '#E8FDE8', rating: 4.6, estimatedMinutes: 60,  imageUrl: U('palm,jumeirah,dubai,aerial') },
    { name: 'Museo de Dubái', type: 'Museo',             icon: '🏛️', bg: '#FDF5E8', rating: 4.4, estimatedMinutes: 60,  imageUrl: U('dubai,museum,heritage,historic') },
    { name: 'Dubai Creek',    type: 'Histórico',         icon: '⛵', bg: '#EEE8FD', rating: 4.5, estimatedMinutes: 60,  imageUrl: U('dubai,creek,boat,waterway') },
  ],
  marrakech: [
    { name: 'Djemaa el-Fna',    type: 'Plaza',     icon: '🎭', bg: '#FDE8E8', rating: 4.7, estimatedMinutes: 90,  imageUrl: U('marrakech,square,market,morocco') },
    { name: 'Jardín Majorelle', type: 'Jardín',    icon: '🪴', bg: '#E8FDF5', rating: 4.8, estimatedMinutes: 60,  imageUrl: U('majorelle,garden,blue,marrakech') },
    { name: 'La Medina',        type: 'Histórico', icon: '🕌', bg: '#FDF5E8', rating: 4.6, estimatedMinutes: 120, imageUrl: U('medina,marrakech,morocco,historic') },
    { name: 'Palacio Bahia',    type: 'Palacio',   icon: '👑', bg: '#EEE8FD', rating: 4.5, estimatedMinutes: 60,  imageUrl: U('bahia,palace,marrakech,ornate') },
    { name: 'Los Zocos',        type: 'Mercado',   icon: '🧿', bg: '#FDE8F5', rating: 4.6, estimatedMinutes: 90,  imageUrl: U('souk,spices,marrakech,market') },
    { name: 'Medina of Marrakesh', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0331_0007-750-0-20121206115918.jpg' },
  ],
  sydney: [
    { name: 'Casa de la Ópera',     type: 'Atractivo', icon: '🎭', bg: '#E8F5FD', rating: 4.9, estimatedMinutes: 90,  imageUrl: U('sydney,opera,house,harbour') },
    { name: 'Playa de Bondi',       type: 'Playa',     icon: '🏄', bg: '#FDE8E8', rating: 4.7, estimatedMinutes: 120, imageUrl: U('bondi,beach,sydney,waves') },
    { name: 'Puente del Puerto',    type: 'Atractivo', icon: '🌉', bg: '#E8FDE8', rating: 4.8, estimatedMinutes: 60,  imageUrl: U('sydney,harbour,bridge,city') },
    { name: 'Jardín Botánico Real', type: 'Jardín',    icon: '🌿', bg: '#E8FDF0', rating: 4.6, estimatedMinutes: 90,  imageUrl: U('royal,botanic,garden,sydney') },
    { name: 'Darling Harbour',      type: 'Malecón',   icon: '⛵', bg: '#EEE8FD', rating: 4.5, estimatedMinutes: 90,  imageUrl: U('darling,harbour,sydney,waterfront') },
    { name: 'Sydney Opera House', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_0166_0001-750-0-20110920195854.jpg' },
    { name: 'Australian Convict Sites', type: 'Histórico', icon: '🏛️', bg: '#E8F0FD', rating: 4.9, estimatedMinutes: 120, imageUrl: 'http://whc.unesco.org//uploads/thumbs/site_1306_0001-750-0-20100730121123.jpg' },
  ],
};

CURATED = Object.assign(CURATED, CURATED_ALL);

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

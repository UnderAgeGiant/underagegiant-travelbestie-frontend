import { Attraction } from '../core/models/comment.model';
import { City } from '../core/models/city.model';

type CuratedMap = Record<string, Omit<Attraction, 'id'>[]>;

const CURATED: CuratedMap = {
  paris: [
    { name: 'Eiffel Tower', type: 'Landmark', icon: '🗼', bg: '#FDE8F5', rating: 4.9 },
    { name: 'The Louvre', type: 'Museum', icon: '🏛️', bg: '#E8F0FD', rating: 4.9 },
    { name: 'Montmartre', type: 'Neighborhood', icon: '🎨', bg: '#FDF5E8', rating: 4.7 },
    { name: "Musée d'Orsay", type: 'Museum', icon: '🖼️', bg: '#E8FDF0', rating: 4.8 },
    { name: 'Sainte-Chapelle', type: 'Historic', icon: '⛪', bg: '#EEE8FD', rating: 4.7 },
  ],
  london: [
    { name: 'Tower of London', type: 'Historic', icon: '🏰', bg: '#FDE8E8', rating: 4.8 },
    { name: 'British Museum', type: 'Museum', icon: '🏛️', bg: '#E8F0FD', rating: 4.9 },
    { name: 'Buckingham Palace', type: 'Landmark', icon: '👑', bg: '#FDF5E8', rating: 4.6 },
    { name: 'Camden Market', type: 'Market', icon: '🎪', bg: '#EEE8FD', rating: 4.5 },
    { name: 'Tate Modern', type: 'Museum', icon: '🖼️', bg: '#E8FDE8', rating: 4.7 },
  ],
  tokyo: [
    { name: 'Senso-ji Temple', type: 'Temple', icon: '⛩️', bg: '#FDE8E8', rating: 4.8 },
    { name: 'Shibuya Crossing', type: 'Landmark', icon: '🚦', bg: '#E8F5FD', rating: 4.6 },
    { name: 'Shinjuku Garden', type: 'Park', icon: '🌸', bg: '#FDE8F5', rating: 4.8 },
    { name: 'Akihabara', type: 'District', icon: '🎮', bg: '#EEE8FD', rating: 4.5 },
    { name: 'teamLab Borderless', type: 'Art', icon: '✨', bg: '#E8FDF5', rating: 4.9 },
  ],
  rome: [
    { name: 'Colosseum', type: 'Historic', icon: '🏟️', bg: '#FDF5E8', rating: 4.9 },
    { name: 'Vatican Museums', type: 'Museum', icon: '🏛️', bg: '#E8F0FD', rating: 4.8 },
    { name: 'Trevi Fountain', type: 'Landmark', icon: '⛲', bg: '#E8FDF5', rating: 4.7 },
    { name: 'Pantheon', type: 'Historic', icon: '🏺', bg: '#EEE8FD', rating: 4.8 },
    { name: 'Trastevere', type: 'Neighborhood', icon: '🍝', bg: '#FDE8F5', rating: 4.6 },
  ],
  barcelona: [
    { name: 'Sagrada Família', type: 'Landmark', icon: '⛪', bg: '#FDE8F5', rating: 4.9 },
    { name: 'Park Güell', type: 'Park', icon: '🌈', bg: '#E8FDF0', rating: 4.7 },
    { name: 'Las Ramblas', type: 'Boulevard', icon: '🌺', bg: '#FDF5E8', rating: 4.4 },
    { name: 'Gothic Quarter', type: 'Neighborhood', icon: '🏰', bg: '#EEE8FD', rating: 4.7 },
    { name: 'Camp Nou', type: 'Stadium', icon: '⚽', bg: '#E8F0FD', rating: 4.6 },
  ],
  amsterdam: [
    { name: 'Rijksmuseum', type: 'Museum', icon: '🖼️', bg: '#E8F0FD', rating: 4.8 },
    { name: 'Van Gogh Museum', type: 'Museum', icon: '🌻', bg: '#FDF5E8', rating: 4.8 },
    { name: 'Anne Frank House', type: 'Historic', icon: '📖', bg: '#FDE8E8', rating: 4.7 },
    { name: 'Jordaan District', type: 'Neighborhood', icon: '🚲', bg: '#E8FDF5', rating: 4.6 },
    { name: 'Keukenhof Gardens', type: 'Garden', icon: '🌷', bg: '#FDE8F5', rating: 4.8 },
  ],
  newyork: [
    { name: 'Central Park', type: 'Park', icon: '🌳', bg: '#E8FDE8', rating: 4.8 },
    { name: 'MoMA', type: 'Museum', icon: '🖼️', bg: '#EEE8FD', rating: 4.8 },
    { name: 'Brooklyn Bridge', type: 'Landmark', icon: '🌉', bg: '#E8F5FD', rating: 4.7 },
    { name: 'The High Line', type: 'Park', icon: '🌿', bg: '#E8FDF0', rating: 4.6 },
    { name: 'Times Square', type: 'Landmark', icon: '🗽', bg: '#FDE8F5', rating: 4.3 },
  ],
  dubai: [
    { name: 'Burj Khalifa', type: 'Landmark', icon: '🏙️', bg: '#E8F5FD', rating: 4.8 },
    { name: 'Dubai Mall', type: 'Shopping', icon: '🛍️', bg: '#FDE8F5', rating: 4.5 },
    { name: 'Palm Jumeirah', type: 'Landmark', icon: '🌴', bg: '#E8FDE8', rating: 4.6 },
    { name: 'Dubai Museum', type: 'Museum', icon: '🏛️', bg: '#FDF5E8', rating: 4.4 },
    { name: 'Dubai Creek', type: 'Historic', icon: '⛵', bg: '#EEE8FD', rating: 4.5 },
  ],
  marrakech: [
    { name: 'Djemaa el-Fna', type: 'Square', icon: '🎭', bg: '#FDE8E8', rating: 4.7 },
    { name: 'Majorelle Garden', type: 'Garden', icon: '🪴', bg: '#E8FDF5', rating: 4.8 },
    { name: 'The Medina', type: 'Historic', icon: '🕌', bg: '#FDF5E8', rating: 4.6 },
    { name: 'Bahia Palace', type: 'Palace', icon: '👑', bg: '#EEE8FD', rating: 4.5 },
    { name: 'The Souks', type: 'Market', icon: '🧿', bg: '#FDE8F5', rating: 4.6 },
  ],
  sydney: [
    { name: 'Opera House', type: 'Landmark', icon: '🎭', bg: '#E8F5FD', rating: 4.9 },
    { name: 'Bondi Beach', type: 'Beach', icon: '🏄', bg: '#FDE8E8', rating: 4.7 },
    { name: 'Harbour Bridge', type: 'Landmark', icon: '🌉', bg: '#E8FDE8', rating: 4.8 },
    { name: 'Royal Botanic Garden', type: 'Garden', icon: '🌿', bg: '#E8FDF0', rating: 4.6 },
    { name: 'Darling Harbour', type: 'Waterfront', icon: '⛵', bg: '#EEE8FD', rating: 4.5 },
  ],
};

type RegionTemplate = { n: (c: City) => string; t: string; i: string; bg: string }[];
const REGION_TMPL: Record<string, RegionTemplate> = {
  europe: [
    { n: c => `${c.name} Old Town`, t: 'Historic', i: '🏰', bg: '#FDF5E8' },
    { n: _ => 'National Cathedral', t: 'Religious Site', i: '⛪', bg: '#E8F0FD' },
    { n: _ => 'National Museum', t: 'Museum', i: '🏛️', bg: '#EEE8FD' },
    { n: c => `${c.name} Market`, t: 'Market', i: '🥐', bg: '#FDE8F5' },
    { n: c => `${c.name} City Park`, t: 'Park', i: '🌳', bg: '#E8FDE8' },
  ],
  asia: [
    { n: c => `${c.name} Temple`, t: 'Temple', i: '⛩️', bg: '#FDE8E8' },
    { n: _ => 'Night Market', t: 'Market', i: '🏮', bg: '#FDF5E8' },
    { n: _ => 'Botanical Garden', t: 'Garden', i: '🌸', bg: '#FDE8F5' },
    { n: _ => 'Heritage Museum', t: 'Museum', i: '🏛️', bg: '#E8F0FD' },
    { n: c => `${c.name} Waterfront`, t: 'Scenic', i: '🌊', bg: '#E8F5FD' },
  ],
  americas: [
    { n: c => `${c.name} Historic Center`, t: 'Historic', i: '🏛️', bg: '#E8F0FD' },
    { n: _ => 'Art Museum', t: 'Museum', i: '🖼️', bg: '#EEE8FD' },
    { n: c => `${c.name} Park`, t: 'Park', i: '🌳', bg: '#E8FDE8' },
    { n: c => `${c.name} Market`, t: 'Market', i: '🌮', bg: '#FDE8F5' },
    { n: _ => 'Waterfront Promenade', t: 'Scenic', i: '🌅', bg: '#FDF5E8' },
  ],
  africa: [
    { n: _ => 'Old Medina', t: 'Historic', i: '🕌', bg: '#FDF5E8' },
    { n: _ => 'National Museum', t: 'Museum', i: '🏛️', bg: '#E8F0FD' },
    { n: c => `${c.name} Market`, t: 'Market', i: '🧺', bg: '#FDE8E8' },
    { n: _ => 'Botanical Garden', t: 'Garden', i: '🌴', bg: '#E8FDE8' },
    { n: _ => 'Cultural Center', t: 'Culture', i: '🎭', bg: '#EEE8FD' },
  ],
  oceania: [
    { n: c => `${c.name} Harbour`, t: 'Waterfront', i: '⛵', bg: '#E8F5FD' },
    { n: _ => 'Botanic Garden', t: 'Garden', i: '🌿', bg: '#E8FDE8' },
    { n: _ => 'Art Gallery', t: 'Museum', i: '🖼️', bg: '#EEE8FD' },
    { n: c => `${c.name} Beach`, t: 'Beach', i: '🏄', bg: '#FDE8F5' },
    { n: _ => 'National Museum', t: 'Museum', i: '🏛️', bg: '#FDF5E8' },
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
  }));
}

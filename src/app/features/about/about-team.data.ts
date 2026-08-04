export type AboutAccent = 'lav' | 'peach' | 'mint';

export interface AboutTeamMember {
  id: string;
  role: string;
  name: string;
  bio: string;
  emoji: string;
  accent: AboutAccent;
  /**
   * Path to the member's photo under `public/team/`, served at the same
   * path (e.g. '/team/yoli.jpeg'). Left `undefined` for a member with no
   * photo yet — the template then falls back to an initials placeholder
   * (see `getInitials()` in `about-initials.util.ts`).
   */
  photo?: string;
}

export const ABOUT_TEAM: AboutTeamMember[] = [
  {
    id: 'yoli',
    role: $localize`:@@about.team.yoli.role:CEO`,
    name: 'Yoli',
    bio: $localize`:@@about.team.yoli.bio:Jefa y dueña del proyecto. Como buen C-level de la empresa, nadie sabe lo que dice pero todos corren si ella necesita algo.`,
    emoji: '✈️',
    accent: 'lav',
    photo: '/team/yoli.jpeg',
  },
  {
    id: 'mati',
    role: $localize`:@@about.team.mati.role:Ingeniería`,
    name: 'Mati Fuentes',
    bio: $localize`:@@about.team.mati.bio:Jefe de ingeniería y mono programador. Encargado de mantener el sistema andando y correr cuando Yoli necesita cambio de pañales.`,
    emoji: '🗺️',
    accent: 'peach',
    photo: '/team/mati.jpeg',
  },
  {
    id: 'ceci',
    role: $localize`:@@about.team.ceci.role:Directora de Diseño`,
    name: 'Ceci Calderón',
    bio: $localize`:@@about.team.ceci.bio:Experta en el proceso y diseñadora en jefe. Sabe mejor que nadie como se debe comportar el usuario y que es lo que necesita. Ademas que es la unica que tiene el permiso de alimentar a Yoli.`,
    emoji: '🎨',
    accent: 'mint',
    photo: '/team/ceci.jpeg',
  },
  {
    id: 'miel',
    role: $localize`:@@about.team.miel.role:Experta en IA`,
    name: 'María Miel de las Mercedes del Perpetuo Socorro Echaurren Echevarria',
    bio: $localize`:@@about.team.miel.bio:Experta en IA y consejos de viajes. Sabe como huelen las mejores atracciones y donde encontrarlas. Se dice que no duerme.`,
    emoji: '🌍',
    accent: 'lav',
    photo: '/team/miel.jpeg',
  },
];

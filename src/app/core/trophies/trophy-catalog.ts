import { TrophyTier, TrophyType } from '../models/trophy.model';

/** Must match the backend's src/lib/trophies.ts TROPHY_THRESHOLDS. */
export const TROPHY_THRESHOLDS: Record<TrophyType, Partial<Record<TrophyTier, number>>> = {
  ai_plans:     { bronze: 1, silver: 10, gold: 50 },
  comments:     { bronze: 1, silver: 20, gold: 70 },
  favorites:    { bronze: 1, silver: 10, gold: 50 },
  clones:       { bronze: 1, silver: 5,  gold: 10 },
  excel_export: { single: 1 },
  publish_plan: { single: 1 },
  share_plan:   { single: 1 },
  plan_visited: { single: 1 },
};

export const TIERED_TYPES: TrophyType[] = ['ai_plans', 'comments', 'favorites', 'clones'];
export const SINGLE_TYPES: TrophyType[] = ['excel_export', 'publish_plan', 'share_plan', 'plan_visited'];

export const trophyKey = (type: TrophyType, tier: TrophyTier): string => `${type}:${tier}`;

export function trophyImage(type: TrophyType, tier: TrophyTier): string {
  const slug = type.replace(/_/g, '-');
  return tier === 'single' ? `/trophies/trophy-${slug}.png` : `/trophies/trophy-${slug}-${tier}.png`;
}

export function nextGoal(type: TrophyType, count: number): { tier: TrophyTier; needed: number } | null {
  const hit = (Object.entries(TROPHY_THRESHOLDS[type]) as [TrophyTier, number][]).find(([, n]) => count < n);
  return hit ? { tier: hit[0], needed: hit[1] } : null;
}

// Functions, not const maps — $localize must run lazily (same convention as getCategoryMeta()).
export function trophyName(type: TrophyType): string {
  switch (type) {
    case 'ai_plans':     return $localize`:@@trophy.name.aiPlans:Mejor planeador con IA`;
    case 'comments':     return $localize`:@@trophy.name.comments:Maestro de los tips viajeros`;
    case 'favorites':    return $localize`:@@trophy.name.favorites:Maravilloso plan!`;
    case 'clones':       return $localize`:@@trophy.name.clones:Plan inspirador`;
    case 'excel_export': return $localize`:@@trophy.name.excelExport:Itinerario en papel`;
    case 'publish_plan': return $localize`:@@trophy.name.publishPlan:Plan a la deriva`;
    case 'share_plan':   return $localize`:@@trophy.name.sharePlan:Corre la voz`;
    case 'plan_visited': return $localize`:@@trophy.name.planVisited:Primera visita`;
  }
}

export function tierLabel(tier: TrophyTier): string {
  switch (tier) {
    case 'bronze': return $localize`:@@trophy.tier.bronze:Bronce`;
    case 'silver': return $localize`:@@trophy.tier.silver:Plata`;
    case 'gold':   return $localize`:@@trophy.tier.gold:Oro`;
    case 'single': return '';
  }
}

export function trophyDescription(type: TrophyType, tier: TrophyTier): string {
  const n = TROPHY_THRESHOLDS[type][tier] ?? 1;
  switch (type) {
    case 'ai_plans':     return $localize`:@@trophy.desc.aiPlans:Generaste ${n}:count: planes con IA`;
    case 'comments':     return $localize`:@@trophy.desc.comments:Comentaste ${n}:count: veces en planes de otros viajeros`;
    case 'favorites':    return $localize`:@@trophy.desc.favorites:Uno de tus planes recibió ${n}:count: favoritos`;
    case 'clones':       return $localize`:@@trophy.desc.clones:Otros viajeros clonaron tus planes ${n}:count: veces`;
    case 'excel_export': return $localize`:@@trophy.desc.excelExport:Exportaste tu primer itinerario a Excel`;
    case 'publish_plan': return $localize`:@@trophy.desc.publishPlan:Publicaste tu primer plan`;
    case 'share_plan':   return $localize`:@@trophy.desc.sharePlan:Compartiste un plan con alguien`;
    case 'plan_visited': return $localize`:@@trophy.desc.planVisited:Un viajero con cuenta visitó un plan que publicaste`;
  }
}

/** Mirrors the backend's src/types.ts trophy types (Feature 69). */
export type TrophyType =
  | 'ai_plans' | 'comments' | 'favorites' | 'clones'
  | 'excel_export' | 'publish_plan' | 'share_plan' | 'plan_visited';
export type TrophyTier = 'bronze' | 'silver' | 'gold' | 'single';

export interface EarnedTrophy { type: TrophyType; tier: TrophyTier; earnedAt: string; }

export interface TrophiesResponse {
  earned:   EarnedTrophy[];
  progress: Partial<Record<TrophyType, number>>;
}

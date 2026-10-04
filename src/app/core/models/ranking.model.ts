/** Feature 70 — mirrors the manager's src/types.ts ranking types. */
export interface RankedUser { name: string; value: number }
export interface RankedCity { cityId: string; value: number }
export interface RankedPlan { title: string; shareId: string; ownerName: string; value: number }
export interface WeeklyRankings {
  weekStart: string;
  generatedAt: string;
  topPlanners: RankedUser[];
  topDestinations: RankedCity[];
  topTrophies: RankedUser[];
  topFavorited: RankedPlan[];
}
export interface MyRank { rank: number; value: number }
export interface MyRankings { weekStart: string; planners: MyRank | null; trophies: MyRank | null; favorited: MyRank | null }

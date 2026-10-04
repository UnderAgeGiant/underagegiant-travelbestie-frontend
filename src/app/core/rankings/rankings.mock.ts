import { MyRankings, WeeklyRankings } from '../models/ranking.model';
import { santiagoWeekStart } from './week-start.util';

export function mockWeeklyRankings(): WeeklyRankings {
  return {
    weekStart: santiagoWeekStart(),
    generatedAt: new Date().toISOString(),
    topPlanners: [{ name: 'Ana', value: 7 }, { name: 'Luis', value: 4 }, { name: 'Sofía', value: 2 }],
    topDestinations: [{ cityId: 'paris', value: 34 }, { cityId: 'rome', value: 21 }, { cityId: 'barcelona', value: 9 }],
    topTrophies: [{ name: 'Luis', value: 3 }, { name: 'Ana', value: 2 }],
    topFavorited: [{ title: 'Europa 15 días', shareId: 'mock-share-1', ownerName: 'Ana', value: 12 }],
  };
}

export function mockMyRankings(): MyRankings {
  return { weekStart: santiagoWeekStart(), planners: { rank: 4, value: 1 }, trophies: null, favorited: null };
}

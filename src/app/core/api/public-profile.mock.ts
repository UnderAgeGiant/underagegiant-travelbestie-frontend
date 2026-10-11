import { PublicProfile } from '../models/public-profile.model';
import { mockFeedPage } from './feed.mock';

export function mockPublicProfile(username: string): PublicProfile {
  const trips = mockFeedPage(null, 3).items.map(p => ({ ...p, ownerName: 'Ana Viajera', ownerUsername: username }));
  return {
    username, name: 'Ana Viajera', followerCount: 12, followingCount: 4, isFollowedByMe: false,
    trophies: [{ type: 'followers', tier: 'bronze', earnedAt: '2026-10-01T12:00:00.000Z' }],
    visitedCityIds: [...new Set(trips.flatMap(t => t.stops.map(s => s.cityId)))], trips,
  };
}

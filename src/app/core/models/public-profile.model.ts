import { EarnedTrophy } from './trophy.model';
import { FeedPlan } from './feed-plan.model';

/** GET /u/:username — mirrors the manager's PublicProfile. */
export interface PublicProfile {
  username:        string;
  name:            string;
  followerCount:   number;
  followingCount:  number;
  isFollowedByMe?: boolean;
  trophies:        EarnedTrophy[];
  visitedCityIds:  string[];
  trips:           FeedPlan[];
}

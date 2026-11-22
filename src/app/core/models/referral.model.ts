export type ReferralChannel = 'link' | 'shared_plan' | 'card';

/** `GET /referrals/me` (contract §19.1). */
export interface ReferralSummary {
  code: string;
  invitedCount: number;
  monthTokens: number;
  rewardTokens: number;
  monthCap: number;
  /** First day of next month, Santiago, `YYYY-MM-DD`. */
  capResetsOn: string;
}

/** `GET /referrals/:code` (contract §19.2). */
export interface Inviter { username: string | null; firstName: string }

export interface PendingReferral { code: string; channel: ReferralChannel; at: number }

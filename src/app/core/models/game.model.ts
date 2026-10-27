/** Feature 73 — mirrors the manager's FinishRunBody / FinishRunResponse. */
export interface FinishRunBody { score: number; durationMs: number; obstacles: number }
export interface FinishRunResponse { score: number; weeklyBest: number; newRecord: boolean; weekStart: string }

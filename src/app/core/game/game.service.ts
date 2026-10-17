import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../api/api.service';
import { RankingService } from '../rankings/ranking.service';
import { FinishRunBody, FinishRunResponse } from '../models/game.model';

/** Logged-in runs only. Never throws: any failure just means "this run won't be saved". */
@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly api = inject(ApiService);
  private readonly rankings = inject(RankingService);

  async startRun(): Promise<string | null> {
    try { return (await firstValueFrom(this.api.startGameRun())).runId; }
    catch { return null; }
  }

  async finishRun(runId: string, body: FinishRunBody): Promise<FinishRunResponse | null> {
    try {
      const res = await firstValueFrom(this.api.finishGameRun(runId, body));
      if (res.newRecord) this.rankings.reset(); // the landing chart refetches on its next mount
      return res;
    } catch { return null; }
  }
}

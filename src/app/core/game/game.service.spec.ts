import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GameService } from './game.service';
import { ApiService } from '../api/api.service';
import { RankingService } from '../rankings/ranking.service';

describe('GameService', () => {
  let api: { startGameRun: jest.Mock; finishGameRun: jest.Mock };
  let rankings: { reset: jest.Mock };
  let svc: GameService;

  beforeEach(() => {
    api = { startGameRun: jest.fn(), finishGameRun: jest.fn() };
    rankings = { reset: jest.fn() };
    TestBed.configureTestingModule({ providers: [
      { provide: ApiService, useValue: api }, { provide: RankingService, useValue: rankings },
    ] });
    svc = TestBed.inject(GameService);
  });

  it('startRun resolves the runId, or null on any error', async () => {
    api.startGameRun.mockReturnValueOnce(of({ runId: 'r1' }));
    expect(await svc.startRun()).toBe('r1');
    api.startGameRun.mockReturnValueOnce(throwError(() => ({ status: 503 })));
    expect(await svc.startRun()).toBeNull();
  });

  it('finishRun resets the rankings cache only on a new record', async () => {
    const body = { score: 100, durationMs: 10_000, obstacles: 0 };
    api.finishGameRun.mockReturnValueOnce(of({ score: 100, weeklyBest: 100, newRecord: true, weekStart: '2026-10-12' }));
    expect((await svc.finishRun('r1', body))?.newRecord).toBe(true);
    expect(rankings.reset).toHaveBeenCalledTimes(1);
    api.finishGameRun.mockReturnValueOnce(of({ score: 50, weeklyBest: 100, newRecord: false, weekStart: '2026-10-12' }));
    await svc.finishRun('r2', body);
    expect(rankings.reset).toHaveBeenCalledTimes(1);
  });

  it('finishRun resolves null on 404/422/503', async () => {
    api.finishGameRun.mockReturnValueOnce(throwError(() => ({ status: 422 })));
    expect(await svc.finishRun('r1', { score: 1, durationMs: 1, obstacles: 0 })).toBeNull();
  });
});

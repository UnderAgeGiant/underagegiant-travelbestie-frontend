import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { of, firstValueFrom, isObservable } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  let isLoggedIn: boolean;
  let sessionMayExist: boolean;
  const refreshMock = jest.fn();
  const createUrlTreeMock = jest.fn();
  const redirectTree = { redirect: true } as unknown as UrlTree;

  beforeEach(() => {
    isLoggedIn = false;
    sessionMayExist = false;
    refreshMock.mockReset();
    createUrlTreeMock.mockReset().mockReturnValue(redirectTree);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: () => isLoggedIn,
            sessionMayExist: () => sessionMayExist,
            refreshAccessToken: refreshMock,
          },
        },
        { provide: Router, useValue: { createUrlTree: createUrlTreeMock } },
      ],
    });
  });

  function runGuard() {
    return TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
  }

  async function resolve(result: ReturnType<typeof authGuard>): Promise<boolean | UrlTree> {
    if (isObservable(result)) return firstValueFrom(result);
    return result as boolean | UrlTree;
  }

  it('allows immediately without calling refresh when isLoggedIn() is true', async () => {
    isLoggedIn = true;
    const result = await resolve(runGuard());
    expect(result).toBe(true);
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('allows once refresh succeeds when isLoggedIn() is false but sessionMayExist() is true', async () => {
    isLoggedIn = false;
    sessionMayExist = true;
    refreshMock.mockReturnValue(of(true));
    const result = await resolve(runGuard());
    expect(result).toBe(true);
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it('redirects to / when refresh fails after sessionMayExist() is true', async () => {
    isLoggedIn = false;
    sessionMayExist = true;
    refreshMock.mockReturnValue(of(false));
    const result = await resolve(runGuard());
    expect(result).toBe(redirectTree);
    expect(createUrlTreeMock).toHaveBeenCalledWith(['/']);
  });

  it('redirects to / without calling refresh when neither isLoggedIn() nor sessionMayExist() is true', async () => {
    isLoggedIn = false;
    sessionMayExist = false;
    const result = await resolve(runGuard());
    expect(result).toBe(redirectTree);
    expect(refreshMock).not.toHaveBeenCalled();
    expect(createUrlTreeMock).toHaveBeenCalledWith(['/']);
  });
});

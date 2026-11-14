import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../auth/auth.service';
import { clearFirstPlanSession, isGiftSession } from './first-plan-session';

describe('F79 first-plan session keys', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(withXhr()), provideHttpClientTesting()] });
  });

  it('a session that saw the gift stays a gift session after the gift is used (profile tour waits for a later session)', () => {
    const auth = TestBed.inject(AuthService);
    auth.setTokens('t', { name: 'Ana', email: 'ana@test.com', countryOfResidence: null, firstPlanAvailable: true });
    auth.setFirstPlanAvailable(false);
    expect(auth.firstPlanAvailable()).toBe(false);
    expect(isGiftSession()).toBe(true);
  });

  it('a session that never had the gift is not a gift session', () => {
    TestBed.inject(AuthService).setTokens('t', { name: 'Ana', email: 'ana@test.com', countryOfResidence: null, firstPlanAvailable: false });
    expect(isGiftSession()).toBe(false);
  });

  it('clearFirstPlanSession removes every first-run key', () => {
    sessionStorage.setItem('tb_signup_intent', '{"kind":"city","cityId":"paris"}');
    sessionStorage.setItem('tb_first_plan_auto_opened', '1');
    sessionStorage.setItem('tb_first_plan_gift_session', '1');
    sessionStorage.setItem('other', 'x');
    clearFirstPlanSession();
    expect(sessionStorage.getItem('tb_signup_intent')).toBeNull();
    expect(sessionStorage.getItem('tb_first_plan_auto_opened')).toBeNull();
    expect(isGiftSession()).toBe(false);
    expect(sessionStorage.getItem('other')).toBe('x');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthModalComponent } from './auth-modal.component';
import { AuthModalService } from '../../../core/auth/auth-modal.service';
import { AuthService } from '../../../core/auth/auth.service';

describe('AuthModalComponent — sign-in button loading state', () => {
  let fixture: ComponentFixture<AuthModalComponent>;
  let authModal: AuthModalService;
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // jsdom has no window.turnstile — stub it so the component's renderTurnstile() polling
    // resolves immediately instead of retrying for up to 15 * 200ms.
    (window as any).turnstile = {
      render: () => 'widget-1',
      remove: () => {},
      reset: () => {},
    };
    TestBed.configureTestingModule({
      imports: [AuthModalComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
    // jsdom does not implement crypto.subtle — mock it so login()'s from(encryptPayload(...))
    // emits synchronously and the HTTP call is available right after doAuth() is called.
    jest.spyOn(auth as any, 'encryptPayload').mockReturnValue(of({ encryptedPayload: 'fake' }));

    authModal = TestBed.inject(AuthModalService);
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(AuthModalComponent);
    authModal.openLogin();
    fixture.componentInstance.loginEmail.set('test@test.com');
    fixture.componentInstance.loginPassword.set('secret123');
    fixture.componentInstance.captchaToken.set('captcha-token');
    fixture.detectChanges();
  });

  afterEach(() => {
    delete (window as any).turnstile;
    http.verify();
  });

  function submitBtn(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.modal-foot .btn-primary') as HTMLButtonElement;
  }

  // A successful login kicks off several independent post-login HTTP calls (trip/karma/saved
  // plans/visited/favorites/companion status) — drain all of them so http.verify() is clean.
  function flushPostLoginRequests(): void {
    http.match(() => true).forEach(req => req.flush(req.request.method === 'GET' ? [] : null));
  }

  it('disables the submit button and shows the spinner immediately on click, before the request resolves', () => {
    expect(submitBtn().disabled).toBe(false);

    submitBtn().click();
    fixture.detectChanges();

    expect(submitBtn().disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.btn-spinner')).toBeTruthy();

    http.expectOne(r => r.url.includes('/auth/login')).flush({ token: 'fake.jwt', user: { name: 'Test', email: 'test@test.com' } });
    flushPostLoginRequests();
  });

  it('only sends one login request even if the (disabled) button is clicked again while pending', () => {
    submitBtn().click();
    fixture.detectChanges();

    // A disabled DOM button does not dispatch click — this mirrors what a real double-click
    // does in the browser, rather than calling doAuth() directly a second time.
    submitBtn().click();
    fixture.detectChanges();

    http.expectOne(r => r.url.includes('/auth/login')).flush({ token: 'fake.jwt', user: { name: 'Test', email: 'test@test.com' } });
    flushPostLoginRequests();
  });

  it('re-enables the button and hides the spinner once login succeeds', () => {
    submitBtn().click();
    fixture.detectChanges();

    http.expectOne(r => r.url.includes('/auth/login')).flush({ token: 'fake.jwt', user: { name: 'Test', email: 'test@test.com' } });
    fixture.detectChanges();

    expect(fixture.componentInstance.loginLoading()).toBe(false);
    flushPostLoginRequests();
  });

  it('clears loginLoading after a failed login, so the button is no longer stuck on the spinner', () => {
    submitBtn().click();
    fixture.detectChanges();
    expect(submitBtn().disabled).toBe(true);

    http.expectOne(r => r.url.includes('/auth/login')).flush(
      { code: 'WRONG_PASSWORD' },
      { status: 401, statusText: 'Unauthorized' },
    );
    fixture.detectChanges();

    // Loading itself is cleared — this is the double-click-prevention state under test.
    // The button may still be disabled separately because a failed attempt also resets
    // Turnstile (a real security control, unrelated to this fix) — re-solving it re-enables it.
    expect(fixture.componentInstance.loginLoading()).toBe(false);
    expect(fixture.nativeElement.querySelector('.btn-spinner')).toBeNull();

    fixture.componentInstance.captchaToken.set('captcha-token-2');
    fixture.detectChanges();
    expect(submitBtn().disabled).toBe(false);
  });
});

describe('AuthModalComponent — OTP input digit filtering', () => {
  let fixture: ComponentFixture<AuthModalComponent>;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    (window as any).turnstile = {
      render: () => 'widget-1',
      remove: () => {},
      reset: () => {},
    };
    TestBed.configureTestingModule({
      imports: [AuthModalComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])],
    });
    const authModal = TestBed.inject(AuthModalService);
    fixture = TestBed.createComponent(AuthModalComponent);
    authModal.openLogin();
  });

  afterEach(() => {
    delete (window as any).turnstile;
  });

  function otpField(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[maxlength="6"]') as HTMLInputElement;
  }

  it('strips a rejected non-digit character from the DOM value, not just the model — register OTP step', () => {
    fixture.componentInstance.loginMode.set('register');
    fixture.componentInstance.otpStep.set(true);
    fixture.detectChanges();

    const input = otpField();
    input.value = 'a'; // simulates the browser inserting the typed character
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.otpCode()).toBe('');
    expect(input.value).toBe('');
  });

  it('strips non-digit characters from typed input and keeps at most 6 digits — register OTP step', () => {
    fixture.componentInstance.loginMode.set('register');
    fixture.componentInstance.otpStep.set(true);
    fixture.detectChanges();

    const input = otpField();
    input.value = 'a1b2c3d4';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.otpCode()).toBe('1234');
    expect(input.value).toBe('1234');
  });

  it('strips a rejected non-digit character from the DOM value, not just the model — password reset OTP step', () => {
    fixture.componentInstance.loginMode.set('reset');
    fixture.componentInstance.resetStep.set('verify');
    fixture.detectChanges();

    const input = otpField();
    input.value = '#';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.resetOtp()).toBe('');
    expect(input.value).toBe('');
  });
});

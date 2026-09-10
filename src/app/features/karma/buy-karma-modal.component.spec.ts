import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BuyKarmaModalComponent } from './buy-karma-modal.component';

describe('BuyKarmaModalComponent — MercadoPago', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BuyKarmaModalComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const PACKAGES = [{ id: 'karma_10', karma: 10, price: '0.99', currency: 'USD', label: '10 Karma', prices: { USD: '0.99', CLP: '900' } }];

  it('defaults to the PayPal provider tab', () => {
    const fixture = TestBed.createComponent(BuyKarmaModalComponent);
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/karma/packages')).flush({ packages: PACKAGES });
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedProvider()).toBe('paypal');
  });

  it('polls GET /karma/purchase/mp/status/:id until completed, then shows the success state', () => {
    jest.useFakeTimers();
    const fixture = TestBed.createComponent(BuyKarmaModalComponent);
    fixture.componentRef.setInput('confirmingPurchaseRef', 'mp_abc');
    fixture.componentRef.setInput('confirmingStatus', 'success');
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/karma/packages')).flush({ packages: PACKAGES });
    fixture.detectChanges();

    expect(fixture.componentInstance.step()).toBe('mp-confirm');

    let statusReq = http.expectOne(r => r.url.includes('/karma/purchase/mp/status/mp_abc'));
    statusReq.flush({ status: 'pending' });
    fixture.detectChanges();
    expect(fixture.componentInstance.step()).toBe('mp-confirm');

    jest.advanceTimersByTime(2000);
    statusReq = http.expectOne(r => r.url.includes('/karma/purchase/mp/status/mp_abc'));
    statusReq.flush({ status: 'completed', karmaAdded: 10 });
    fixture.detectChanges();

    expect(fixture.componentInstance.step()).toBe('success');
    expect(fixture.componentInstance.karmaAdded()).toBe(10);
    jest.useRealTimers();
  });

  it('shows the error state immediately when confirmingStatus is "failure", without polling', () => {
    const fixture = TestBed.createComponent(BuyKarmaModalComponent);
    fixture.componentRef.setInput('confirmingPurchaseRef', 'mp_xyz');
    fixture.componentRef.setInput('confirmingStatus', 'failure');
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/karma/packages')).flush({ packages: PACKAGES });
    fixture.detectChanges();

    expect(fixture.componentInstance.step()).toBe('error');
    http.expectNone(r => r.url.includes('/karma/purchase/mp/status/'));
  });

  it('shows the failed error state when polling reports status=failed', () => {
    jest.useFakeTimers();
    const fixture = TestBed.createComponent(BuyKarmaModalComponent);
    fixture.componentRef.setInput('confirmingPurchaseRef', 'mp_fail');
    fixture.componentRef.setInput('confirmingStatus', 'pending');
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/karma/packages')).flush({ packages: PACKAGES });
    fixture.detectChanges();

    const statusReq = http.expectOne(r => r.url.includes('/karma/purchase/mp/status/mp_fail'));
    statusReq.flush({ status: 'failed' });
    fixture.detectChanges();

    expect(fixture.componentInstance.step()).toBe('error');
    jest.useRealTimers();
  });

  it('payWithMercadoPago calls createMpPreference with the selected package', () => {
    // Deliberately does not assert on window.location.href — mutating jsdom's window.location
    // is version-fragile across jsdom releases. The redirect itself (window.location.href =
    // res.initPoint) is a one-line assignment covered by the Task 10 manual smoke check instead.
    const fixture = TestBed.createComponent(BuyKarmaModalComponent);
    fixture.detectChanges();
    http.expectOne(r => r.url.includes('/karma/packages')).flush({ packages: PACKAGES });
    fixture.detectChanges();

    fixture.componentInstance.selectPackage(PACKAGES[0]);
    fixture.componentInstance.selectProvider('mercadopago');
    fixture.detectChanges();

    fixture.componentInstance.payWithMercadoPago();
    const req = http.expectOne(r => r.url.includes('/karma/purchase/mp/create-preference'));
    expect(req.request.body).toEqual({ packageId: 'karma_10' });
    req.flush({ preferenceId: 'pref-1', initPoint: 'https://mp.example.com/checkout/pref-1' });
  });
});

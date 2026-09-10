import { KarmaModalService } from './karma-modal.service';

describe('KarmaModalService — MercadoPago confirmation state', () => {
  it('openMpConfirmation opens the buy modal and stores purchaseRef/status', () => {
    const svc = new KarmaModalService();
    svc.openMpConfirmation('mp_abc', 'success');
    expect(svc.buyOpen()).toBe(true);
    expect(svc.mpConfirm()).toEqual({ purchaseRef: 'mp_abc', status: 'success' });
  });

  it('closeBuy clears both buyOpen and any pending mpConfirm', () => {
    const svc = new KarmaModalService();
    svc.openMpConfirmation('mp_abc', 'pending');
    svc.closeBuy();
    expect(svc.buyOpen()).toBe(false);
    expect(svc.mpConfirm()).toBeNull();
  });

  it('mpConfirm stays null for the plain nav-triggered open() path', () => {
    const svc = new KarmaModalService();
    svc.open();
    expect(svc.buyOpen()).toBe(true);
    expect(svc.mpConfirm()).toBeNull();
  });
});

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TripCardDialogComponent } from './trip-card-dialog.component';
import { TripCardService } from './trip-card.service';
import { ApiService } from '../../core/api/api.service';
import { TrophyService } from '../../core/trophies/trophy.service';
import { SharedTrip } from '../../core/shared-trips/shared-trips.service';
import { renderTripCard } from './trip-card-render';

jest.mock('./trip-card-render', () => ({
  ...jest.requireActual('./trip-card-render'),
  renderTripCard: jest.fn(),
}));

const trip: SharedTrip = {
  id: 's1', ownerEmail: 'a@b.com', ownerName: 'Ana', ownerUsername: 'ana', tripName: 'Europa en 21 días',
  createdAt: '2027-01-01', transits: [],
  stops: [{ stopId: '1', cityId: 'paris', checkIn: '01/06/2027', checkOut: '03/06/2027', selectedAttractions: [] }],
};
const LINK = 'https://tripilove.com/shared/s1?utm_source=card';

const flush = () => new Promise(r => setTimeout(r, 0));

describe('TripCardDialogComponent', () => {
  let api: { getSharedTrip: jest.Mock };
  let trophies: { reportShare: jest.Mock };
  let cards: TripCardService;
  let nav: Record<string, unknown>;

  function setNavigator(extra: Record<string, unknown>) {
    for (const [k, v] of Object.entries(extra)) {
      Object.defineProperty(navigator, k, { value: v, configurable: true, writable: true });
    }
  }

  async function openDialog(opts?: { celebrate?: boolean }) {
    const f = TestBed.createComponent(TripCardDialogComponent);
    f.detectChanges();
    cards.open('s1', opts);
    f.detectChanges();
    await flush(); await flush(); await flush();
    f.detectChanges();
    return f;
  }
  const q = (f: { nativeElement: HTMLElement }, sel: string) => f.nativeElement.querySelector(sel) as HTMLElement | null;
  const btn = (f: { nativeElement: HTMLElement }, label: RegExp) =>
    Array.from(f.nativeElement.querySelectorAll('button')).find(b => label.test(b.textContent ?? '')) as HTMLButtonElement | undefined;

  beforeEach(() => {
    (renderTripCard as jest.Mock).mockReset().mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    api = { getSharedTrip: jest.fn(() => of(trip)) };
    trophies = { reportShare: jest.fn() };
    nav = {
      canShare: jest.fn(() => true),
      share: jest.fn(() => Promise.resolve()),
      clipboard: { writeText: jest.fn(() => Promise.resolve()) },
    };
    setNavigator(nav);
    TestBed.configureTestingModule({
      imports: [TripCardDialogComponent],
      providers: [{ provide: ApiService, useValue: api }, { provide: TrophyService, useValue: trophies }],
    });
    cards = TestBed.inject(TripCardService);
  });

  it('renders nothing until a request', () => {
    const f = TestBed.createComponent(TripCardDialogComponent);
    f.detectChanges();
    expect(q(f, '[role="dialog"]')).toBeNull();
  });

  it('opens on request, loads the public trip and shows a preview', async () => {
    const f = await openDialog();
    expect(api.getSharedTrip).toHaveBeenCalledWith('s1');
    expect((renderTripCard as jest.Mock).mock.calls[0][0].link).toBe(LINK);
    expect(q(f, '[role="dialog"]')?.getAttribute('aria-modal')).toBe('true');
    expect(q(f, '.tcd-preview img')?.getAttribute('src')).toMatch(/^data:image\/png/);
  });

  it('shows Compartir only when navigator.canShare({ files }) is true', async () => {
    (nav['canShare'] as jest.Mock).mockReturnValue(false);
    const f = await openDialog();
    expect(btn(f, /Compartir/)).toBeUndefined();
    expect(btn(f, /Descargar/)).toBeDefined();
  });

  it('Compartir copies the link, then calls navigator.share with file + text containing the link', async () => {
    const f = await openDialog();
    btn(f, /Compartir/)!.click();
    await flush(); await flush();
    f.detectChanges();
    const clip = (nav['clipboard'] as { writeText: jest.Mock }).writeText;
    expect(clip).toHaveBeenCalledWith(LINK);
    const arg = (nav['share'] as jest.Mock).mock.calls[0][0];
    expect(arg.files[0]).toBeInstanceOf(File);
    expect(arg.files[0].name).toBe('tripilove-europa-en-21-dias.png');
    expect(arg.text).toContain(LINK);
    expect(clip.mock.invocationCallOrder[0]).toBeLessThan((nav['share'] as jest.Mock).mock.invocationCallOrder[0]);
    expect(q(f, '.tcd-hint')?.textContent).toContain('Link copiado');
    expect(trophies.reportShare).toHaveBeenCalledWith('s1');
  });

  it('clipboard rejected → shows the "Copiar link" button, not "Link copiado"', async () => {
    (nav['clipboard'] as { writeText: jest.Mock }).writeText.mockImplementation(async () => { throw new Error('denied'); }); // native promise, like the real API
    const f = await openDialog();
    btn(f, /Compartir/)!.click();
    await flush(); await flush();
    f.detectChanges();
    expect(btn(f, /Copiar link/)).toBeDefined();
    expect(f.nativeElement.textContent).not.toContain('Link copiado');
  });

  it('share cancelled (AbortError) → dialog stays open, no error shown', async () => {
    (nav['share'] as jest.Mock).mockRejectedValue(new DOMException('cancel', 'AbortError'));
    const f = await openDialog();
    btn(f, /Compartir/)!.click();
    await flush(); await flush();
    f.detectChanges();
    expect(q(f, '[role="dialog"]')).not.toBeNull();
    expect(q(f, '.tcd-error')).toBeNull();
    expect(trophies.reportShare).not.toHaveBeenCalled();
  });

  it('Descargar triggers a download named tripCardFileName(title)', async () => {
    const f = await openDialog();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('tripilove-europa-en-21-dias.png');
      expect(this.href).toMatch(/^data:image\/png/);
    });
    btn(f, /Descargar/)!.click();
    expect(click).toHaveBeenCalled();
    click.mockRestore();
  });

  it('buttons are disabled while working', async () => {
    let finish!: () => void;
    (nav['share'] as jest.Mock).mockReturnValue(new Promise<void>(r => (finish = r)));
    const f = await openDialog();
    btn(f, /Compartir/)!.click();
    await flush();
    f.detectChanges();
    expect(btn(f, /Compartir/)!.disabled).toBe(true);
    expect(btn(f, /Descargar/)!.disabled).toBe(true);
    finish();
    await flush(); await flush();
    f.detectChanges();
    expect(btn(f, /Compartir/)!.disabled).toBe(false);
  });

  it('buttons are disabled while the card is rendering', async () => {
    (renderTripCard as jest.Mock).mockReturnValue(new Promise(() => { /* never */ }));
    (nav['canShare'] as jest.Mock).mockReturnValue(false);
    const f = await openDialog();
    expect(btn(f, /Descargar/)!.disabled).toBe(true);
  });

  it('celebrate:true renders confetti + "Ahora no"; celebrate:false renders neither', async () => {
    const f = await openDialog({ celebrate: true });
    expect(q(f, '.tcd-streamers[aria-hidden="true"]')).not.toBeNull();
    expect(f.nativeElement.textContent).toContain('¡Tu viaje está publicado!');
    btn(f, /Ahora no/)!.click();
    f.detectChanges();
    expect(cards.request()).toBeNull();

    const g = await openDialog();
    expect(q(g, '.tcd-streamers')).toBeNull();
    expect(btn(g, /Ahora no/)).toBeUndefined();
  });

  it('getSharedTrip error → error message with a close button, no preview', async () => {
    api.getSharedTrip.mockReturnValue(throwError(() => ({ status: 404 })));
    const f = await openDialog();
    expect(q(f, '.tcd-error')).not.toBeNull();
    expect(q(f, '.tcd-preview img')).toBeNull();
    expect(btn(f, /Cerrar/)).toBeDefined();
  });

  it('Escape closes; close() clears the preview', async () => {
    const f = await openDialog();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    f.detectChanges();
    expect(cards.request()).toBeNull();
    expect(q(f, '[role="dialog"]')).toBeNull();
    expect(f.componentInstance.preview()).toBeNull();
  });
});

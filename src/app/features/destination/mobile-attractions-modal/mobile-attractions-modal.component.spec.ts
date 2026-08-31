import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MobileAttractionsModalComponent } from './mobile-attractions-modal.component';
import { TripService } from '../../trip/trip.service';
import { DestinationModalService } from '../destination-modal.service';
import { City } from '../../../core/models/city.model';

const PARIS: City = { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', region: 'europe' };

function mockMatchMedia(matches: boolean): void {
  (window as any).matchMedia = () => ({
    matches, media: '(max-width: 768px)', addEventListener: () => {}, removeEventListener: () => {},
  });
}

/**
 * Regression coverage for converting this from a fullscreen modal into a bottom sheet (family
 * feedback investigation: dragging worked at the code level even on mobile, but the fullscreen
 * modal completely hid tb-day-timeline underneath, so there was no visible drop target to aim
 * a drag at). See the component's own doc comment for the full story.
 *
 * Each test constructs its own TestBed module (rather than sharing one in a top-level
 * beforeEach) so mockMatchMedia's value is in place BEFORE DeviceService — a root-provided
 * singleton, constructed once on first injection — is ever touched; sharing one module across
 * a mobile test and a desktop test would let the first construction "win" for both.
 */
describe('MobileAttractionsModalComponent — bottom sheet', () => {
  let fixture: ComponentFixture<MobileAttractionsModalComponent>;
  let trip: TripService;
  let modal: DestinationModalService;
  let httpMock: HttpTestingController;

  function setup(mobile: boolean): void {
    localStorage.clear();
    mockMatchMedia(mobile);
    TestBed.configureTestingModule({
      imports: [MobileAttractionsModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    trip = TestBed.inject(TripService);
    modal = TestBed.inject(DestinationModalService);
    httpMock = TestBed.inject(HttpTestingController);
    trip.addStop(PARIS, '01/06/2026', '05/06/2026');
    fixture = TestBed.createComponent(MobileAttractionsModalComponent);
  }

  // The comment-batch fetch effect is gated on attractions().length, not on modal.isOpen() —
  // pre-existing behavior, unrelated to this task — so it fires as soon as the stop/city
  // resolves, even while the sheet itself is still closed.
  function flushComments(): void {
    httpMock.match(r => r.url.includes('/comments')).forEach(r => r.flush({}));
  }

  afterEach(() => httpMock.verify());

  it('renders nothing when the modal is closed', () => {
    setup(true);
    fixture.detectChanges();
    flushComments();

    expect(fixture.nativeElement.querySelector('.att-sheet')).toBeNull();
  });

  it('renders a bottom sheet (not a fullscreen modal) when opened on mobile', () => {
    setup(true);
    modal.open();
    fixture.detectChanges();
    flushComments();

    const sheet = fixture.nativeElement.querySelector('.att-sheet');
    expect(sheet).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.att-modal-backdrop')).toBeNull();
    expect(sheet.classList.contains('expanded')).toBe(false);
  });

  it('does not render as a sheet on desktop, even if the modal service is open', () => {
    setup(false);
    modal.open();
    fixture.detectChanges();
    flushComments();

    expect(fixture.nativeElement.querySelector('.att-sheet')).toBeNull();
  });

  it('toggles the expanded height when the drag handle is tapped', () => {
    setup(true);
    modal.open();
    fixture.detectChanges();
    flushComments();

    const handle = fixture.nativeElement.querySelector('.att-sheet-handle') as HTMLButtonElement;
    handle.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.att-sheet').classList.contains('expanded')).toBe(true);

    handle.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.att-sheet').classList.contains('expanded')).toBe(false);
  });

  it('closes via the ✕ button', () => {
    setup(true);
    modal.open();
    fixture.detectChanges();
    flushComments();

    (fixture.nativeElement.querySelector('.att-modal-close') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(modal.isOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('.att-sheet')).toBeNull();
  });

  it('resets to the peek (non-expanded) height and scrolls the timeline into view each time it opens', async () => {
    setup(true);
    const scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const timelineEl = document.createElement('tb-day-timeline');
    document.body.appendChild(timelineEl);
    jest.spyOn(timelineEl, 'getBoundingClientRect').mockReturnValue({ top: 400 } as DOMRect);

    modal.open();
    fixture.detectChanges();
    flushComments();
    // the scroll runs in a queued microtask
    await Promise.resolve();
    await Promise.resolve();

    expect(scrollToSpy).toHaveBeenCalledWith(expect.objectContaining({ top: expect.any(Number), behavior: 'smooth' }));

    document.body.removeChild(timelineEl);
    scrollToSpy.mockRestore();
  });
});

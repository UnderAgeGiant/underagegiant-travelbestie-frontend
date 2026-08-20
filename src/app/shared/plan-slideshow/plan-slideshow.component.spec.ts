import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanSlideshowComponent } from './plan-slideshow.component';
import { SlideshowItem } from '../../core/models/plan-slideshow.model';

const ITEMS: SlideshowItem[] = [
  { id: 'a', name: 'Eiffel Tower', type: 'Histórico', icon: '🏛️', imageUrl: 'https://img/a.jpg', description: 'An iron lattice tower on the Champ de Mars.', startDate: '10/08/2026', startTime: '09:00', endDate: '10/08/2026', endTime: '11:00' },
  { id: 'b', name: 'Paris → Rome', type: 'Vuelo', icon: '✈️', imageUrl: null, description: null, startDate: '11/08/2026', startTime: '14:00', endDate: '11/08/2026', endTime: '16:00' },
];

describe('PlanSlideshowComponent', () => {
  let fixture: ComponentFixture<PlanSlideshowComponent>;

  beforeEach(async () => {
    jest.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [PlanSlideshowComponent] }).compileComponents();
    fixture = TestBed.createComponent(PlanSlideshowComponent);
  });

  afterEach(() => jest.useRealTimers());

  it('renders the first item caption on init', () => {
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Eiffel Tower');
    expect(text).toContain('Histórico');
  });

  it('shows a fallback tile when the item has no imageUrl', () => {
    fixture.componentRef.setInput('items', [ITEMS[1]]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.ps-slide-fallback')).toBeTruthy();
    expect(el.querySelector('.ps-slide-img')).toBeNull();
  });

  it('shows the empty state when there are no items', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.ps-empty')).toBeTruthy();
  });

  it('auto-advances to the next item after 6s', () => {
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    jest.advanceTimersByTime(6000);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Paris → Rome');
  });

  it('does not auto-advance with a single item', () => {
    fixture.componentRef.setInput('items', [ITEMS[0]]);
    fixture.detectChanges();
    jest.advanceTimersByTime(20000);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Eiffel Tower');
  });

  it('emits closed when the close button is clicked', () => {
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    let closedFired = false;
    fixture.componentInstance.closed.subscribe(() => (closedFired = true));
    (fixture.nativeElement.querySelector('.ps-close') as HTMLButtonElement).click();
    expect(closedFired).toBe(true);
  });

  it('emits closed on Escape keydown', () => {
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    let closedFired = false;
    fixture.componentInstance.closed.subscribe(() => (closedFired = true));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closedFired).toBe(true);
  });

  it('goes to the next slide when the next arrow is clicked', () => {
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.ps-arrow-next') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Paris → Rome');
  });

  it('advances to the next slide on a left swipe', () => {
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const instance = fixture.componentInstance as any;
    instance.onTouchStart({ changedTouches: [{ clientX: 300 }] });
    instance.onTouchEnd({ changedTouches: [{ clientX: 220 }] }); // 80px left swipe
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Paris → Rome');
  });

  it('goes to the previous slide on a right swipe', () => {
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const instance = fixture.componentInstance as any;
    instance.goTo(1); // start on the second slide
    fixture.detectChanges();
    instance.onTouchStart({ changedTouches: [{ clientX: 200 }] });
    instance.onTouchEnd({ changedTouches: [{ clientX: 280 }] }); // 80px right swipe
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Eiffel Tower');
  });

  it('ignores swipes shorter than the threshold', () => {
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const instance = fixture.componentInstance as any;
    instance.onTouchStart({ changedTouches: [{ clientX: 300 }] });
    instance.onTouchEnd({ changedTouches: [{ clientX: 280 }] }); // 20px — below 50px threshold
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Eiffel Tower');
  });

  it('shows the description caption when the item has one', () => {
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
    const caption = fixture.nativeElement.querySelector('.ps-caption-desc');
    expect(caption?.textContent?.trim()).toBe('An iron lattice tower on the Champ de Mars.');
  });

  it('hides the description caption when the item has none', () => {
    fixture.componentRef.setInput('items', [ITEMS[1]]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.ps-caption-desc')).toBeNull();
  });
});

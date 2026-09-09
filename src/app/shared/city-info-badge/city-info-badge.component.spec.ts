import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { CityInfoBadgeComponent } from './city-info-badge.component';
import { City } from '../../core/models/city.model';

const PARIS: City = { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', region: 'europe' };

// The popover is reparented to <body> (see the component's own doc comment) so it
// always escapes a transformed ancestor card — query it from document.body, not
// fixture.nativeElement, which now only ever contains the trigger.
function popover(): HTMLElement | null {
  return document.body.querySelector('.city-info-popover');
}

describe('CityInfoBadgeComponent', () => {
  let fixture: ComponentFixture<CityInfoBadgeComponent>;

  function setup(homeIso2: string | null, isLoggedIn: boolean): void {
    TestBed.configureTestingModule({ imports: [CityInfoBadgeComponent] });
    fixture = TestBed.createComponent(CityInfoBadgeComponent);
    fixture.componentRef.setInput('city', PARIS);
    fixture.componentRef.setInput('homeIso2', homeIso2);
    fixture.componentRef.setInput('isLoggedIn', isLoggedIn);
    fixture.detectChanges();
  }

  it('renders the trigger but no popover before any hover', () => {
    setup('CL', true);
    expect(fixture.nativeElement.querySelector('.city-info-trigger')).toBeTruthy();
    expect(popover()).toBeNull();
  });

  it('shows visa/currency/plug rows in the popover on hover (CL -> FR is visa-free for 90 days)', fakeAsync(() => {
    setup('CL', true);
    const trigger = fixture.nativeElement.querySelector('.city-info-trigger') as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    fixture.detectChanges();

    const pop = popover();
    expect(pop).toBeTruthy();
    expect(pop!.textContent).toContain('90');
    expect(pop!.textContent).toContain('€');
    expect(pop!.textContent).toContain('Tipo');
  }));

  it('closes the popover on hover-leave after a small delay (allowing time to move to popover)', fakeAsync(() => {
    setup('CL', true);
    const trigger = fixture.nativeElement.querySelector('.city-info-trigger') as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    fixture.detectChanges();
    expect(popover()).toBeTruthy();

    trigger.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    // Popover still visible due to 50ms delay on trigger mouseleave
    expect(popover()).toBeTruthy();

    // After the delay, popover closes
    tick(50);
    fixture.detectChanges();
    expect(popover()).toBeNull();
  }));

  it('shows a CTA row and emits ctaClick when logged in with no countryOfResidence set', fakeAsync(() => {
    setup(null, true);
    const trigger = fixture.nativeElement.querySelector('.city-info-trigger') as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    fixture.detectChanges();

    const cta = popover()!.querySelector('.city-info-row.city-info-cta') as HTMLElement;
    expect(cta).toBeTruthy();

    let emitted = false;
    fixture.componentInstance.ctaClick.subscribe(() => { emitted = true; });
    cta.dispatchEvent(new MouseEvent('click'));
    expect(emitted).toBe(true);
  }));

  it('still shows the trigger to an anonymous visitor (currency/plug need no login) but no visa row', fakeAsync(() => {
    setup(null, false);
    expect(fixture.nativeElement.querySelector('.city-info-trigger')).toBeTruthy();

    const trigger = fixture.nativeElement.querySelector('.city-info-trigger') as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    fixture.detectChanges();

    expect(popover()!.querySelector('.city-info-row.city-info-cta')).toBeNull();
    expect(popover()!.textContent).toContain('€');
  }));

  it('keeps popover open when moving mouse from trigger to popover, allowing CTA click', fakeAsync(() => {
    setup(null, true);
    const trigger = fixture.nativeElement.querySelector('.city-info-trigger') as HTMLElement;

    // Open by hovering trigger
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    fixture.detectChanges();
    expect(popover()).toBeTruthy();

    // Leave trigger (starts 50ms close timer)
    trigger.dispatchEvent(new MouseEvent('mouseleave'));
    // Immediately enter popover BEFORE the close timer fires (only 30ms of the 50ms delay has passed)
    tick(30);
    const pop = popover() as HTMLElement;
    pop.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    // Popover should still be visible because we cancelled the close timer
    expect(popover()).toBeTruthy();

    // Click the CTA (visa "set country" button)
    let emitted = false;
    fixture.componentInstance.ctaClick.subscribe(() => { emitted = true; });
    const cta = popover()!.querySelector('.city-info-row.city-info-cta') as HTMLElement;
    cta.dispatchEvent(new MouseEvent('click'));
    expect(emitted).toBe(true);
  }));

  it('CTA is a keyboard-accessible button element', fakeAsync(() => {
    setup(null, true);
    const trigger = fixture.nativeElement.querySelector('.city-info-trigger') as HTMLElement;

    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    fixture.detectChanges();

    const cta = popover()!.querySelector('.city-info-row.city-info-cta') as HTMLElement;
    expect(cta.tagName.toLowerCase()).toBe('button');
    expect(cta.getAttribute('type')).toBe('button');
  }));

  it('reparents the popover to document.body so it always escapes a transformed ancestor card', fakeAsync(() => {
    setup('CL', true);
    const trigger = fixture.nativeElement.querySelector('.city-info-trigger') as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    fixture.detectChanges();

    const pop = popover();
    expect(pop).toBeTruthy();
    expect(pop!.parentElement).toBe(document.body);
    expect(fixture.nativeElement.contains(pop)).toBe(false);
  }));

  it('removes the popover from document.body when the component is destroyed', fakeAsync(() => {
    setup('CL', true);
    const trigger = fixture.nativeElement.querySelector('.city-info-trigger') as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    fixture.detectChanges();
    expect(popover()).toBeTruthy();

    fixture.destroy();
    expect(popover()).toBeNull();
  }));
});

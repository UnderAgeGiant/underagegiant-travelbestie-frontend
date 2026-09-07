import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { CityInfoBadgeComponent } from './city-info-badge.component';
import { City } from '../../core/models/city.model';

const PARIS: City = { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', region: 'europe' };

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
    expect(fixture.nativeElement.querySelector('.city-info-popover')).toBeNull();
  });

  it('shows visa/currency/plug rows in the popover on hover (CL -> FR is visa-free for 90 days)', fakeAsync(() => {
    setup('CL', true);
    const trigger = fixture.nativeElement.querySelector('.city-info-trigger') as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    fixture.detectChanges();

    const popover = fixture.nativeElement.querySelector('.city-info-popover');
    expect(popover).toBeTruthy();
    expect(popover.textContent).toContain('90');
    expect(popover.textContent).toContain('€');
    expect(popover.textContent).toContain('Tipo');
  }));

  it('closes the popover on hover-leave', fakeAsync(() => {
    setup('CL', true);
    const trigger = fixture.nativeElement.querySelector('.city-info-trigger') as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.city-info-popover')).toBeTruthy();

    trigger.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.city-info-popover')).toBeNull();
  }));

  it('shows a CTA row and emits ctaClick when logged in with no countryOfResidence set', fakeAsync(() => {
    setup(null, true);
    const trigger = fixture.nativeElement.querySelector('.city-info-trigger') as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    tick(150);
    fixture.detectChanges();

    const cta = fixture.nativeElement.querySelector('.city-info-row.city-info-cta') as HTMLElement;
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

    expect(fixture.nativeElement.querySelector('.city-info-row.city-info-cta')).toBeNull();
    expect(fixture.nativeElement.querySelector('.city-info-popover')!.textContent).toContain('€');
  }));
});

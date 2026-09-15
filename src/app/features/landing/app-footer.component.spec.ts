import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppFooterComponent } from './app-footer.component';

describe('AppFooterComponent — clickable tagline (feedback #2)', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [AppFooterComponent], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(AppFooterComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('emits createPlan when "Planifica" is clicked', () => {
    const fixture = setup();
    const spy = jest.fn();
    fixture.componentInstance.createPlan.subscribe(spy);
    (fixture.nativeElement.querySelector('.landing-footer-tagline-word[data-word="planifica"]') as HTMLElement).click();
    expect(spy).toHaveBeenCalled();
  });

  it('emits viewMyTrips when "Comparte" is clicked', () => {
    const fixture = setup();
    const spy = jest.fn();
    fixture.componentInstance.viewMyTrips.subscribe(spy);
    (fixture.nativeElement.querySelector('.landing-footer-tagline-word[data-word="comparte"]') as HTMLElement).click();
    expect(spy).toHaveBeenCalled();
  });

  it('emits exploreFeatured when "Explora" is clicked', () => {
    const fixture = setup();
    const spy = jest.fn();
    fixture.componentInstance.exploreFeatured.subscribe(spy);
    (fixture.nativeElement.querySelector('.landing-footer-tagline-word[data-word="explora"]') as HTMLElement).click();
    expect(spy).toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MyTripsComponent } from './my-trips.component';
import { SavedPlansService } from '../../core/saved-plans/saved-plans.service';

describe('MyTripsComponent — published-only filter', () => {
  let component: MyTripsComponent;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [MyTripsComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])],
    });
    const savedPlans = TestBed.inject(SavedPlansService);
    // register() pushes straight into the plans signal — no auth/API round-trip needed
    savedPlans.register({ id: 'p1', name: 'Euro trip', savedAt: '2026-07-01T00:00:00Z', stops: [], shareId: 'sh-1' });
    savedPlans.register({ id: 'p2', name: 'Asia trip', savedAt: '2026-07-02T00:00:00Z', stops: [] });
    component = TestBed.createComponent(MyTripsComponent).componentInstance;
  });

  it('shows all plans when the checkbox is off (default)', () => {
    expect(component.publishedOnly()).toBe(false);
    expect(component.filteredPlans().map(p => p.id)).toEqual(['p1', 'p2']);
  });

  it('shows only published plans when the checkbox is on', () => {
    component.publishedOnly.set(true);
    expect(component.filteredPlans().map(p => p.id)).toEqual(['p1']);
  });

  it('combines the published filter with the text search', () => {
    component.publishedOnly.set(true);
    component.planSearch.set('asia');
    expect(component.filteredPlans()).toEqual([]);   // Asia trip is not published
    component.planSearch.set('euro');
    expect(component.filteredPlans().map(p => p.id)).toEqual(['p1']);
  });
});

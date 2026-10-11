import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { TooManyRequestsComponent } from './too-many-requests.component';

describe('TooManyRequestsComponent', () => {
  it('counts down from ?retry and clamps junk to 60', fakeAsync(() => {
    for (const [q, start] of [['5', 5], ['abc', 60], ['99999', 3600]] as const) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [TooManyRequestsComponent],
        providers: [provideRouter([]), { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ retry: q }) } } }],
      });
      const f = TestBed.createComponent(TooManyRequestsComponent);
      f.detectChanges();
      expect(f.componentInstance.seconds()).toBe(start);
      tick(1000);
      expect(f.componentInstance.seconds()).toBe(start - 1);
      f.destroy();
    }
  }));
});

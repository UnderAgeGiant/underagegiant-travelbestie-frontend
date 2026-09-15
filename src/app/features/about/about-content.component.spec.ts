import { TestBed } from '@angular/core/testing';
import { AboutContentComponent } from './about-content.component';

describe('AboutContentComponent', () => {
  beforeAll(() => {
    global.IntersectionObserver = jest.fn(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    })) as any;
  });

  it('does not render a numbered badge on any team-member step (feedback #5)', () => {
    TestBed.configureTestingModule({ imports: [AboutContentComponent] });
    const fixture = TestBed.createComponent(AboutContentComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.about-step-num')).toBeNull();
  });
});

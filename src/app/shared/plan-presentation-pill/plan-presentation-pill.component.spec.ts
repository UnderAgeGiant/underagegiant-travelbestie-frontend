import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanPresentationPillComponent, presentationPillItems } from './plan-presentation-pill.component';
import * as util from '../../core/utils/personal-activity.util';

const stop = (selectedAttractions: any[]) => ({ cityId: 'paris', selectedAttractions } as any);

describe('presentationPillItems', () => {
  beforeEach(() => jest.spyOn(util, 'resolvePlannedAttraction').mockImplementation((_c, p: any) =>
    p.attractionId === 'noimg' ? ({ id: 'noimg', name: 'Sin foto' } as any)
      : ({ id: p.attractionId, name: `N-${p.attractionId}`, imageUrl: `/${p.attractionId}.jpg` } as any)));
  afterEach(() => jest.restoreAllMocks());

  it('keeps catalog attractions with an image, once each, in plan order', () => {
    const items = presentationPillItems([
      stop([{ attractionId: 'a' }, { activityType: 'dinner', title: 'Cena' }, { attractionId: 'noimg' }, { attractionId: 'a' }]),
      stop([{ attractionId: 'b' }]),
    ], 'es-CL');
    expect(items.map(i => i.id)).toEqual(['a', 'b']);
    expect(items[0]).toEqual({ id: 'a', name: 'N-a', imageUrl: '/a.jpg' });
  });

  it('is empty for a plan with only personal activities', () => {
    expect(presentationPillItems([stop([{ activityType: 'lunch', title: 'x' }])], 'es-CL')).toEqual([]);
  });
});

describe('PlanPresentationPillComponent', () => {
  let fixture: ComponentFixture<PlanPresentationPillComponent>;
  const render = (stops: any[], attention = false) => {
    fixture = TestBed.createComponent(PlanPresentationPillComponent);
    fixture.componentRef.setInput('stops', stops);
    fixture.componentRef.setInput('attention', attention);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const mockMatchMedia = (matches: boolean) => {
    (window as any).matchMedia = jest.fn().mockReturnValue({ matches });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockMatchMedia(false);
    jest.spyOn(util, 'resolvePlannedAttraction').mockImplementation((_c, p: any) =>
      ({ id: p.attractionId, name: `Nombre muy largo ${p.attractionId}`, imageUrl: `/${p.attractionId}.jpg` } as any));
    TestBed.configureTestingModule({ imports: [PlanPresentationPillComponent] });
  });
  afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); delete (window as any).matchMedia; });

  it('falls back to the plain button with no image items', () => {
    const el = render([]);
    expect(el.querySelector('.pp-pill')).toBeNull();
    expect(el.querySelector('button')!.textContent).toContain('Presentación del plan');
  });

  it('rotates every 5s and emits open on click', () => {
    const el = render([stop([{ attractionId: 'a' }, { attractionId: 'b' }])]);
    expect(el.querySelector('.pp-name')!.textContent).toContain('a');
    jest.advanceTimersByTime(5000); fixture.detectChanges();
    expect(el.querySelector('.pp-name')!.textContent).toContain('b');
    const spy = jest.fn(); fixture.componentInstance.open.subscribe(spy);
    (el.querySelector('button') as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalled();
  });

  it('does not rotate under prefers-reduced-motion', () => {
    mockMatchMedia(true);
    const el = render([stop([{ attractionId: 'a' }, { attractionId: 'b' }])]);
    jest.advanceTimersByTime(5000); fixture.detectChanges();
    expect(el.querySelector('.pp-name')!.textContent).toContain('a');
  });

  it('applies the bounce class only while attention is true', () => {
    expect(render([stop([{ attractionId: 'a' }])], true).querySelector('.pp-pill--attention')).not.toBeNull();
    expect(render([stop([{ attractionId: 'a' }])], false).querySelector('.pp-pill--attention')).toBeNull();
  });
});

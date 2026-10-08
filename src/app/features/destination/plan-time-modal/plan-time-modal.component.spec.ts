import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanTimeModalComponent } from './plan-time-modal.component';
import { personalAttraction } from '../../../core/utils/personal-activity.util';
import { Attraction } from '../../../core/models/comment.model';

const CATALOG: Attraction = {
  id: 'paris_0', name: 'Torre Eiffel', type: 'Histórico', category: 'poi', active: true,
  icon: '🏛️', bg: '#E8F0FD', rating: 4.8, estimatedMinutes: 120,
};

describe('PlanTimeModalComponent — personal mode (Feature 71)', () => {
  let fixture: ComponentFixture<PlanTimeModalComponent>;
  let comp: PlanTimeModalComponent;
  const setInput = (name: string, value: unknown) => fixture.componentRef.setInput(name, value);

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PlanTimeModalComponent] });
    fixture = TestBed.createComponent(PlanTimeModalComponent);
    comp = fixture.componentInstance;
  });

  function personalSetup(): void {
    setInput('attraction', personalAttraction({ activityType: 'lunch' }));
    setInput('personal', { title: 'Almuerzo', mapsUrl: '', isPrivate: false });
    fixture.detectChanges();
  }

  it('pre-fills title and blocks confirm when it is blank', () => {
    personalSetup();
    expect(comp.title()).toBe('Almuerzo');
    comp.title.set('   ');
    expect(comp.canConfirm()).toBe(false);
  });

  it('blocks confirm on a non-Google maps link and shows the error', () => {
    personalSetup();
    comp.mapsUrl.set('https://evil.io/x');
    fixture.detectChanges();
    expect(comp.canConfirm()).toBe(false);
    expect(fixture.nativeElement.querySelector('.pa-maps-error')).not.toBeNull();
  });

  it('emits title/mapsUrl/isPrivate with the time', () => {
    personalSetup();
    const spy = jest.fn();
    comp.confirmed.subscribe(spy);
    comp.title.set(' Cena tía ');
    comp.mapsUrl.set('https://maps.app.goo.gl/x');
    comp.isPrivate.set(true);
    comp.time.set('21:00');
    comp.confirm();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      startTime: '21:00', title: 'Cena tía', mapsUrl: 'https://maps.app.goo.gl/x', isPrivate: true,
    }));
  });

  // Regression (2026-10-08): the backdrop's `cond && cancel.emit()` handler evaluated to
  // `false` for clicks bubbling from inside the modal, and Angular calls preventDefault()
  // when a listener returns false — so the real checkbox click never toggled.
  it('a real click on the private checkbox toggles it (backdrop does not cancel the click)', () => {
    personalSetup();
    const cb: HTMLInputElement = fixture.nativeElement.querySelector('.pa-private input');
    cb.click();
    fixture.detectChanges();
    expect(cb.checked).toBe(true);
    expect(comp.isPrivate()).toBe(true);
  });

  it('a click on the backdrop itself still cancels', () => {
    personalSetup();
    const spy = jest.fn();
    comp.cancel.subscribe(spy);
    fixture.nativeElement.querySelector('.modal-backdrop').click();
    expect(spy).toHaveBeenCalled();
  });

  it('without personal input renders no title field (catalog mode unchanged)', () => {
    setInput('attraction', CATALOG);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pa-title-input')).toBeNull();
    expect(comp.canConfirm()).toBe(true);
  });
});

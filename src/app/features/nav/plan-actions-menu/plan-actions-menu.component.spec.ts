import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PlanActionsMenuComponent, PlanMenuAction } from './plan-actions-menu.component';
import { SavedPlan } from '../../../core/saved-plans/saved-plans.service';

(window as any).matchMedia = (window as any).matchMedia ?? (() => ({
  matches: false, media: '', addEventListener: () => {}, removeEventListener: () => {},
}));

describe('PlanActionsMenuComponent', () => {
  let fixture: ComponentFixture<PlanActionsMenuComponent>;
  const base = { id: 'p1', name: 'Paris', savedAt: '2026-07-01T00:00:00Z', stops: [] } as SavedPlan;
  const el = () => fixture.nativeElement as HTMLElement;
  const items = () => Array.from(el().querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
  // The emoji sits in an aria-hidden .ic span; the labels are everything else.
  const labels = () => items().map(b => Array.from(b.childNodes)
    .filter(n => n.nodeType !== Node.COMMENT_NODE && !(n as HTMLElement).classList?.contains('ic'))
    .map(n => n.textContent).join('').replace(/\s+/g, ' ').trim());

  function render(plan: SavedPlan, busy = false): void {
    fixture = TestBed.createComponent(PlanActionsMenuComponent);
    fixture.componentRef.setInput('plan', plan);
    fixture.componentRef.setInput('busy', busy);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PlanActionsMenuComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])],
    });
  });

  it('a published trip shows the eight actions in the spec order, in three groups', () => {
    render({ ...base, shareId: 's1' });
    expect(labels()).toEqual([
      'Modificar', 'Ver viaje publicado', 'Compartir',
      'Exportar a Excel −1 ✨', 'Invitar colaborador', 'Duplicar −1 ✨',
      'Dejar de publicar', 'Eliminar',
    ]);
    expect(el().querySelectorAll('[role="separator"]').length).toBe(2);
  });

  it('an unpublished trip shows Publicar and no unpublish item', () => {
    render(base);
    expect(labels()).toEqual(['Modificar', 'Publicar', 'Exportar a Excel −1 ✨', 'Invitar colaborador', 'Duplicar −1 ✨', 'Eliminar']);
  });

  it('shows the Excel cost hint only for a never-exported trip', () => {
    render({ ...base, exportedAt: '2026-07-02T00:00:00Z' });
    expect(labels()).toContain('Exportar a Excel');
  });

  it('clicking Compartir emits share', () => {
    render({ ...base, shareId: 's1' });
    const emitted: PlanMenuAction[] = [];
    fixture.componentInstance.action.subscribe(a => emitted.push(a));
    items().find(b => b.textContent!.includes('Compartir'))!.click();
    expect(emitted).toEqual(['share']);
  });

  it('the trigger carries the menu ARIA contract', () => {
    render(base);
    const trigger = el().querySelector<HTMLButtonElement>('.up-plan-more')!;
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-label')).toBe('Acciones del viaje');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});

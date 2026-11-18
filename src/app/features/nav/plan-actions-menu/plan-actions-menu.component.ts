import { Component, ElementRef, OnDestroy, OnInit, inject, input, output, signal, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { SavedPlan } from '../../../core/saved-plans/saved-plans.service';
import { PlanActionsService } from '../../../core/saved-plans/plan-actions.service';
import { placeMenu } from './place-menu.util';

export type PlanMenuAction = 'modify' | 'publish' | 'view' | 'share' | 'export' | 'invite' | 'duplicate' | 'unpublish' | 'delete';

const MENU_WIDTH = 224;

/**
 * "⋯ ▾" trigger + floating actions menu for one saved trip. The menu is a native popover (top layer),
 * so the scrolling list and the panel's overflow:hidden never clip it; placeMenu() positions it.
 */
@Component({
  selector: 'tb-plan-actions-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button #trigger type="button" class="up-plan-more" aria-haspopup="menu"
            i18n-aria-label="@@planMenu.trigger" aria-label="Acciones del viaje"
            [attr.aria-expanded]="open()" (click)="toggle()">⋯ ▾</button>
    <div #menu popover="auto" role="menu" class="up-plan-menu" (toggle)="onNativeToggle($event)">
      <button type="button" role="menuitem" class="up-plan-menu-item" (click)="pick('modify')" i18n="@@planMenu.modify">Modificar</button>
      @if (published()) {
        <button type="button" role="menuitem" class="up-plan-menu-item" (click)="pick('view')" i18n="@@planMenu.view">Ver viaje publicado</button>
        <button type="button" role="menuitem" class="up-plan-menu-item" (click)="pick('share')" i18n="@@planMenu.share">Compartir</button>
      } @else {
        <button type="button" role="menuitem" class="up-plan-menu-item" (click)="pick('publish')" i18n="@@planMenu.publish">Publicar</button>
      }
      <div class="up-plan-menu-sep" role="separator"></div>
      <button type="button" role="menuitem" class="up-plan-menu-item" [disabled]="busy()" (click)="pick('export')">
        <span i18n="@@planMenu.export">Exportar a Excel</span>
        @if (!plan().exportedAt) { <span class="up-plan-menu-cost" i18n="@@planMenu.costHint"> −1 ✨</span> }
      </button>
      <button type="button" role="menuitem" class="up-plan-menu-item" (click)="pick('invite')" i18n="@@planMenu.invite">Invitar colaborador</button>
      <button type="button" role="menuitem" class="up-plan-menu-item" (click)="pick('duplicate')">
        <span i18n="@@planMenu.duplicate">Duplicar</span><span class="up-plan-menu-cost"> −1 ✨</span>
      </button>
      <div class="up-plan-menu-sep" role="separator"></div>
      @if (published()) {
        <button type="button" role="menuitem" class="up-plan-menu-item" (click)="pick('unpublish')" i18n="@@planMenu.unpublish">Dejar de publicar</button>
      }
      <button type="button" role="menuitem" class="up-plan-menu-item up-plan-menu-danger" (click)="pick('delete')" i18n="@@planMenu.delete">Eliminar</button>
    </div>
  `,
  styles: [`
    /* Layout only while open: an unconditional display would override the UA's [popover]:not(:popover-open){display:none}. */
    .up-plan-menu:popover-open {
      inset: auto; margin: 0; padding: 6px; box-sizing: border-box; width: ${MENU_WIDTH}px;
      background: #fff; border: 1.5px solid var(--border); border-radius: 14px; box-shadow: var(--sh-lg);
      display: flex; flex-direction: column; gap: 1px;
    }
    .up-plan-menu-item {
      display: flex; align-items: center; gap: 6px; width: 100%; padding: 8px 10px; border: 0; border-radius: 8px;
      background: transparent; color: var(--t1); font-family: inherit; font-size: 13px; font-weight: 500; text-align: left; cursor: pointer;
    }
    .up-plan-menu-item:hover:not(:disabled), .up-plan-menu-item:focus-visible { background: var(--lav); color: var(--lav-d); outline: none; }
    .up-plan-menu-item:disabled { opacity: .5; cursor: default; }
    .up-plan-menu-cost { margin-left: auto; font-size: 11px; color: var(--t3); }
    .up-plan-menu-danger { color: oklch(45% 0.18 25); }
    .up-plan-menu-sep { height: 1px; background: var(--border); margin: 4px 2px; }
  `],
})
export class PlanActionsMenuComponent implements OnInit, OnDestroy {
  private readonly planActions = inject(PlanActionsService);

  readonly plan = input.required<SavedPlan>();
  /** True while this plan's export is in flight: its Excel item is disabled. */
  readonly busy = input(false);
  readonly action = output<PlanMenuAction>();

  readonly open = signal(false);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menu = viewChild.required<ElementRef<HTMLElement>>('menu');

  private readonly onScrollOrResize = (): void => { if (this.open()) this.close(); };

  /** A trip is published when it has a share id (or mock-mode share). */
  published(): boolean {
    return !!this.planActions.shareIdOf(this.plan());
  }

  ngOnInit(): void {
    // Scrolling moves the trigger away from the fixed-position menu: close instead of chasing it.
    document.addEventListener('scroll', this.onScrollOrResize, true);
    window.addEventListener('resize', this.onScrollOrResize);
  }

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.onScrollOrResize, true);
    window.removeEventListener('resize', this.onScrollOrResize);
  }

  toggle(): void {
    if (this.open()) { this.close(); return; }
    const el = this.menu().nativeElement;
    // popover is absent in jsdom: the signal alone carries the state there.
    (el as HTMLElement & { showPopover?: () => void }).showPopover?.();
    this.place();
    this.open.set(true);
  }

  pick(action: PlanMenuAction): void {
    this.action.emit(action);
    this.close();
  }

  /** Light dismiss and Esc close the popover natively (no handler needed); keep the signal in step. */
  onNativeToggle(event: Event): void {
    const state = (event as Event & { newState?: string }).newState;
    if (state === 'closed' && this.open()) this.finish();
  }

  private close(): void {
    (this.menu().nativeElement as HTMLElement & { hidePopover?: () => void }).hidePopover?.();
    this.finish();
  }

  /** Focus returns to the trigger unless the user moved it somewhere else on purpose. */
  private finish(): void {
    this.open.set(false);
    const active = document.activeElement;
    if (!active || active === document.body || this.menu().nativeElement.contains(active)) this.trigger().nativeElement.focus();
  }

  private place(): void {
    const el = this.menu().nativeElement;
    const r = this.trigger().nativeElement.getBoundingClientRect();
    const h = el.getBoundingClientRect().height;
    const pos = placeMenu(
      { top: r.top, bottom: r.bottom, right: r.right },
      { width: MENU_WIDTH, height: h },
      { width: window.innerWidth, height: window.innerHeight },
    );
    el.style.top = `${pos.top}px`;
    el.style.left = `${pos.left}px`;
  }
}

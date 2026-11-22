import { ChangeDetectionStrategy, Component, ElementRef, HostListener, LOCALE_ID, OnDestroy, computed, inject, signal } from '@angular/core';
import { ReferralService } from '../../../core/referral/referral.service';

const COPIED_MS = 2000;

/** F81: "Invita a tus amigos 💌" on /preferences — the invite link, the counts and the "?" rules. */
@Component({
  selector: 'tb-referral-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!referral.loadError()) {
      <section>
        <div class="section-head ref-head">
          <span i18n="@@referral.title">Invita a tus amigos 💌</span>
          @if (summary(); as s) {
            <button type="button" class="ref-help" aria-controls="ref-rules" [attr.aria-expanded]="rulesOpen()"
                    i18n-aria-label="@@referral.helpLabel" aria-label="Cómo funciona" (click)="toggleRules()">?</button>
            @if (rulesOpen()) {
              <div class="ref-rules" id="ref-rules">
                <div class="ref-rules-t" i18n="@@referral.rulesTitle">Cómo funciona</div>
                <ul>
                  <li i18n="@@referral.rule1">Ganas {{ s.rewardTokens }} Tokens cuando alguien se registra con tu link, verifica su correo y guarda su primer plan.</li>
                  <li i18n="@@referral.rule2">Máximo {{ s.monthCap }} Tokens al mes. Se reinicia el día 1 (hora de Chile).</li>
                  <li i18n="@@referral.rule3">Solo cuentan cuentas nuevas. Si alguien abrió antes el link de otra persona, la invitación es de quien lo invitó primero (vale 30 días).</li>
                  <li i18n="@@referral.rule4">Las cuentas creadas desde tu mismo navegador no suman Tokens.</li>
                  <li i18n="@@referral.rule5">Tú no ves los nombres ni correos de las personas que invitas.</li>
                </ul>
              </div>
            }
          }
        </div>
        <div class="ref-card">
          @if (summary(); as s) {
            <p class="ref-lead" i18n="@@referral.lead">Gana <b>{{ s.rewardTokens }} Tokens</b> por cada persona que se una con tu link y cree su primer plan. Hasta <b>{{ s.monthCap }} Tokens al mes</b>.</p>
            <div class="ref-link-row">
              <input class="form-input" readonly [value]="link()" i18n-aria-label="@@referral.linkLabel" aria-label="Tu link de invitación" />
              <button type="button" class="btn-pill btn-primary" (click)="copy()">
                @if (copied()) { <ng-container i18n="@@referral.copied">✓ Copiado</ng-container> }
                @else { <ng-container i18n="@@referral.copy">📋 Copiar</ng-container> }
              </button>
              @if (canShare) {
                <button type="button" class="btn-pill btn-outline" (click)="share()" i18n="@@referral.share">↗ Compartir</button>
              }
            </div>
            <div class="ref-stats">
              <div>
                <div class="trip-stat-val">{{ s.invitedCount }}</div>
                <div class="trip-stat-lbl" i18n="@@referral.invited">Personas invitadas</div>
              </div>
              <div class="ref-month">
                <div class="trip-stat-lbl" i18n="@@referral.thisMonth">Este mes</div>
                <div class="ref-month-val" i18n="@@referral.monthOf">{{ s.monthTokens }} <span>de {{ s.monthCap }} Tokens</span></div>
                <div class="ref-bar" aria-hidden="true"><i [style.width.%]="barPercent()"></i></div>
              </div>
            </div>
            @if (s.monthTokens >= s.monthCap) {
              <div class="ref-note" i18n="@@referral.capNote">🎉 Llegaste al máximo de este mes. Tus invitaciones siguen contando, y vuelves a sumar Tokens el {{ resetDate() }}.</div>
            }
          } @else {
            <div class="ref-skeleton" style="width: 80%"></div>
            <div class="ref-skeleton" style="height: 40px"></div>
            <div class="ref-skeleton" style="width: 50%; margin-bottom: 0"></div>
          }
        </div>
      </section>
    }
  `,
})
export class ReferralCardComponent implements OnDestroy {
  protected readonly referral = inject(ReferralService);
  private readonly locale = inject(LOCALE_ID);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly summary = this.referral.summary;
  readonly rulesOpen = signal(false);
  readonly copied = signal(false);
  readonly canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly link = computed(() => `${location.origin}/?ref=${this.summary()?.code ?? ''}`);
  readonly barPercent = computed(() => {
    const s = this.summary();
    return s && s.monthCap > 0 ? Math.min(100, Math.round((s.monthTokens / s.monthCap) * 100)) : 0;
  });
  /** "1 de diciembre" / "December 1" from `capResetsOn` (a plain date, read as UTC so it never shifts a day). */
  readonly resetDate = computed(() => {
    const on = this.summary()?.capResetsOn;
    if (!on) return '';
    return new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${on}T00:00:00Z`));
  });

  constructor() { void this.referral.loadSummary(); }

  toggleRules(): void { this.rulesOpen.update(v => !v); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.rulesOpen()) return;
    const head = this.host.nativeElement.querySelector('.ref-head');
    if (head && !head.contains(e.target as Node)) this.rulesOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.rulesOpen()) return;
    this.rulesOpen.set(false);
    (this.host.nativeElement.querySelector('.ref-help') as HTMLElement | null)?.focus();
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.link());
    } catch { return; }
    this.copied.set(true);
    if (this.copiedTimer) clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => this.copied.set(false), COPIED_MS);
  }

  async share(): Promise<void> {
    try { await navigator.share({ url: this.link() }); } catch { /* dismissed */ }
  }

  ngOnDestroy(): void { if (this.copiedTimer) clearTimeout(this.copiedTimer); }
}

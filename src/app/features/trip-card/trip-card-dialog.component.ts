import { Component, ElementRef, HostListener, effect, inject, signal, untracked } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { TrophyService } from '../../core/trophies/trophy.service';
import { TripCardService } from './trip-card.service';
import { TripCardData, buildTripCardData, tripCardFileName } from './trip-card-data.util';
import { pickMiel, renderTripCard } from './trip-card-render';
import { buildWhatsappUrl, shareMessage } from '../../core/share/share-url.util';

const STREAMER_COLORS = ['#F4B740', '#E8506A', '#4A7BE0', '#7CC4A4', '#B48CF2'];

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/**
 * Story-card preview with Compartir / Descargar. Preview and download use a data: URL,
 * not a blob: URL, because the production CSP's img-src has no blob:.
 */
@Component({
  selector: 'tb-trip-card-dialog',
  standalone: true,
  template: `
    @if (cards.request(); as req) {
      <div class="modal-backdrop tcd-backdrop" (click)="onBackdrop($event)">
        @if (req.celebrate) {
          <div class="tcd-streamers" aria-hidden="true">
            @for (s of streamers; track $index) {
              <span class="tcd-streamer" [style.left.%]="s.left" [style.background]="s.color"
                    [style.animation-delay.ms]="s.delay" [style.--tcd-rot]="s.rot + 'deg'"></span>
            }
          </div>
        }
        <div class="modal tcd" role="dialog" aria-modal="true" aria-labelledby="tcd-title" tabindex="-1">
          <div class="tcd-head">
            @if (req.celebrate) {
              <h2 id="tcd-title" class="tcd-title" i18n="@@tripCard.celebrateTitle">¡Tu viaje está publicado! 🎉</h2>
            } @else {
              <h2 id="tcd-title" class="tcd-title" i18n="@@tripCard.dialogTitle">Compartir tu viaje</h2>
            }
            <button class="tcd-x" type="button" (click)="close()"
                    i18n-aria-label="@@tripCard.closeAria" aria-label="Cerrar">✕</button>
          </div>

          @if (failed()) {
            <p class="tcd-error" role="alert" i18n="@@tripCard.loadError">No pudimos crear la tarjeta. Inténtalo de nuevo más tarde.</p>
            <div class="tcd-actions">
              <button class="btn-pill btn-outline" type="button" (click)="close()" i18n="@@tripCard.close">Cerrar</button>
            </div>
          } @else {
            <div class="tcd-preview" [attr.aria-busy]="!preview()">
              @if (preview(); as src) {
                <img [src]="src" width="1080" height="1920" i18n-alt="@@tripCard.previewAlt" alt="Tarjeta del viaje para historias" />
              } @else {
                <span class="tcd-loading" i18n="@@tripCard.loading">Creando tu tarjeta…</span>
              }
            </div>

            @if (copyState() === 'copied') {
              <p class="tcd-hint" role="status" i18n="@@tripCard.linkHint">Link copiado 🔗 En Instagram, pégalo con el sticker de enlace</p>
            } @else if (copyState() === 'failed') {
              <p class="tcd-hint">
                <button class="btn-pill btn-outline" type="button" (click)="copyLink()" i18n="@@tripCard.copyLink">Copiar link</button>
              </p>
            }
            @if (shareError()) {
              <p class="tcd-error" role="alert" i18n="@@tripCard.shareError">No se pudo compartir. Usa Descargar.</p>
            }

            <div class="tcd-actions">
              @if (canShareFiles()) {
                <button class="btn-pill btn-primary" type="button" (click)="share()"
                        [disabled]="!preview() || sharing()" [attr.aria-busy]="sharing()" i18n="@@tripCard.share">Compartir</button>
              } @else {
                <button class="btn-pill btn-primary" type="button" (click)="shareWhatsapp()"
                        [disabled]="!preview()" i18n="@@tripCard.whatsapp">WhatsApp</button>
              }
              <button class="btn-pill btn-outline" type="button"
                      (click)="download()" [disabled]="!preview() || sharing()" i18n="@@tripCard.download">Descargar</button>
              @if (req.celebrate) {
                <button class="btn-pill tcd-later" type="button" (click)="close()" i18n="@@tripCard.notNow">Ahora no</button>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .tcd-backdrop { overflow: hidden; }
    .tcd { position: relative; z-index: 1; padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 12px;
      max-height: calc(100dvh - 40px); overflow-y: auto; }
    .tcd:focus { outline: none; } /* focus is moved to the container on open; its buttons keep their rings */
    .tcd-head { display: flex; align-items: center; gap: 12px; }
    .tcd-title { flex: 1; margin: 0; font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 500; color: var(--t1); }
    .tcd-x { width: 32px; height: 32px; border-radius: 50%; color: var(--t3); font-size: 14px; }
    .tcd-x:hover { background: var(--cream); color: var(--t1); }
    .tcd-preview { align-self: center; aspect-ratio: 9 / 16; height: min(70dvh, calc(100dvh - 250px)); max-width: 100%;
      border-radius: 14px; overflow: hidden; background: linear-gradient(165deg, var(--lav), var(--cream) 52%, var(--peach));
      border: 1.5px solid var(--border); display: grid; place-items: center; }
    .tcd-preview img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .tcd-loading { font-size: 13px; font-weight: 500; color: var(--t2); }
    .tcd-hint { margin: 0; text-align: center; font-size: 13px; font-weight: 500; color: var(--t2); }
    .tcd-error { margin: 0; text-align: center; font-size: 13px; font-weight: 600; color: var(--peach-d); }
    .tcd-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
    .tcd-later { color: var(--t2); background: transparent; }
    .tcd-later:hover { color: var(--lav-d); }
    .tcd-streamers { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
    .tcd-streamer { position: absolute; top: -20px; width: 8px; height: 22px; border-radius: 3px;
      animation: tcd-fall 2s cubic-bezier(.2,.6,.4,1) both; }
    @keyframes tcd-fall { to { transform: translateY(110vh) rotate(var(--tcd-rot)); opacity: 0; } }
    @media (max-width: 768px) {
      .tcd { max-height: calc(100dvh - 12px); padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px)); }
      .tcd-preview { height: min(62dvh, calc(100dvh - 230px)); }
    }
    @media (prefers-reduced-motion: reduce) { .tcd-streamers { display: none; } }
  `],
})
export class TripCardDialogComponent {
  readonly cards = inject(TripCardService);
  private readonly api = inject(ApiService);
  private readonly trophies = inject(TrophyService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly preview = signal<string | null>(null);
  readonly failed = signal(false);
  readonly sharing = signal(false);
  readonly shareError = signal(false);
  readonly canShareFiles = signal(false);
  readonly copyState = signal<'idle' | 'copied' | 'failed'>('idle');

  // Built once per open, so the confetti doesn't re-randomise on change detection.
  streamers: { left: number; color: string; delay: number; rot: number }[] = [];
  private data: TripCardData | null = null;
  private file: File | null = null;
  private own = true;
  private loadId = 0;

  constructor() {
    effect(() => {
      const req = this.cards.request();
      untracked(() => (req ? this.load(req.shareId, req.celebrate, req.own) : this.reset()));
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.cards.request()) this.close();
  }

  onBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget) this.close();
  }

  close(): void {
    this.cards.close();
    this.reset();
  }

  async share(): Promise<void> {
    if (!this.file || !this.data || this.sharing()) return;
    const shareId = this.cards.request()?.shareId;
    this.sharing.set(true);
    this.shareError.set(false);
    try {
      void this.copyLink(); // not awaited: share() must run inside the tap's user activation (iOS Safari)
      await navigator.share({ files: [this.file], text: this.data.link });
      if (shareId) this.trophies.reportShare(shareId);
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') this.shareError.set(true);
    } finally {
      this.sharing.set(false);
    }
  }

  /** Desktop path: WhatsApp Web with the share text and the trip link (the image can't be attached there). */
  shareWhatsapp(): void {
    const shareId = this.cards.request()?.shareId;
    if (!shareId || !this.data) return;
    window.open(buildWhatsappUrl(this.data.title, shareId, undefined, shareMessage(this.own)), '_blank', 'noopener,noreferrer');
    this.trophies.reportShare(shareId);
  }

  download(): void {
    const src = this.preview();
    if (!src || !this.file) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = this.file.name;
    a.click();
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.data!.link);
      this.copyState.set('copied');
    } catch {
      this.copyState.set('failed');
    }
  }

  private load(shareId: string, celebrate: boolean, own: boolean): void {
    this.reset();
    this.own = own;
    const id = ++this.loadId;
    this.streamers = celebrate
      ? Array.from({ length: 28 }, (_, i) => ({
          left: Math.random() * 100, color: STREAMER_COLORS[i % STREAMER_COLORS.length],
          delay: Math.random() * 400, rot: 200 + Math.random() * 520,
        }))
      : [];
    const miel = pickMiel(); // once per open: preview, share and download are the same image
    setTimeout(() => this.host.nativeElement.querySelector('[role="dialog"]')?.focus());

    this.api.getSharedTrip(shareId).subscribe({
      next: trip => {
        if (id !== this.loadId) return;
        const data = buildTripCardData(trip, shareId);
        renderTripCard(data, miel)
          .then(async blob => {
            const url = await toDataUrl(blob);
            if (id !== this.loadId) return;
            this.data = data;
            this.file = new File([blob], tripCardFileName(data.title), { type: 'image/png' });
            this.canShareFiles.set(typeof navigator.canShare === 'function' && navigator.canShare({ files: [this.file] }));
            this.preview.set(url);
            void this.copyLink(); // the dialog copies the link when it opens (desktop: the "Copiar link" button if this is denied)
          })
          .catch(() => { if (id === this.loadId) this.failed.set(true); });
      },
      error: () => { if (id === this.loadId) this.failed.set(true); },
    });
  }

  private reset(): void {
    this.loadId++;
    this.preview.set(null);
    this.failed.set(false);
    this.sharing.set(false);
    this.shareError.set(false);
    this.canShareFiles.set(false);
    this.copyState.set('idle');
    this.data = null;
    this.file = null;
  }
}

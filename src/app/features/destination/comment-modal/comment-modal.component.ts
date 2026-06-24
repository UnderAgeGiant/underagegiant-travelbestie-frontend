import { Component, input, output, signal, inject, LOCALE_ID, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Attraction, Comment } from '../../../core/models/comment.model';

const AV_COLORS = ['#A78BFA','#F472B6','#34D399','#60A5FA','#FBBF24','#F87171','#818CF8','#4ADE80'];

@Component({
  selector: 'app-comment-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="modal-backdrop" (click)="$event.target === $event.currentTarget && close.emit()">
      <div class="modal">
        <div class="modal-head">
          <div class="modal-title" i18n="@@commentModal.title">Dejar un comentario</div>
          <div class="modal-sub">{{ attraction().icon }} {{ attraction().name }} · {{ cityName() }}</div>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" i18n="@@commentModal.ratingLabel">Calificación</label>
            <div class="star-row">
              @for (star of stars; track star) {
                <span [class]="'star-btn' + (rating() >= star ? ' on' : '')"
                      (click)="rating.set(star)">⭐</span>
              }
            </div>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label" i18n="@@commentModal.expLabel">Tu experiencia</label>
            <textarea class="form-textarea"
                      i18n-placeholder="@@commentModal.expPlaceholder"
                      placeholder="¿Qué te encantó? ¿Algún consejo para tu amig&#64;?"
                      [value]="text()"
                      (input)="text.set($any($event.target).value)"></textarea>
          </div>
        </div>
        @if (errorMessage()) {
          <div class="comment-error">{{ errorMessage() }}</div>
        }
        <div class="modal-foot">
          <button class="btn-pill btn-outline" (click)="close.emit()" style="flex:1" i18n="@@commentModal.cancelBtn">Cancelar</button>
          <button class="btn-pill btn-primary"
                  [disabled]="!isValid()"
                  [style.opacity]="isValid() ? 1 : 0.45"
                  (click)="submit()"
                  style="flex:2"
                  i18n="@@commentModal.submitBtn">Publicar comentario 💌</button>
        </div>
      </div>
    </div>
  `,
})
export class CommentModalComponent {
  attraction   = input.required<Attraction>();
  cityName     = input.required<string>();
  userName     = input.required<string>();
  errorMessage = input<string | null>(null);
  close        = output<void>();
  submitted    = output<Omit<Comment, 'id'>>();

  text   = signal('');
  rating = signal(0);
  readonly stars = [1, 2, 3, 4, 5];
  private readonly locale   = inject(LOCALE_ID);
  private readonly datePipe = new DatePipe(this.locale);

  isValid() { return this.text().trim() && this.rating() > 0; }

  submit(): void {
    if (!this.isValid()) return;
    const initial = this.userName()[0]?.toUpperCase() ?? '?';
    const color   = AV_COLORS[initial.charCodeAt(0) % AV_COLORS.length];
    this.submitted.emit({
      attractionId: this.attraction().id,
      name:   this.userName(),
      text:   this.text().trim(),
      rating: this.rating(),
      color,
      date:   this.datePipe.transform(new Date(), 'dd/MM/yyyy') ?? '',
    });
  }
}

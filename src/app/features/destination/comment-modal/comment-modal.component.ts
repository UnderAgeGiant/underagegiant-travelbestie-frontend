import { Component, input, output, signal, inject, LOCALE_ID } from '@angular/core';
import { Attraction, Comment } from '../../../core/models/comment.model';

const AV_COLORS = ['#A78BFA','#F472B6','#34D399','#60A5FA','#FBBF24','#F87171','#818CF8','#4ADE80'];

@Component({
  selector: 'app-comment-modal',
  standalone: true,
  template: `
    <div class="modal-backdrop" (click)="$event.target === $event.currentTarget && close.emit()">
      <div class="modal">
        <div class="modal-head">
          <div class="modal-title" i18n="@@commentModal.title">Dejar un comentario</div>
          <div class="modal-sub">{{ attraction().icon }} {{ attraction().name }} · {{ cityName() }}</div>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" i18n="@@commentModal.nameLabel">Tu nombre</label>
            <input class="form-input"
                   i18n-placeholder="@@commentModal.namePlaceholder" placeholder="ej. Sofía"
                   [value]="name()"
                   (input)="name.set($any($event.target).value)" />
          </div>
          <div class="form-group">
            <label class="form-label" i18n="@@commentModal.avatarLabel">Avatar</label>
            <div class="avatar-row">
              @for (color of colors; track $index) {
                <div [class]="'av-opt' + (avIdx() === $index ? ' sel' : '')"
                     [style.background]="color"
                     (click)="avIdx.set($index)">{{ (name() || '?')[0]?.toUpperCase() }}</div>
              }
            </div>
          </div>
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
  attraction = input.required<Attraction>();
  cityName = input.required<string>();
  close = output<void>();
  submitted = output<Omit<Comment, 'id'>>();

  name = signal('');
  text = signal('');
  rating = signal(0);
  avIdx = signal(0);
  readonly colors = AV_COLORS;
  readonly stars = [1, 2, 3, 4, 5];
  private readonly locale = inject(LOCALE_ID);

  isValid() { return this.name().trim() && this.text().trim() && this.rating() > 0; }

  submit(): void {
    if (!this.isValid()) return;
    this.submitted.emit({
      attractionId: this.attraction().id,
      name: this.name().trim(),
      text: this.text().trim(),
      rating: this.rating(),
      color: AV_COLORS[this.avIdx()],
      date: new Date().toLocaleDateString(this.locale, { month: 'short', day: 'numeric' }),
    });
  }
}

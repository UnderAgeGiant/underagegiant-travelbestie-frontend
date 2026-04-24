import { Component, input, output, signal } from '@angular/core';
import { Attraction, Comment } from '../../../core/models/comment.model';

const AV_COLORS = ['#A78BFA','#F472B6','#34D399','#60A5FA','#FBBF24','#F87171','#818CF8','#4ADE80'];

@Component({
  selector: 'app-comment-modal',
  standalone: true,
  template: `
    <div class="modal-backdrop" (click)="$event.target === $event.currentTarget && close.emit()">
      <div class="modal">
        <div class="modal-head">
          <div class="modal-title">Leave a Comment</div>
          <div class="modal-sub">{{ attraction().icon }} {{ attraction().name }} · {{ cityName() }}</div>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Your name</label>
            <input class="form-input" placeholder="e.g. Sofia"
                   [value]="name()"
                   (input)="name.set($any($event.target).value)" />
          </div>
          <div class="form-group">
            <label class="form-label">Avatar</label>
            <div class="avatar-row">
              @for (color of colors; track $index) {
                <div [class]="'av-opt' + (avIdx() === $index ? ' sel' : '')"
                     [style.background]="color"
                     (click)="avIdx.set($index)">{{ (name() || '?')[0]?.toUpperCase() }}</div>
              }
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Rating</label>
            <div class="star-row">
              @for (star of stars; track star) {
                <span [class]="'star-btn' + (rating() >= star ? ' on' : '')"
                      (click)="rating.set(star)">⭐</span>
              }
            </div>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Your experience</label>
            <textarea class="form-textarea"
                      placeholder="What did you love? Any tips for your bestie?"
                      [value]="text()"
                      (input)="text.set($any($event.target).value)"></textarea>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-pill btn-outline" (click)="close.emit()" style="flex:1">Cancel</button>
          <button class="btn-pill btn-primary"
                  [disabled]="!isValid()"
                  [style.opacity]="isValid() ? 1 : 0.45"
                  (click)="submit()"
                  style="flex:2">Post Comment 💌</button>
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

  isValid() { return this.name().trim() && this.text().trim() && this.rating() > 0; }

  submit(): void {
    if (!this.isValid()) return;
    this.submitted.emit({
      attractionId: this.attraction().id,
      name: this.name().trim(),
      text: this.text().trim(),
      rating: this.rating(),
      color: AV_COLORS[this.avIdx()],
      date: new Date().toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    });
  }
}

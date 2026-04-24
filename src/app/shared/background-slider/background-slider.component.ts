import { Component, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { NgClass } from '@angular/common';

export interface Slide {
  url: string;
  city: string;
  country: string;
  attr: string;
  grad: string;
}

export const SLIDES: Slide[] = [
  { url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1920&q=80', city: 'Paris', country: 'France', attr: 'Eiffel Tower', grad: 'linear-gradient(135deg,#8B5CF6,#EC4899)' },
  { url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1920&q=80', city: 'Tokyo', country: 'Japan', attr: 'Shinjuku at Night', grad: 'linear-gradient(135deg,#EC4899,#F97316)' },
  { url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1920&q=80', city: 'Rome', country: 'Italy', attr: 'The Colosseum', grad: 'linear-gradient(135deg,#F59E0B,#EF4444)' },
  { url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1920&q=80', city: 'Santorini', country: 'Greece', attr: 'Oia at Sunset', grad: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' },
  { url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1920&q=80', city: 'Bali', country: 'Indonesia', attr: 'Tegallalang Rice Terraces', grad: 'linear-gradient(135deg,#10B981,#3B82F6)' },
  { url: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=1920&q=80', city: 'New York', country: 'USA', attr: 'Manhattan Skyline', grad: 'linear-gradient(135deg,#6366F1,#EC4899)' },
  { url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1920&q=80', city: 'Dubai', country: 'UAE', attr: 'Burj Khalifa', grad: 'linear-gradient(135deg,#8B5CF6,#06B6D4)' },
  { url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1920&q=80', city: 'London', country: 'UK', attr: 'Palace of Westminster', grad: 'linear-gradient(135deg,#1D4ED8,#7C3AED)' },
];

@Component({
  selector: 'app-background-slider',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="bg-slider">
      @for (slide of slides; track $index) {
        <div [ngClass]="['bg-slide', activeIdx() === $index ? 'active' : '']">
          <img [src]="slide.url" [alt]="slide.city" />
          <div class="bg-overlay"></div>
        </div>
      }
      <div class="bg-caption">
        <div class="bg-caption-attr">{{ slides[activeIdx()].attr }}</div>
        <div class="bg-caption-city">{{ slides[activeIdx()].city }}</div>
        <div class="bg-caption-country">{{ slides[activeIdx()].country }}</div>
      </div>
      <div class="slider-dots">
        @for (slide of slides; track $index) {
          <button [class]="'slider-dot' + (activeIdx() === $index ? ' active' : '')"
                  (click)="dotClick.emit($index)"></button>
        }
      </div>
      <div class="slider-arrows">
        <button class="slider-arrow" (click)="prev.emit()">▲</button>
        <button class="slider-arrow" (click)="next.emit()">▼</button>
      </div>
    </div>
  `,
})
export class BackgroundSliderComponent {
  activeIdx = input.required<number>();
  prev = output<void>();
  next = output<void>();
  dotClick = output<number>();
  readonly slides = SLIDES;
}

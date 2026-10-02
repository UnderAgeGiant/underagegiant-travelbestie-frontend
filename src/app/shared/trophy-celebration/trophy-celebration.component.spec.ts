import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TrophyCelebrationComponent } from './trophy-celebration.component';
import { TrophyCelebrationService } from '../../core/trophies/trophy-celebration.service';

describe('TrophyCelebrationComponent', () => {
  const current = signal<any>(null);
  const burstId = signal(0);
  const dismiss = jest.fn();

  beforeEach(() => {
    current.set(null); burstId.set(0); dismiss.mockReset();
    TestBed.configureTestingModule({
      imports: [TrophyCelebrationComponent],
      providers: [{ provide: TrophyCelebrationService, useValue: { current, burstId, dismiss } }],
    });
  });

  it('renders nothing when idle', () => {
    const f = TestBed.createComponent(TrophyCelebrationComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.tc-card')).toBeNull();
  });

  it('shows the card with image, name and tier; ✕ dismisses', () => {
    current.set({ type: 'ai_plans', tier: 'gold', earnedAt: 'x' });
    burstId.set(1);
    const f = TestBed.createComponent(TrophyCelebrationComponent);
    f.detectChanges();
    const card = f.nativeElement.querySelector('.tc-card');
    expect(card.textContent).toContain('Mejor planeador con IA');
    expect(card.textContent).toContain('Oro');
    // The trophy image floats in a soap bubble outside the card; the card keeps only the texts.
    expect(card.querySelector('img')).toBeNull();
    const bubbleImg = f.nativeElement.querySelector('.tc-bubble.tb-soap-bubble img');
    expect(bubbleImg.getAttribute('src')).toBe('/trophies/trophy-ai-plans-gold.png');
    expect(f.nativeElement.querySelectorAll('.tc-streamer').length).toBeGreaterThan(0);
    card.querySelector('.tc-close').click();
    expect(dismiss).toHaveBeenCalled();
  });
});

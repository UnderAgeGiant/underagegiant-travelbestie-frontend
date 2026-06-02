import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CommentCooldownService {
  readonly cooldownSeconds = signal(0);
  readonly shaking         = signal(false);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  startCooldown(seconds: number): void {
    this.stopInterval();
    this.cooldownSeconds.set(seconds);
    this.intervalId = setInterval(() => {
      const next = this.cooldownSeconds() - 1;
      if (next <= 0) {
        this.cooldownSeconds.set(0);
        this.stopInterval();
      } else {
        this.cooldownSeconds.set(next);
      }
    }, 1000);
  }

  triggerShake(): void {
    this.shaking.set(true);
    setTimeout(() => this.shaking.set(false), 600);
  }

  private stopInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

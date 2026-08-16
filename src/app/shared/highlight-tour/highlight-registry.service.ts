import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HighlightRegistryService {
  private readonly targets = new Map<string, HTMLElement>();

  register(id: string, el: HTMLElement): void {
    this.targets.set(id, el);
  }

  unregister(id: string, el: HTMLElement): void {
    if (this.targets.get(id) === el) this.targets.delete(id);
  }

  get(id: string): HTMLElement | null {
    return this.targets.get(id) ?? null;
  }
}

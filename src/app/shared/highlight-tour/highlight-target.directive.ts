import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';
import { HighlightRegistryService } from './highlight-registry.service';

@Directive({ selector: '[tbHighlightTarget]', standalone: true })
export class HighlightTargetDirective implements OnInit, OnDestroy {
  readonly targetId = input.required<string>({ alias: 'tbHighlightTarget' });

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly registry = inject(HighlightRegistryService);

  ngOnInit(): void {
    this.registry.register(this.targetId(), this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.registry.unregister(this.targetId(), this.el.nativeElement);
  }
}

import { AfterViewInit, Directive, ElementRef, inject, OnDestroy } from '@angular/core';

@Directive({ selector: '[tbInView]', standalone: true })
export class InViewDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private observer!: IntersectionObserver;

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.el.nativeElement.classList.add('in-view');
          this.observer.unobserve(this.el.nativeElement);
        }
      },
      { threshold: 0.3 },
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void { this.observer?.disconnect(); }
}

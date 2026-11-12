import { Directive, ElementRef, effect, inject, input, Renderer2 } from '@angular/core';
import { sizedImageUrl } from '../../core/utils/sized-image-url.util';

/** Sizes an attraction photo to the Wikimedia thumb width; falls back to the original url once on error. */
@Directive({
  selector: 'img[tbAttImg]',
  standalone: true,
  host: { '(error)': 'onError()' },
})
export class AttractionImgDirective {
  readonly tbAttImg = input<string | null | undefined>(null);
  readonly tbAttImgWidth = input<500 | 960>(500);

  private readonly el = inject<ElementRef<HTMLImageElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private fellBack = false;

  constructor() {
    effect(() => {
      const url = this.tbAttImg();
      const width = this.tbAttImgWidth();
      this.fellBack = false;
      if (!url) {
        this.renderer.removeAttribute(this.el.nativeElement, 'src');
        return;
      }
      this.renderer.setAttribute(this.el.nativeElement, 'src', sizedImageUrl(url, width));
    });
  }

  onError(): void {
    const url = this.tbAttImg();
    if (this.fellBack || !url) return;
    this.fellBack = true;
    this.renderer.setAttribute(this.el.nativeElement, 'src', url);
  }
}

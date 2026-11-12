import { Directive, ElementRef, effect, inject, input, output, Renderer2 } from '@angular/core';
import { sizedImageUrl } from '../../core/utils/sized-image-url.util';

/**
 * Sizes an attraction photo to the Wikimedia thumb width. On the first error it falls back to the
 * original url; `tbAttImgFailed` fires only when no further fallback is left (already on the original,
 * or the url was never rewritten), so the host can show its placeholder.
 */
@Directive({
  selector: 'img[tbAttImg]',
  standalone: true,
  host: { '(error)': 'onError()' },
})
export class AttractionImgDirective {
  readonly tbAttImg = input<string | null | undefined>(null);
  readonly tbAttImgWidth = input<500 | 960>(500);
  readonly tbAttImgFailed = output<void>();

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
    if (!url) return;
    const width = this.tbAttImgWidth();
    const sized = sizedImageUrl(url, width);
    if (!this.fellBack && sized !== url) {
      this.fellBack = true;
      this.renderer.setAttribute(this.el.nativeElement, 'src', url);
      return;
    }
    this.fellBack = true;
    this.tbAttImgFailed.emit();
  }
}

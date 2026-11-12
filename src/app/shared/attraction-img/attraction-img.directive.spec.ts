import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AttractionImgDirective } from './attraction-img.directive';

const ORIG = 'https://upload.wikimedia.org/wikipedia/commons/1/16/Paliwal_Park_Agra_Uttar_Pradesh.jpg';
const SIZED =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Paliwal_Park_Agra_Uttar_Pradesh.jpg/500px-Paliwal_Park_Agra_Uttar_Pradesh.jpg';
const ORIG2 = 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Other_Photo.png';
const SIZED2 =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Other_Photo.png/500px-Other_Photo.png';
const UNSPLASH = 'https://images.unsplash.com/photo-1564507592333-87154ceb8e23?auto=format&fit=crop&w=800&q=80';

@Component({
  standalone: true,
  imports: [AttractionImgDirective],
  template: `<img [tbAttImg]="url" [tbAttImgWidth]="500" (tbAttImgFailed)="failures = failures + 1" />`,
})
class HostComponent {
  url: string | null | undefined = ORIG;
  failures = 0;
}

describe('AttractionImgDirective', () => {
  function setup(url: string | null) {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.url = url;
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    return { fixture, img };
  }

  it('sets the sized src', () => {
    const { img } = setup(ORIG);
    expect(img.getAttribute('src')).toBe(SIZED);
  });

  it('on a rewritten url, first error swaps to the original without emitting; second error emits', () => {
    const { fixture, img } = setup(ORIG);
    img.dispatchEvent(new Event('error'));
    expect(img.getAttribute('src')).toBe(ORIG);
    expect(fixture.componentInstance.failures).toBe(0);
    img.dispatchEvent(new Event('error'));
    expect(img.getAttribute('src')).toBe(ORIG);
    expect(fixture.componentInstance.failures).toBe(1);
  });

  it('on an unrewritten url, first error emits (no fallback is possible)', () => {
    const { fixture, img } = setup(UNSPLASH);
    expect(img.getAttribute('src')).toBe(UNSPLASH);
    img.dispatchEvent(new Event('error'));
    expect(fixture.componentInstance.failures).toBe(1);
    expect(img.getAttribute('src')).toBe(UNSPLASH);
  });

  it('changing the url resets the fallback', () => {
    const { fixture, img } = setup(ORIG);
    img.dispatchEvent(new Event('error'));
    expect(img.getAttribute('src')).toBe(ORIG);

    fixture.componentInstance.url = ORIG2;
    fixture.detectChanges();
    expect(img.getAttribute('src')).toBe(SIZED2);

    img.dispatchEvent(new Event('error'));
    expect(img.getAttribute('src')).toBe(ORIG2);
    expect(fixture.componentInstance.failures).toBe(0);
  });

  it('sets no src for a null url', () => {
    const { img } = setup(null);
    expect(img.hasAttribute('src')).toBe(false);
  });
});

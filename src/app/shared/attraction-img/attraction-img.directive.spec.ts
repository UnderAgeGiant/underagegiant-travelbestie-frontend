import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AttractionImgDirective } from './attraction-img.directive';

const ORIG = 'https://upload.wikimedia.org/wikipedia/commons/1/16/Paliwal_Park_Agra_Uttar_Pradesh.jpg';
const SIZED =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Paliwal_Park_Agra_Uttar_Pradesh.jpg/500px-Paliwal_Park_Agra_Uttar_Pradesh.jpg';

@Component({
  standalone: true,
  imports: [AttractionImgDirective],
  template: `<img [tbAttImg]="url" [tbAttImgWidth]="500" />`,
})
class HostComponent {
  url: string | null | undefined = ORIG;
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

  it('swaps to the original on the first error only', () => {
    const { img } = setup(ORIG);
    img.dispatchEvent(new Event('error'));
    expect(img.getAttribute('src')).toBe(ORIG);
    img.dispatchEvent(new Event('error'));
    expect(img.getAttribute('src')).toBe(ORIG);
  });

  it('sets no src for a null url', () => {
    const { img } = setup(null);
    expect(img.hasAttribute('src')).toBe(false);
  });
});

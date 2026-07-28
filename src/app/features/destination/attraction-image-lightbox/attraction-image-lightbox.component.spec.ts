import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttractionImageLightboxComponent } from './attraction-image-lightbox.component';

const IMAGES = ['https://img/a.jpg', 'https://img/b.jpg', 'https://img/c.jpg'];

describe('AttractionImageLightboxComponent', () => {
  let fixture: ComponentFixture<AttractionImageLightboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AttractionImageLightboxComponent] }).compileComponents();
    fixture = TestBed.createComponent(AttractionImageLightboxComponent);
  });

  it('shows the image at startIndex on init', () => {
    fixture.componentRef.setInput('images', IMAGES);
    fixture.componentRef.setInput('startIndex', 1);
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.lb-img') as HTMLImageElement;
    expect(img.src).toBe(IMAGES[1]);
  });

  it('defaults to the first image when startIndex is not set', () => {
    fixture.componentRef.setInput('images', IMAGES);
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.lb-img') as HTMLImageElement;
    expect(img.src).toBe(IMAGES[0]);
  });

  it('hides navigation controls when there is only one image', () => {
    fixture.componentRef.setInput('images', [IMAGES[0]]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.lb-arrows')).toBeNull();
    expect(el.querySelector('.lb-dots')).toBeNull();
    expect(el.querySelector('.lb-counter')).toBeNull();
  });

  it('shows a 1-based counter out of the total', () => {
    fixture.componentRef.setInput('images', IMAGES);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.lb-counter')?.textContent?.trim()).toBe('1 / 3');
  });

  it('emits closed when the close button is clicked', () => {
    fixture.componentRef.setInput('images', IMAGES);
    fixture.detectChanges();
    let closedFired = false;
    fixture.componentInstance.closed.subscribe(() => (closedFired = true));
    (fixture.nativeElement.querySelector('.lb-close') as HTMLButtonElement).click();
    expect(closedFired).toBe(true);
  });

  it('emits closed on Escape keydown', () => {
    fixture.componentRef.setInput('images', IMAGES);
    fixture.detectChanges();
    let closedFired = false;
    fixture.componentInstance.closed.subscribe(() => (closedFired = true));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closedFired).toBe(true);
  });

  it('emits closed when the backdrop (not the image) is clicked', () => {
    fixture.componentRef.setInput('images', IMAGES);
    fixture.detectChanges();
    let closedFired = false;
    fixture.componentInstance.closed.subscribe(() => (closedFired = true));
    (fixture.nativeElement.querySelector('.lb-overlay') as HTMLElement).click();
    expect(closedFired).toBe(true);
  });

  it('does not close when the image itself is clicked', () => {
    fixture.componentRef.setInput('images', IMAGES);
    fixture.detectChanges();
    let closedFired = false;
    fixture.componentInstance.closed.subscribe(() => (closedFired = true));
    (fixture.nativeElement.querySelector('.lb-img') as HTMLElement).click();
    expect(closedFired).toBe(false);
  });

  it('advances to the next image when the next arrow is clicked', () => {
    fixture.componentRef.setInput('images', IMAGES);
    fixture.detectChanges();
    const arrows = fixture.nativeElement.querySelectorAll('.lb-arrow');
    (arrows[1] as HTMLButtonElement).click(); // next
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.lb-img') as HTMLImageElement;
    expect(img.src).toBe(IMAGES[1]);
  });

  it('wraps to the last image when prev is clicked on the first image', () => {
    fixture.componentRef.setInput('images', IMAGES);
    fixture.detectChanges();
    const arrows = fixture.nativeElement.querySelectorAll('.lb-arrow');
    (arrows[0] as HTMLButtonElement).click(); // prev
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.lb-img') as HTMLImageElement;
    expect(img.src).toBe(IMAGES[2]);
  });

  it('jumps to the clicked dot', () => {
    fixture.componentRef.setInput('images', IMAGES);
    fixture.detectChanges();
    const dots = fixture.nativeElement.querySelectorAll('.lb-dot');
    (dots[2] as HTMLButtonElement).click();
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.lb-img') as HTMLImageElement;
    expect(img.src).toBe(IMAGES[2]);
  });

  it('advances on a left swipe', () => {
    fixture.componentRef.setInput('images', IMAGES);
    fixture.detectChanges();
    const instance = fixture.componentInstance as any;
    instance.onTouchStart({ changedTouches: [{ clientX: 300 }] });
    instance.onTouchEnd({ changedTouches: [{ clientX: 220 }] }); // 80px left swipe
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.lb-img') as HTMLImageElement;
    expect(img.src).toBe(IMAGES[1]);
  });

  it('goes back on a right swipe', () => {
    fixture.componentRef.setInput('images', IMAGES);
    fixture.componentRef.setInput('startIndex', 1);
    fixture.detectChanges();
    const instance = fixture.componentInstance as any;
    instance.onTouchStart({ changedTouches: [{ clientX: 200 }] });
    instance.onTouchEnd({ changedTouches: [{ clientX: 280 }] }); // 80px right swipe
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.lb-img') as HTMLImageElement;
    expect(img.src).toBe(IMAGES[0]);
  });

  it('ignores swipes shorter than the threshold', () => {
    fixture.componentRef.setInput('images', IMAGES);
    fixture.detectChanges();
    const instance = fixture.componentInstance as any;
    instance.onTouchStart({ changedTouches: [{ clientX: 300 }] });
    instance.onTouchEnd({ changedTouches: [{ clientX: 280 }] }); // 20px — below 50px threshold
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.lb-img') as HTMLImageElement;
    expect(img.src).toBe(IMAGES[0]);
  });
});

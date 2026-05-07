import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-ad-banner',
  standalone: true,
  template: `
    <div class="ad-footer">
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="ca-pub-1533808150894498"
           data-ad-slot="YOUR_AD_SLOT_ID"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  `,
  styles: [`
    .ad-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 150;
      background: #fff;
      border-top: 1px solid var(--border, #e5e7eb);
      min-height: 60px;
    }
    @media (min-width: 768px) {
      .ad-footer { min-height: 90px; }
    }
  `],
})
export class AdBannerComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    try {
      ((window as any)['adsbygoogle'] as unknown[] ??= []).push({});
    } catch { /* ad blocker or script not loaded */ }
  }
}

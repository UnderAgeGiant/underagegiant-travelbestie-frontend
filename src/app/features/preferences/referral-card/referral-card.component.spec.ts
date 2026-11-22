import { TestBed } from '@angular/core/testing';
import { LOCALE_ID, signal } from '@angular/core';
import { ReferralCardComponent } from './referral-card.component';
import { ReferralService } from '../../../core/referral/referral.service';
import type { ReferralSummary } from '../../../core/models/referral.model';

const BASE: ReferralSummary = { code: 'ana7k2xq', invitedCount: 3, monthTokens: 30, rewardTokens: 10, monthCap: 100, capResetsOn: '2026-12-01' };

describe('ReferralCardComponent (F81)', () => {
  let summary: ReturnType<typeof signal<ReferralSummary | null>>;
  let loadError: ReturnType<typeof signal<boolean>>;
  let writeText: jest.Mock;

  function render(s: ReferralSummary | null, share?: () => Promise<void>, locale = 'es-CL') {
    writeText = jest.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    summary = signal(s);
    loadError = signal(false);
    TestBed.configureTestingModule({
      imports: [ReferralCardComponent],
      providers: [
        { provide: ReferralService, useValue: { summary, loadError, loadSummary: jest.fn(() => Promise.resolve(s)) } },
        { provide: LOCALE_ID, useValue: locale },
      ],
    });
    const f = TestBed.createComponent(ReferralCardComponent);
    f.detectChanges();
    return f;
  }
  const el = (f: { nativeElement: HTMLElement }) => f.nativeElement;
  const text = (f: { nativeElement: HTMLElement }, sel: string) => el(f).querySelector(sel)?.textContent?.replace(/\s+/g, ' ').trim();
  const button = (f: { nativeElement: HTMLElement }, label: RegExp) =>
    Array.from(el(f).querySelectorAll('button')).find(b => label.test(b.textContent ?? '')) as HTMLButtonElement | undefined;

  it('renders the invite link with the summary code', () => {
    const f = render(BASE);
    expect((el(f).querySelector('.ref-link-row input') as HTMLInputElement).value).toBe(`${location.origin}/?ref=ana7k2xq`);
  });

  it('Copiar writes the link to the clipboard and shows "Copiado"', async () => {
    const f = render(BASE);
    button(f, /Copiar/)!.click();
    await Promise.resolve(); await Promise.resolve();
    f.detectChanges();
    expect(writeText).toHaveBeenCalledWith(`${location.origin}/?ref=ana7k2xq`);
    expect(button(f, /Copiado/)).toBeDefined();
  });

  it('hides Compartir without navigator.share and shows it with', () => {
    expect(button(render(BASE), /Compartir/)).toBeUndefined();
    TestBed.resetTestingModule();
    expect(button(render(BASE, () => Promise.resolve()), /Compartir/)).toBeDefined();
  });

  it('shows "30 de 100 Tokens", 3 people and a 30% bar', () => {
    const f = render(BASE);
    expect(text(f, '.ref-month-val')).toBe('30 de 100 Tokens');
    expect(text(f, '.ref-stats .trip-stat-val')).toBe('3');
    expect((el(f).querySelector('.ref-bar i') as HTMLElement).style.width).toBe('30%');
    expect(el(f).querySelector('.ref-note')).toBeNull();
  });

  it('shows the cap note only at the cap, with the reset date', () => {
    const f = render({ ...BASE, monthTokens: 100 });
    expect(text(f, '.ref-note')).toContain('1 de diciembre');
    expect((el(f).querySelector('.ref-bar i') as HTMLElement).style.width).toBe('100%');
  });

  it('formats the reset date in the active locale (en-US)', () => {
    expect(text(render({ ...BASE, monthTokens: 100 }, undefined, 'en-US'), '.ref-note')).toContain('December 1');
  });

  it('"?" toggles aria-expanded and the rules; Escape and an outside click close them', () => {
    const f = render(BASE);
    const help = el(f).querySelector('.ref-help') as HTMLButtonElement;
    expect(help.getAttribute('aria-expanded')).toBe('false');
    help.click(); f.detectChanges();
    expect(help.getAttribute('aria-expanded')).toBe('true');
    expect(el(f).querySelectorAll('.ref-rules li').length).toBe(5);
    expect(text(f, '.ref-rules li')).toContain('10 Tokens');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); f.detectChanges();
    expect(el(f).querySelector('.ref-rules')).toBeNull();
    help.click(); f.detectChanges();
    document.body.click(); f.detectChanges();
    expect(el(f).querySelector('.ref-rules')).toBeNull();
  });

  it('shows a skeleton without numbers while loading, and nothing on error', () => {
    const f = render(null);
    expect(el(f).querySelector('.ref-skeleton')).not.toBeNull();
    expect(el(f).querySelector('.ref-link-row')).toBeNull();
    loadError.set(true); f.detectChanges();
    expect(el(f).querySelector('section')).toBeNull();
  });
});

import { TripCardData } from './trip-card-data.util';
import { countryCodeFromFlagEmoji } from '../../shared/flag-icon/flag-emoji.util';

export type MielPick = { src: string; side: 'left' | 'right' };

/** Add a Miel image here (a transparent PNG in public/) to put it in the random pick. */
export const MIEL_SET: readonly string[] = ['/Dog-highlight-wagging-tail-1.png', '/Dog-highlight-playfull-1.png'];

export function pickMiel(rand: () => number = Math.random): MielPick {
  const combos = MIEL_SET.flatMap(src => (['left', 'right'] as const).map(side => ({ src, side })));
  return combos[Math.min(combos.length - 1, Math.floor(rand() * combos.length))];
}

/** Greedy word wrap; the last allowed line ends with … when text is left over. */
export function fitTitle(text: string, measure: (s: string) => number, maxWidth: number, maxLines = 3): string[] {
  // A word wider than the line is split into chunks that fit.
  const words = text.trim().split(/\s+/).filter(Boolean).flatMap(w => {
    if (measure(w) <= maxWidth) return [w];
    const parts: string[] = [];
    let cur = '';
    for (const ch of w) {
      if (cur && measure(cur + ch) > maxWidth) { parts.push(cur); cur = ''; }
      cur += ch;
    }
    return cur ? [...parts, cur] : parts;
  });
  const lines: string[] = [];
  let i = 0;
  while (i < words.length && lines.length < maxLines) {
    let line = words[i++];
    while (i < words.length && measure(`${line} ${words[i]}`) <= maxWidth) line += ` ${words[i++]}`;
    lines.push(line);
  }
  if (i < words.length) {
    let last = lines[lines.length - 1];
    while (last && measure(`${last}…`) > maxWidth) last = last.slice(0, -1).trimEnd();
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}

export function statsLine(stats: TripCardData['stats']): string {
  const parts: string[] = [];
  const { cities: c, places: p, days: d } = stats;
  if (c) parts.push(c === 1 ? $localize`:@@tripCard.city:${c}:n: ciudad` : $localize`:@@tripCard.cities:${c}:n: ciudades`);
  if (p) parts.push(p === 1 ? $localize`:@@tripCard.place:${p}:n: lugar` : $localize`:@@tripCard.places:${p}:n: lugares`);
  if (d) parts.push(daysLabel(d));
  return parts.join(' · ');
}

function daysLabel(d: number): string {
  return d === 1 ? $localize`:@@tripCard.day:${d}:n: día` : $localize`:@@tripCard.days:${d}:n: días`;
}

// ---- canvas drawing (checked in the browser; jsdom has no canvas) ----

const W = 1080, H = 1920, PAD = 90, INNER = W - PAD * 2;
const SERIF = '"Cormorant Garamond", serif';
const SANS = '"DM Sans", sans-serif';
const QR_TILE = 420;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // flagcdn sends ACAO:*, so the canvas stays untainted
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export async function renderTripCard(data: TripCardData, miel: MielPick): Promise<Blob> {
  const css = getComputedStyle(document.documentElement);
  const tok = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const c = {
    lav: tok('--lav', 'oklch(88% .06 290)'), lavD: tok('--lav-d', 'oklch(55% .16 290)'),
    cream: tok('--cream', 'oklch(98% .01 80)'), peach: tok('--peach', 'oklch(91% .07 50)'),
    peachD: tok('--peach-d', 'oklch(62% .15 50)'), t1: tok('--t1', 'oklch(18% .02 270)'),
    t2: tok('--t2', 'oklch(42% .03 270)'), t3: tok('--t3', 'oklch(65% .02 270)'),
    border: tok('--border', 'oklch(88% .015 270)'),
  };

  // Site loads Cormorant 300–500 (+ italic 400) and DM Sans 300–600: draw with those, never a fallback font.
  await Promise.all([
    document.fonts.load(`500 100px ${SERIF}`), document.fonts.load(`italic 400 54px ${SERIF}`),
    document.fonts.load(`600 36px ${SANS}`), document.fonts.load(`500 36px ${SANS}`),
  ]);
  const flagCodes = data.cities.map(x => countryCodeFromFlagEmoji(x.flag));
  const [logo, mielImg, qrCanvas, ...flags] = await Promise.all([
    loadImage('/favicon.svg'),
    loadImage(miel.src),
    import('qrcode').then(QR => QR.toCanvas(data.link, {
      errorCorrectionLevel: 'M', margin: 4, width: QR_TILE - 24, color: { dark: '#000000', light: '#ffffff' },
    })),
    ...flagCodes.map(cc => cc ? loadImage(`https://flagcdn.com/w80/${cc}.png`) : Promise.resolve(null)),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.textBaseline = 'alphabetic';

  // Background: 165deg lav → cream → peach, as in the mockup.
  const g = ctx.createLinearGradient(W * 0.37, 0, W * 0.63, H);
  g.addColorStop(0, c.lav); g.addColorStop(0.52, c.cream); g.addColorStop(1, c.peach);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // 1. Brand header: round TL logo + "Tripilove".
  let y = PAD;
  const LOGO = 78;
  ctx.font = `500 54px ${SERIF}`;
  const tripiW = ctx.measureText('Tripi').width;
  ctx.font = `italic 400 54px ${SERIF}`;
  const loveW = ctx.measureText('love').width;
  let x = (W - (LOGO + 21 + tripiW + loveW)) / 2;
  if (logo) ctx.drawImage(logo, x, y, LOGO, LOGO);
  x += LOGO + 21;
  const brandBase = y + LOGO / 2 + 18;
  ctx.textAlign = 'left';
  ctx.font = `500 54px ${SERIF}`; ctx.fillStyle = c.lavD; ctx.fillText('Tripi', x, brandBase);
  ctx.font = `italic 400 54px ${SERIF}`; ctx.fillStyle = c.peachD; ctx.fillText('love', x + tripiW, brandBase);
  y += LOGO;

  // 2. Author (only with a public username), username in lav-d.
  ctx.textAlign = 'left';
  if (data.author) {
    y += 54 + 36;
    const full = $localize`:@@tripCard.author:El viaje de ${data.author}:author:`;
    const at = full.indexOf(data.author);
    const before = full.slice(0, at), after = full.slice(at + data.author.length);
    ctx.font = `600 36px ${SANS}`;
    const wB = ctx.measureText(before).width, wA = ctx.measureText(data.author).width, wR = ctx.measureText(after).width;
    let ax = (W - wB - wA - wR) / 2;
    ctx.fillStyle = c.t2; ctx.fillText(before, ax, y); ax += wB;
    ctx.fillStyle = c.lavD; ctx.fillText(data.author, ax, y); ax += wA;
    ctx.fillStyle = c.t2; ctx.fillText(after, ax, y);
    y += 18;
  } else {
    y += 54;
  }

  // 3. Title, max 3 lines.
  ctx.textAlign = 'center';
  ctx.font = `500 100px ${SERIF}`;
  ctx.fillStyle = c.t1;
  const LINE = 105;
  for (const line of fitTitle(data.title, s => ctx.measureText(s).width, INNER)) {
    y += LINE;
    ctx.fillText(line, W / 2, y - 22);
  }

  // 4. Stats pill.
  const stats = statsLine(data.stats);
  if (stats) {
    y += 36;
    ctx.font = `600 36px ${SANS}`;
    const pw = ctx.measureText(stats).width + 84, ph = 78;
    roundRect(ctx, (W - pw) / 2, y, pw, ph, ph / 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 4.5; ctx.strokeStyle = c.border; ctx.stroke();
    ctx.fillStyle = c.lavD;
    ctx.fillText(stats, W / 2, y + ph / 2 + 13);
    y += ph;
  }

  // 5. City rows (≤5) + "y N ciudades más".
  if (data.cities.length) {
    y += 54;
    const ROW = 50, GAP = 18, PY = 36, PX = 42;
    const moreH = data.moreCities ? GAP + 40 : 0;
    const bh = PY * 2 + data.cities.length * ROW + (data.cities.length - 1) * GAP + moreH;
    roundRect(ctx, PAD, y, INNER, bh, 54);
    ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.fill();
    ctx.lineWidth = 4.5; ctx.strokeStyle = c.border; ctx.stroke();
    let ry = y + PY;
    data.cities.forEach((city, i) => {
      const fx = PAD + PX, fy = ry + (ROW - 45) / 2;
      const flag = flags[i];
      if (flag) {
        ctx.save();
        roundRect(ctx, fx, fy, 66, 45, 9); ctx.clip();
        ctx.drawImage(flag, fx, fy, 66, 45);
        ctx.restore();
      } else {
        ctx.textAlign = 'center'; ctx.font = `40px ${SANS}`;
        ctx.fillText(city.flag, fx + 33, ry + 40);
      }
      ctx.textAlign = 'left'; ctx.font = `600 42px ${SANS}`; ctx.fillStyle = c.t1;
      ctx.fillText(city.name, fx + 66 + 27, ry + 39);
      if (city.days) {
        ctx.textAlign = 'right'; ctx.font = `600 33px ${SANS}`; ctx.fillStyle = c.t3;
        ctx.fillText(daysLabel(city.days), W - PAD - PX, ry + 37);
      }
      ry += ROW + GAP;
    });
    if (data.moreCities) {
      const n = data.moreCities;
      ctx.textAlign = 'left'; ctx.font = `600 33px ${SANS}`; ctx.fillStyle = c.t2;
      ctx.fillText(n === 1 ? $localize`:@@tripCard.moreCity:y 1 ciudad más`
                           : $localize`:@@tripCard.moreCities:y ${n}:n: ciudades más`, PAD + PX + 93, ry + 22);
    }
  }

  // 8. Site address, 7. phrase, 6. QR tile + Miel — anchored to the bottom.
  ctx.textAlign = 'center';
  const urlBase = H - 78;
  ctx.font = `600 33px ${SANS}`; ctx.fillStyle = c.t2;
  ctx.fillText(data.siteLabel, W / 2, urlBase);
  const phrase = $localize`:@@tripCard.phrase:Crea tu cuenta y llévate este viaje gratis`;
  let size = 45;
  ctx.font = `600 ${size}px ${SANS}`;
  while (size > 30 && ctx.measureText(phrase).width > INNER) ctx.font = `600 ${--size}px ${SANS}`;
  const phraseBase = urlBase - 33 - 21;
  ctx.fillStyle = c.t1;
  ctx.fillText(phrase, W / 2, phraseBase);

  const tileY = phraseBase - size - 36 - QR_TILE, tileX = (W - QR_TILE) / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.07)'; ctx.shadowBlur = 48; ctx.shadowOffsetY = 6;
  roundRect(ctx, tileX, tileY, QR_TILE, QR_TILE, 42);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
  ctx.drawImage(qrCanvas, tileX + 12, tileY + 12, QR_TILE - 24, QR_TILE - 24);

  if (mielImg) {
    const mw = 276, mh = mw * (mielImg.naturalHeight / mielImg.naturalWidth);
    const mx = miel.side === 'left' ? tileX - 12 - mw : tileX + QR_TILE + 12; // never over the tile
    ctx.save();
    if (miel.side === 'right') { ctx.translate(mx + mw, 0); ctx.scale(-1, 1); } // face the QR
    ctx.drawImage(mielImg, miel.side === 'right' ? 0 : mx, tileY + QR_TILE + 18 - mh, mw, mh);
    ctx.restore();
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}

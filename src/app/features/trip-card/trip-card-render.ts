import { TripCardData } from './trip-card-data.util';
import { countryCodeFromFlagEmoji } from '../../shared/flag-icon/flag-emoji.util';
import { FORWARD_PATH, PLANE_ICON_PATH, REVERSE_PATH } from '../about/about-paths';

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
  const { cities: c, places: p, days: d, nights: n } = stats;
  if (c) parts.push(c === 1 ? $localize`:@@tripCard.city:${c}:n: ciudad` : $localize`:@@tripCard.cities:${c}:n: ciudades`);
  if (p) parts.push(p === 1 ? $localize`:@@tripCard.place:${p}:n: lugar` : $localize`:@@tripCard.places:${p}:n: lugares`);
  const stays = staysLabel(d, n);
  if (stays) parts.push(stays);
  return parts.join(' · ');
}

/** "4 días · 3 noches"; a 0 or unknown part is left out. */
export function staysLabel(d: number | null, n: number | null): string {
  const parts: string[] = [];
  if (d) parts.push(d === 1 ? $localize`:@@tripCard.day:${d}:n: día` : $localize`:@@tripCard.days:${d}:n: días`);
  if (n) parts.push(n === 1 ? $localize`:@@tripCard.night:${n}:n: noche` : $localize`:@@tripCard.nights:${n}:n: noches`);
  return parts.join(' · ');
}

// ---- canvas drawing (checked in the browser; jsdom has no canvas) ----

const W = 1080, H = 1920, PAD = 90, INNER = W - PAD * 2;
const SERIF = '"Cormorant Garamond", serif';
const SANS = '"DM Sans", sans-serif';
const QR_TILE = 420;
// ---- background paper planes ----

export type PlaneSlot = { curve: 'forward' | 'reverse'; color: 'lavD' | 'peachD' | 'mintD'; y: number; h: number };

/** One fixed set behind every card, from under the pill (≤ y 705) to above the QR tile (≥ y 1288): never depends on the trip. */
export const PLANE_SLOTS: readonly PlaneSlot[] = (['forward', 'reverse', 'forward'] as const).map((curve, i) => ({
  curve, color: (['lavD', 'peachD', 'mintD'] as const)[i], y: 830 + i * 140, h: 90, // clears a 1-city panel with a 2-line title
}));

// About Us paths live in a 640×120 box: x 60–590, y 20–100. End point and last control point give the plane's heading.
const CURVES = {
  forward: { d: FORWARD_PATH, end: [590, 20], c2: [560, 20] },
  reverse: { d: REVERSE_PATH, end: [60, 20], c2: [90, 20] },
} as const;
const PLANE = 44;

/** Maps a slot's About Us path into the card; the path ends half a plane inside the margins, so the icon never overhangs them. */
function slotMatrix(slot: PlaneSlot): [number, number, number, number] {
  const sx = (INNER - PLANE) / 530, sy = slot.h / 80;
  return [sx, sy, PAD + PLANE / 2 - 60 * sx, slot.y - 20 * sy];
}

export function planeEnd(slot: PlaneSlot): { x: number; y: number; angle: number } {
  const [sx, sy, tx, ty] = slotMatrix(slot);
  const { end, c2 } = CURVES[slot.curve];
  return { x: end[0] * sx + tx, y: end[1] * sy + ty, angle: Math.atan2((end[1] - c2[1]) * sy, (end[0] - c2[0]) * sx) };
}

/** Plane icons that sit clear of the city panel (top/bottom, null = no panel); a solid icon next to row text reads like a glyph (review M1). */
export function planeIconsClearOf(top: number | null, bottom: number | null): readonly PlaneSlot[] {
  if (top === null || bottom === null) return PLANE_SLOTS;
  const reach = PLANE / 2 + 16; // half the icon plus room for its shadow
  return PLANE_SLOTS.filter(p => p.y + reach < top || p.y - reach > bottom);
}

/** Background layer: the dotted paths, on every card, under the panel and the QR tile. */
function drawPlanePaths(ctx: CanvasRenderingContext2D, colors: Record<PlaneSlot['color'], string>): void {
  for (const slot of PLANE_SLOTS) {
    const [sx, sy, tx, ty] = slotMatrix(slot);
    const path = new Path2D();
    path.addPath(new Path2D(CURVES[slot.curve].d), new DOMMatrix([sx, 0, 0, sy, tx, ty])); // scaled path, unscaled line width
    ctx.save();
    ctx.globalAlpha = 0.45; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.setLineDash([2, 12]);
    ctx.strokeStyle = colors[slot.color]; ctx.stroke(path);
    ctx.restore();
  }
}

function drawPlaneIcons(ctx: CanvasRenderingContext2D, slots: readonly PlaneSlot[], colors: Record<PlaneSlot['color'], string>): void {
  for (const slot of slots) {
    const { x, y, angle } = planeEnd(slot);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle);
    ctx.scale(PLANE / 24, PLANE / 24); ctx.translate(-12, -12);
    ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
    ctx.fillStyle = colors[slot.color]; ctx.fill(new Path2D(PLANE_ICON_PATH));
    ctx.restore();
  }
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // flagcdn sends ACAO:*, so the canvas stays untainted
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** qrcode is CommonJS: the optimized build exposes it only as `default`, the dev server and Jest as named exports. */
export async function qrCanvas(text: string, width: number): Promise<HTMLCanvasElement> {
  const mod = await import('qrcode');
  const QR = (mod as unknown as { default?: typeof mod }).default ?? mod;
  return QR.toCanvas(text, { errorCorrectionLevel: 'M', margin: 4, width, color: { dark: '#000000', light: '#ffffff' } });
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
    peachD: tok('--peach-d', 'oklch(62% .15 50)'), mintD: tok('--mint-d', 'oklch(57% .13 160)'), t1: tok('--t1', 'oklch(18% .02 270)'),
    t2: tok('--t2', 'oklch(42% .03 270)'), t3: tok('--t3', 'oklch(65% .02 270)'),
    border: tok('--border', 'oklch(88% .015 270)'),
  };

  // Site loads Cormorant 300–500 (+ italic 400) and DM Sans 300–600: draw with those, never a fallback font.
  await Promise.all([
    document.fonts.load(`500 100px ${SERIF}`), document.fonts.load(`italic 400 54px ${SERIF}`),
    document.fonts.load(`600 36px ${SANS}`), document.fonts.load(`500 36px ${SANS}`),
  ]);
  const flagCodes = data.cities.map(x => countryCodeFromFlagEmoji(x.flag));
  const [logo, mielImg, qr, ...flags] = await Promise.all([
    loadImage('/favicon.svg'),
    loadImage(miel.src),
    qrCanvas(data.link, QR_TILE - 24),
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
  drawPlanePaths(ctx, c); // background layer: the city panel and the QR tile sit on top

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
    let fs = 36;
    ctx.font = `600 ${fs}px ${SANS}`;
    while (fs > 24 && ctx.measureText(stats).width + 84 > INNER) ctx.font = `600 ${--fs}px ${SANS}`; // one line inside the margins
    const pw = ctx.measureText(stats).width + 84, ph = 78;
    roundRect(ctx, (W - pw) / 2, y, pw, ph, ph / 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 4.5; ctx.strokeStyle = c.border; ctx.stroke();
    ctx.fillStyle = c.lavD;
    ctx.fillText(stats, W / 2, y + ph / 2 + fs * 0.36);
    y += ph;
  }

  // 5. City rows (≤5) + "y N ciudades más".
  let panelTop: number | null = null, panelBottom: number | null = null;
  if (data.cities.length) {
    y += 54;
    const ROW = 50, GAP = 18, PY = 36, PX = 42;
    const moreH = data.moreCities ? GAP + 40 : 0;
    const bh = PY * 2 + data.cities.length * ROW + (data.cities.length - 1) * GAP + moreH;
    panelTop = y; panelBottom = y + bh;
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
      const nameX = fx + 66 + 27, daysX = W - PAD - PX;
      let nameEnd = daysX;
      const label = staysLabel(city.days, city.nights);
      if (label) {
        ctx.textAlign = 'right'; ctx.font = `600 33px ${SANS}`; ctx.fillStyle = c.t3;
        ctx.fillText(label, daysX, ry + 37);
        nameEnd -= ctx.measureText(label).width + 24;
      }
      ctx.textAlign = 'left'; ctx.font = `600 42px ${SANS}`; ctx.fillStyle = c.t1;
      ctx.fillText(fitTitle(city.name, s => ctx.measureText(s).width, nameEnd - nameX, 1)[0] ?? '', nameX, ry + 39);
      ry += ROW + GAP;
    });
    if (data.moreCities) {
      const n = data.moreCities;
      ctx.textAlign = 'left'; ctx.font = `600 33px ${SANS}`; ctx.fillStyle = c.t2;
      ctx.fillText(n === 1 ? $localize`:@@tripCard.moreCity:y 1 ciudad más`
                           : $localize`:@@tripCard.moreCities:y ${n}:n: ciudades más`, PAD + PX + 93, ry + 22);
    }
    y += bh;
  }
  drawPlaneIcons(ctx, planeIconsClearOf(panelTop, panelBottom), c); // only in the empty space, never next to row text or flags

  // 8. Site address, 7. phrase, 6. QR tile + Miel — anchored to the bottom.
  const urlBase = H - 78, phraseBase = urlBase - 33 - 21;
  const phrase = $localize`:@@tripCard.phrase:Crea tu cuenta y llévate este viaje gratis`;
  let size = 45;
  ctx.font = `600 ${size}px ${SANS}`;
  while (size > 30 && ctx.measureText(phrase).width > INNER) ctx.font = `600 ${--size}px ${SANS}`;
  const tileY = phraseBase - size - 36 - QR_TILE, tileX = (W - QR_TILE) / 2;
  const mw = 276, mh = mielImg ? mw * (mielImg.naturalHeight / mielImg.naturalWidth) : 0;
  const mielY = tileY + QR_TILE + 18 - mh;

  ctx.textAlign = 'center';
  ctx.font = `600 33px ${SANS}`; ctx.fillStyle = c.t2;
  ctx.fillText(data.siteLabel, W / 2, urlBase);
  ctx.font = `600 ${size}px ${SANS}`; ctx.fillStyle = c.t1;
  ctx.fillText(phrase, W / 2, phraseBase);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.07)'; ctx.shadowBlur = 48; ctx.shadowOffsetY = 6;
  roundRect(ctx, tileX, tileY, QR_TILE, QR_TILE, 42);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
  ctx.drawImage(qr, tileX + 12, tileY + 12, QR_TILE - 24, QR_TILE - 24);

  if (mielImg) {
    const mx = miel.side === 'left' ? tileX - 12 - mw : tileX + QR_TILE + 12; // never over the tile
    ctx.save();
    if (miel.side === 'right') { ctx.translate(mx + mw, 0); ctx.scale(-1, 1); } // face the QR
    ctx.drawImage(mielImg, miel.side === 'right' ? 0 : mx, mielY, mw, mh);
    ctx.restore();
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'));
}

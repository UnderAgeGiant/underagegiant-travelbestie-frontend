export interface TripMapViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The full-world box `TripMapComponent`'s SVG uses when there's nothing to frame. */
const FULL_WORLD_VIEW_BOX: TripMapViewBox = { x: 0, y: 0, width: 100, height: 50 };

/**
 * Never let the framed box get smaller than this width (height follows at
 * width/2 to hold the 2:1 ratio) — the base map is a coarse 110m-resolution
 * outline (`lib/build-world-map-svg.mjs`), so zooming in past a "large
 * region" span starts showing blocky, low-fidelity coastlines instead of
 * anything useful.
 */
const MIN_WIDTH = 10;

/** Padding around the pins' bounding box, as a fraction of its larger span. */
const PAD_FACTOR = 0.25;

/** Absolute minimum padding (in the same SVG units), so a single pin — whose
 * raw bounding box has zero width/height — still gets a real margin. */
const PAD_MIN = 2;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Computes the smallest `viewBox` (in `TripMapComponent`'s shared
 * `0 0 100 50` SVG coordinate space) that frames every given point with
 * some breathing room, always at the same 2:1 width:height ratio as the
 * full-world box — `TripMapComponent`'s container is CSS-locked to that
 * ratio and renders with `preserveAspectRatio="none"`, so a viewBox at any
 * other ratio would stretch the map and pins non-uniformly to fill it.
 *
 * Falls back to the full-world box when there are no points to frame.
 */
export function computeTripMapViewBox(points: { x: number; y: number }[]): TripMapViewBox {
  if (points.length === 0) return FULL_WORLD_VIEW_BOX;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rawWidth = maxX - minX;
  const rawHeight = maxY - minY;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const pad = Math.max(Math.max(rawWidth, rawHeight) * PAD_FACTOR, PAD_MIN);
  let width = rawWidth + pad * 2;
  let height = rawHeight + pad * 2;

  // Enforce the minimum span before fixing the ratio, so a tight cluster
  // never zooms in past the base map's usable resolution.
  width = Math.max(width, MIN_WIDTH);
  height = Math.max(height, MIN_WIDTH / 2);

  // Force back to exactly 2:1 — never let the ratio drift.
  if (width / height > 2) {
    height = width / 2;
  } else if (width / height < 2) {
    width = height * 2;
  }

  // Never zoom out past the full world extent. The box is already exactly
  // 2:1, so clamping width and deriving height from it keeps the ratio
  // intact automatically (100/2 = 50, the full-world height).
  width = Math.min(width, FULL_WORLD_VIEW_BOX.width);
  height = width / 2;

  const x = clamp(centerX - width / 2, 0, FULL_WORLD_VIEW_BOX.width - width);
  const y = clamp(centerY - height / 2, 0, FULL_WORLD_VIEW_BOX.height - height);

  return { x, y, width, height };
}

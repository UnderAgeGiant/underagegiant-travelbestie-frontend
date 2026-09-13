export interface SvgPoint {
  x: number;
  y: number;
}

/**
 * Projects a lat/lng pair into TripMapComponent's shared SVG coordinate space
 * (viewBox="0 0 100 50") via a standard equirectangular (plate carrée)
 * formula. The y-axis spans only 0-50 — half the x-axis's 0-100 range — to
 * preserve the real 360°:180° longitude:latitude aspect ratio. Do not widen
 * it to 0-100, which would vertically stretch every landmass and misplace
 * every city pin relative to the coastlines drawn by
 * lib/build-world-map-svg.mjs (which mirrors this exact formula).
 */
export function latLngToSvgPoint(lat: number, lng: number): SvgPoint {
  return {
    x: (lng + 180) / 360 * 100,
    y: (90 - lat) / 180 * 50,
  };
}

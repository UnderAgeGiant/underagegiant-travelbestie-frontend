// ponytail: regex on the string, not URL(), so Commons' percent-encoding survives untouched.
const WIKI_THUMB_RE = /^(https:\/\/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/thumb\/[^/]+\/[^/]+\/[^/]+)\/(\d+)px-([^/]+)$/;
const WIKI_ORIG_RE = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/([^/]+\/[^/]+)\/([^/]+)$/;
const RASTER_EXT_RE = /\.(jpe?g|png)$/i;

/** Asks Wikimedia for a thumb at `width` px wide. Never upscales; non-Wikimedia urls are returned as-is. */
export function sizedImageUrl(url: string, width: 500 | 960): string {
  const cut = url.search(/[?#]/);
  const base = cut === -1 ? url : url.slice(0, cut);
  const suffix = cut === -1 ? '' : url.slice(cut);

  const thumb = WIKI_THUMB_RE.exec(base);
  if (thumb) {
    return Number(thumb[2]) <= width ? url : `${thumb[1]}/${width}px-${thumb[3]}${suffix}`;
  }

  const orig = WIKI_ORIG_RE.exec(base);
  if (orig && RASTER_EXT_RE.test(orig[3])) {
    return `${orig[1]}/thumb/${orig[2]}/${orig[3]}/${width}px-${orig[3]}${suffix}`;
  }

  return url;
}

export function buildShareLink(shareId: string, origin: string = window.location.origin): string {
  return `${origin}/?share=${shareId}`;
}

export function buildWhatsappUrl(tripName: string, shareId: string, origin: string = window.location.origin, prefix?: string): string {
  const link = buildShareLink(shareId, origin);
  const intro = prefix ?? $localize`:@@share.message:✨ ¡Mira el viaje que armé en Tripilove! 🌍✈️🧳`;
  // Link sits alone on its own line so WhatsApp auto-detects it as a clickable URL.
  const msg = `${intro}\n\n📍 ${tripName}\n\n${link}`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

/**
 * Share a trip through the native OS share sheet (WhatsApp, Telegram, Messages,
 * Mail, Copy…). The link is passed as the structured `url` field so it stays a
 * real clickable link and the emoji in `text` render natively — unlike the
 * `wa.me/?text=` form, which URL-encodes everything into one blob.
 *
 * Falls back to the WhatsApp web link when the Web Share API is unavailable
 * (e.g. some desktop browsers).
 */
export async function shareTrip(tripName: string, shareId: string, origin: string = window.location.origin): Promise<void> {
  const url = buildShareLink(shareId, origin);
  const text = $localize`:@@share.message:✨ ¡Mira el viaje que armé en Tripilove! 🌍✈️🧳`;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: tripName, text, url });
      return;
    } catch (err) {
      // User dismissed the share sheet — nothing more to do.
      if ((err as DOMException)?.name === 'AbortError') return;
      // Any other failure falls through to the WhatsApp fallback below.
    }
  }

  window.open(buildWhatsappUrl(tripName, shareId, origin, text), '_blank', 'noopener,noreferrer');
}

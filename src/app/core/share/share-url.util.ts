/**
 * Builds a real, absolute shareable URL — for clipboard, WhatsApp, and the
 * native OS share sheet, none of which understand an Angular Router UrlTree.
 * Uses the direct /shared/:id path (vercel.json rewrites any non-asset path
 * to index.html, so this loads correctly cold). The legacy /?share=:id
 * query-param form is still accepted on load — see
 * core/routing/share-redirect.util.ts — for links generated before this
 * change, so don't remove that shim even though new links skip it.
 */
export function buildShareLink(shareId: string, origin: string = window.location.origin): string {
  return `${origin}/shared/${shareId}`;
}

const ownMessage   = () => $localize`:@@share.message:✨ ¡Mira el viaje que armé en Tripilove! 🌍✈️🧳`;
const otherMessage = () => $localize`:@@share.messageOther:✨ ¡Mira este viaje en Tripilove! 🌍✈️🧳`;

/** The share text: the owner’s own trip, or someone else’s shared trip (no authorship claim). */
export const shareMessage = (own: boolean): string => (own ? ownMessage() : otherMessage());

export function buildWhatsappUrl(tripName: string, shareId: string, origin: string = window.location.origin, prefix?: string): string {
  const link = buildShareLink(shareId, origin);
  const intro = prefix ?? ownMessage();
  // Link sits alone on its own line so WhatsApp auto-detects it as a clickable URL.
  const msg = `${intro}\n\n📍 ${tripName}\n\n${link}`;
  // api.whatsapp.com/send, not wa.me: wa.me's redirect re-encodes the text and turns every emoji into U+FFFD (QA 2026-10-09).
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
}

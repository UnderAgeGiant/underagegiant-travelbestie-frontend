export function buildShareLink(shareId: string, origin: string = window.location.origin): string {
  return `${origin}/?share=${shareId}`;
}

export function buildWhatsappUrl(tripName: string, shareId: string, origin: string = window.location.origin, prefix?: string): string {
  const link = buildShareLink(shareId, origin);
  const intro = prefix ?? $localize`:@@share.whatsappMessage:✨ ¡Mira el viaje que armé en Tripilove! 🌍✈️🧳`;
  // Link goes on its own line, preceded by whitespace, so WhatsApp auto-detects it as a clickable URL.
  const msg = `${intro}\n\n📍 ${tripName}\n👉 ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

export function openWhatsappShare(tripName: string, shareId: string): void {
  window.open(buildWhatsappUrl(tripName, shareId), '_blank', 'noopener,noreferrer');
}

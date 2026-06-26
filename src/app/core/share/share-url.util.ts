export function buildShareLink(shareId: string, origin: string = window.location.origin): string {
  return `${origin}/?share=${shareId}`;
}

export function buildWhatsappUrl(tripName: string, shareId: string, origin: string = window.location.origin, prefix?: string): string {
  const link = buildShareLink(shareId, origin);
  const msg = (prefix ?? '¡Mira mi viaje que armé en Tripilove! 🌍✈️') + ` ${tripName} — ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

export function openWhatsappShare(tripName: string, shareId: string): void {
  window.open(buildWhatsappUrl(tripName, shareId), '_blank', 'noopener,noreferrer');
}

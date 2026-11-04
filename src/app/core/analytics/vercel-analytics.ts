import { inject, type BeforeSendEvent } from '@vercel/analytics';

/** Only origin + pathname leave the browser — reset tokens, OTP links and ?focus= ids stay local. */
export function stripQuery(event: BeforeSendEvent): BeforeSendEvent {
  const { origin, pathname } = new URL(event.url);
  return { ...event, url: origin + pathname };
}

/** Vercel Web Analytics, production builds only. `mode` is explicit because Angular doesn't define NODE_ENV. */
export function initVercelAnalytics(production: boolean): void {
  if (!production) return;
  inject({ mode: 'production', beforeSend: stripQuery });
}

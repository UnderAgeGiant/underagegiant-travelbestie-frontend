/** Format only — the reserved-word list lives on the backend (src/lib/usernames.ts), which answers 400 USERNAME_NOT_ALLOWED. */
export const USERNAME_RE = /^[a-z0-9_][a-z0-9_.]{1,48}[a-z0-9_]$/;
export const isUsernameFormatValid = (u: string): boolean => u.length <= 50 && USERNAME_RE.test(u) && !u.includes('..');

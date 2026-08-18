export type PasswordStrength = 'none' | 'vulnerable' | 'light' | 'strong';

/** Length + character-class scoring shared by the register and profile-edit password forms. */
export function computePasswordStrength(password: string): PasswordStrength {
  if (!password) return 'none';
  let score = 0;
  if (password.length >= 8)          score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[a-z]/.test(password))        score++;
  if (/\d/.test(password))           score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length < 6) return 'vulnerable';
  if (score <= 2)          return 'vulnerable';
  if (score === 3)         return 'light';
  return 'strong';
}

export function passwordStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'vulnerable': return 'oklch(55% 0.22 25)';
    case 'light':      return 'oklch(62% 0.14 60)';
    case 'strong':     return 'oklch(50% 0.16 145)';
    default:           return 'var(--t3)';
  }
}

export function isPasswordStrengthBarActive(strength: PasswordStrength, index: number): boolean {
  switch (strength) {
    case 'vulnerable': return index === 0;
    case 'light':      return index <= 1;
    case 'strong':     return true;
    default:           return false;
  }
}

import { readFileSync, writeFileSync } from 'fs';

const filePath = 'src/environments/environment.production.ts';
let content = readFileSync(filePath, 'utf8');

const apiUrl          = process.env.BACKEND_API_URL        ?? 'https://your-backend.vercel.app';
const useMocks        = process.env.BACKEND_USE_MOCKS      === 'true';
const rsaPublicKey    = process.env.BACKEND_RSA_PUBLIC_KEY ?? '';
const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY    ?? '';

function replace(src, placeholder, value) {
  if (!src.includes(placeholder)) {
    throw new Error(`patch-env: placeholder "${placeholder}" not found in ${filePath}`);
  }
  return src.replace(placeholder, value);
}

content = replace(content, 'BACKEND_API_URL_PLACEHOLDER',  apiUrl);
content = replace(content, 'RSA_PUBLIC_KEY_PLACEHOLDER',    rsaPublicKey);
content = replace(content, 'TURNSTILE_SITE_KEY_PLACEHOLDER', turnstileSiteKey);
content = replace(content, 'useMocks: false',               `useMocks: ${useMocks}`);

writeFileSync(filePath, content, 'utf8');
console.log(`patch-env: apiUrl=${apiUrl}, useMocks=${useMocks}, rsaPublicKey=${rsaPublicKey ? '[set]' : '[EMPTY]'}, turnstileSiteKey=${turnstileSiteKey ? '[set]' : '[EMPTY — set TURNSTILE_SITE_KEY in Vercel]'}`);

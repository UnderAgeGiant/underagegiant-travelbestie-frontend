import { readFileSync, writeFileSync, existsSync } from 'fs';

// Load local.env as dotenv fallback (env vars always take precedence).
// local.env is gitignored and never deployed — safe to keep real keys there.
if (existsSync('local.env')) {
  for (const line of readFileSync('local.env', 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}

const filePath = 'src/environments/environment.production.ts';
let content = readFileSync(filePath, 'utf8');

const apiUrl           = process.env.BACKEND_API_URL        ?? 'https://your-backend.vercel.app';
const useMocks         = process.env.BACKEND_USE_MOCKS      === 'true';
const rsaPublicKey     = process.env.BACKEND_RSA_PUBLIC_KEY ?? '';
const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY     ?? '';
const paypalClientId   = process.env.PAYPAL_CLIENT_ID       ?? '';

function replace(src, placeholder, value) {
  if (!src.includes(placeholder)) {
    throw new Error(`patch-env: placeholder "${placeholder}" not found in ${filePath}`);
  }
  return src.replace(placeholder, value);
}

content = replace(content, 'BACKEND_API_URL_PLACEHOLDER',   apiUrl);
content = replace(content, 'RSA_PUBLIC_KEY_PLACEHOLDER',     rsaPublicKey);
content = replace(content, 'TURNSTILE_SITE_KEY_PLACEHOLDER', turnstileSiteKey);
content = replace(content, 'PAYPAL_CLIENT_ID_PLACEHOLDER',   paypalClientId);
content = replace(content, 'useMocks: false',                `useMocks: ${useMocks}`);

writeFileSync(filePath, content, 'utf8');
console.log(`patch-env: apiUrl=${apiUrl}, useMocks=${useMocks}, rsaPublicKey=${rsaPublicKey ? '[set]' : '[EMPTY]'}, turnstileSiteKey=${turnstileSiteKey ? '[set]' : '[EMPTY — set TURNSTILE_SITE_KEY in Vercel]'}, paypalClientId=${paypalClientId ? '[set]' : '[EMPTY — set PAYPAL_CLIENT_ID in Vercel]'}`);

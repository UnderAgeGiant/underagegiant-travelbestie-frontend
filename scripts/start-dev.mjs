import { readFileSync, writeFileSync, existsSync } from 'fs';
import { spawn } from 'child_process';

const ENV_FILE  = 'src/environments/environment.ts';
const LOCAL_ENV = 'local.env';

function parseEnvFile(path) {
  const vars = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const original = readFileSync(ENV_FILE, 'utf8');
let env = {};

if (existsSync(LOCAL_ENV)) {
  env = parseEnvFile(LOCAL_ENV);
  console.log(`start-dev: loaded ${LOCAL_ENV}`);
} else {
  console.warn(`start-dev: ${LOCAL_ENV} not found — using environment.ts defaults. Copy local.env.example → local.env`);
}

let patched = original;
if (env.BACKEND_API_URL)                  patched = patched.replace(/apiUrl:\s*'[^']*'/,           `apiUrl: '${env.BACKEND_API_URL}'`);
if (env.BACKEND_USE_MOCKS)                patched = patched.replace(/useMocks:\s*(true|false)/,     `useMocks: ${env.BACKEND_USE_MOCKS === 'true'}`);
if (env.BACKEND_RSA_PUBLIC_KEY != null)   patched = patched.replace(/rsaPublicKey:\s*'[^']*'/,      `rsaPublicKey: '${env.BACKEND_RSA_PUBLIC_KEY}'`);
if (env.TURNSTILE_SITE_KEY)               patched = patched.replace(/turnstileSiteKey:\s*'[^']*'/, `turnstileSiteKey: '${env.TURNSTILE_SITE_KEY}'`);
if (env.AUTOSAVE_INTERVAL_MS) {
  const autoSaveIntervalMs = Number(env.AUTOSAVE_INTERVAL_MS);
  if (Number.isFinite(autoSaveIntervalMs)) {
    patched = patched.replace(/autoSaveIntervalMs:\s*[\d_]+(?:\s*\*\s*[\d_]+)*/, `autoSaveIntervalMs: ${autoSaveIntervalMs}`);
  } else {
    console.warn(`start-dev: ignoring non-numeric AUTOSAVE_INTERVAL_MS "${env.AUTOSAVE_INTERVAL_MS}"`);
  }
}

if (patched !== original) {
  writeFileSync(ENV_FILE, patched, 'utf8');
  console.log('start-dev: patched environment.ts');
}

// Forward any extra CLI args, e.g. --configuration=en-US
const child = spawn('npx', ['ng', 'serve', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
});

child.on('close', code => {
  if (patched !== original) {
    writeFileSync(ENV_FILE, original, 'utf8');
    console.log('start-dev: restored environment.ts');
  }
  process.exit(code ?? 0);
});

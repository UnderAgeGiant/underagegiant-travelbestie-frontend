import { readFileSync, writeFileSync } from 'fs';

const filePath = 'src/environments/environment.production.ts';
let content = readFileSync(filePath, 'utf8');

const apiUrl = process.env.VITE_API_URL ?? 'https://your-backend.vercel.app';
const useMocks = process.env.VITE_USE_MOCKS === 'true';

content = content.replace('VITE_API_URL_PLACEHOLDER', apiUrl);
content = content.replace('useMocks: false', `useMocks: ${useMocks}`);

writeFileSync(filePath, content, 'utf8');
console.log(`Patched environment.production.ts: apiUrl=${apiUrl}, useMocks=${useMocks}`);

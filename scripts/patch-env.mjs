import { readFileSync, writeFileSync } from 'fs';

const filePath = 'src/environments/environment.production.ts';
let content = readFileSync(filePath, 'utf8');

const apiUrl       = process.env.BACKEND_API_URL       ?? 'https://your-backend.vercel.app';
const useMocks     = process.env.BACKEND_USE_MOCKS     === 'true';
const rsaPublicKey = process.env.BACKEND_RSA_PUBLIC_KEY ?? '';

content = content.replace('BACKEND_API_URL_PLACEHOLDER', apiUrl);
content = content.replace('RSA_PUBLIC_KEY_PLACEHOLDER', rsaPublicKey);
content = content.replace('useMocks: false',            `useMocks: ${useMocks}`);

writeFileSync(filePath, content, 'utf8');
console.log(`Patched environment.production.ts: apiUrl=${apiUrl}, useMocks=${useMocks}, rsaPublicKey=${rsaPublicKey ? '[set]' : '[empty]'}`);

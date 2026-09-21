/** @jest-environment node */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as ts from 'typescript';

// Regression guard for the 2026-09-21 production incident: Vercel compiles api/*.ts with the nearest tsconfig.
// If api/tsconfig.json disappears (or stops emitting CommonJS), the functions ship as ESM into a CJS package
// and crash at load with FUNCTION_INVOCATION_FAILED.
describe('api/tsconfig.json', () => {
  const raw = ts.readConfigFile(join(process.cwd(), 'api', 'tsconfig.json'), p => readFileSync(p, 'utf8'));

  it('parses', () => expect(raw.error).toBeUndefined());

  it('emits CommonJS for a package without "type": "module"', () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    expect(pkg.type).toBeUndefined();

    const parsed = ts.parseJsonConfigFileContent(raw.config, ts.sys, join(process.cwd(), 'api'));
    const out = ts.transpileModule(
      `import { x } from '../src/edge/x';\nexport async function GET() { return x; }`,
      { compilerOptions: parsed.options, fileName: join(process.cwd(), 'api', 'probe.ts') },
    ).outputText;
    expect(out).toContain('exports.GET = GET');
    expect(out).toContain('require("../src/edge/x")');
    expect(out).not.toMatch(/^\s*(import|export)\s/m);
  });
});

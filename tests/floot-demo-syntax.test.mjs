import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const names = [
  '../floot-collection/demo.mjs',
  '../floot-collection/collection-model.mjs',
  '../floot-collection/collection-insights.mjs',
  '../floot-collection/collection-reconciliation.mjs',
  '../floot-collection/collection-export.mjs',
  '../e2e/binder-demo.spec.mjs',
  '../e2e/binder-accessibility.spec.mjs',
];

for (const relative of names) {
  test(`syntaxe JavaScript ESM valide : ${relative}`, () => {
    const pathname = fileURLToPath(new URL(relative, import.meta.url));
    let error = null;
    try {
      execFileSync(process.execPath, ['--check', pathname], {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 10_000,
      });
    } catch (caught) {
      error = caught;
    }
    assert.equal(error, null, error?.stderr?.toString() || error?.message);
  });
}

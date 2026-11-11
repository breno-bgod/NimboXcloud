'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
test('static risk report is valid JSON with traceable line numbers', () => {
  const root = path.join(__dirname, '..');
  const run = spawnSync(process.execPath, ['tools/static-risk-report.cjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const result = JSON.parse(run.stdout);
  assert.equal(result.schema, 'nimboxcloud.static-risk.v1');
  assert.ok(Array.isArray(result.findings));
  for (const finding of result.findings) {
    assert.ok(Number.isInteger(finding.line) && finding.line > 0);
    assert.match(finding.id, /^[a-z-]+$/);
  }
});

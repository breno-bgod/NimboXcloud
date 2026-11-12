'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
test('static risk report is valid JSON with traceable line numbers', () => {
  const root = path.join(__dirname, '..');
  // Execute the actual CLI body without requiring permission to spawn a process.
  const filename = path.join(root, 'tools', 'static-risk-report.cjs');
  let stdout = '';
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    require, __dirname: path.dirname(filename),
    process: { stdout: { write(chunk) { stdout += chunk; } } }
  }, { filename });
  const result = JSON.parse(stdout);
  assert.equal(result.schema, 'nimboxcloud.static-risk.v1');
  assert.ok(Array.isArray(result.findings));
  for (const finding of result.findings) {
    assert.ok(Number.isInteger(finding.line) && finding.line > 0);
    assert.match(finding.id, /^[a-z-]+$/);
  }
});


#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'NimboXcloud.user.js'), 'utf8');
const lines = src.split(/\r?\n/);
const rules = [
  ['pointer-lock-override', /Element\.prototype\.requestPointerLock\s*=/],
  ['gamepad-override', /navigator\.getGamepads\s*=|Object\.defineProperty\(\s*navigator\s*,\s*['"]getGamepads/],
  ['xhr-send-override', /XMLHttpRequest\.prototype\.send\s*=/],
  ['xhr-open-override', /XMLHttpRequest\.prototype\.open\s*=/],
  ['fetch-override', /(?:window|globalThis)\.fetch\s*=/],
  ['history-override', /history\.(?:pushState|replaceState)\s*=/],
];
const findings = rules.flatMap(([id, re]) => lines.flatMap((line, i) => re.test(line) ? [{ id, line: i + 1 }] : []));
const result = {
  schema: 'nimboxcloud.static-risk.v1',
  version: (src.match(/^\/\/ @version\s+(\S+)/m) || [])[1] || 'unknown',
  note: 'Static pattern matching only; not evidence of runtime failure or real-browser testing.',
  findings
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');

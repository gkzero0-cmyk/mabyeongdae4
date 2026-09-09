const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'application-field-ui.js'), 'utf8');

test('classification header is displayed as 신청분야', () => {
  assert.equal(html.includes('<th class="type">신청분야</th>'), true);
});

test('criterion-file labels are simplified', () => {
  assert.equal(ui.includes('병사|간부|미분류'), true);
  assert.equal(ui.includes('option.textContent = match[1]'), true);
  assert.equal(ui.includes('MutationObserver'), true);
});

test('UI helper is loaded after app.js with a new cache version', () => {
  assert.equal(html.includes('./application-field-ui.js?v=20260910c'), true);
});

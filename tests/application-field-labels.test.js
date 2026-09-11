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

test('internal unknown classification is presented to users as 행정병', () => {
  assert.equal(ui.includes('행정병'), true);
  assert.equal(ui.includes('미분류'), true);
  assert.equal(ui.includes('MutationObserver'), true);
  assert.match(html, /id="unknownFilterBtn"[^>]*>행정병</);
});

test('UI helper is loaded after app.js with a fresh cache version', () => {
  assert.equal(html.includes('./application-field-ui.js?v=20260911a'), true);
  assert.ok(html.indexOf('./application-field-ui.js?v=20260911a') > html.indexOf('./app.js'));
});

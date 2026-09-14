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

test('administrative soldier is not exposed as its own classification or application-field label', () => {
  assert.equal(html.includes('id="unknownFilterBtn"'), false);
  assert.equal(ui.includes('행정병'), false);
  assert.equal(ui.includes('미분류'), false);
});

test('UI helper is loaded after app.js with a fresh cache version', () => {
  assert.equal(html.includes('./application-field-ui.js?v=20260914a'), true);
  assert.ok(html.indexOf('./application-field-ui.js?v=20260914a') > html.indexOf('./app.js'));
});

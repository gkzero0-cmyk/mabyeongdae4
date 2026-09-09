const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('experienced card replaces top-UP card and sits between officer and free-pass cards', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /현재 1위 UP/u);
  const officer = html.indexOf('id="officerCount"');
  const experienced = html.indexOf('<span>경력자</span><strong id="topUp"');
  const pass = html.indexOf('id="passCount"');
  assert.ok(officer >= 0 && experienced > officer && pass > experienced);
});

test('applicant details assets are wired into the page', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /applicant-details\.css/);
  assert.match(html, /applicant-details\.js/);
  assert.match(html, /applicant-details-ui\.js/);
});

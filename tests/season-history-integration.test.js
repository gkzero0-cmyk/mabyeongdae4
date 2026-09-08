const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

test('past season filters are exposed in the controls', () => {
  const html = read('index.html');
  for (const id of ['season1FilterBtn', 'season2FilterBtn', 'season3FilterBtn']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /이전 참가/);
});

test('app renders combined past-season badges and filters by selected season', () => {
  const js = read('app.js');
  assert.match(js, /seasonFilter/);
  assert.match(js, /getMabyeongdaeSeasons/);
  assert.match(js, /hasMabyeongdaeSeason/);
  assert.match(js, /season-history-badge/);
  assert.match(js, /마\$\{seasonFilter\}/);
});

test('past season badges and filters use the requested #ffd700 gold color', () => {
  const css = read('styles.css').toLowerCase();
  assert.match(css, /#ffd700/);
  assert.match(css, /season-history-badge/);
  assert.match(css, /season-filter/);
});

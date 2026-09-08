const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

test('index identifies the site and source post', () => {
  const html = read('index.html');
  assert.match(html, /마병대 4 실시간 UP 랭킹/);
  assert.match(html, /https:\/\/www\.sooplive\.com\/station\/devil0108\/post\/206507027/);
  assert.match(html, /id="newApplicantCount"/);
});

test('index exposes sorting, applicant, favorite and free-pass include\/exclude filters', () => {
  const html = read('index.html');
  for (const id of ['favoriteFilterBtn', 'soldierFilterBtn', 'officerFilterBtn', 'passFilterBtn', 'excludedFilterBtn']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /data-sort="up"/);
  assert.match(html, /data-sort="newest"/);
  assert.match(html, /data-sort="oldest"/);
});

test('index wires split assets and settings import\/export controls', () => {
  const html = read('index.html');
  assert.match(html, /href="\.\/styles\.css"/);
  assert.match(html, /src="\.\/ranking-utils\.js"/);
  assert.match(html, /src="\.\/app\.js"/);
  assert.match(html, /id="exportSettingsBtn"/);
  assert.match(html, /id="importSettingsInput"/);
});

test('app renders station profile avatars, rank movement and classification controls', () => {
  const js = read('app.js');
  assert.match(js, /profile\.img\.sooplive\.co\.kr/);
  assert.match(js, /rank-change/);
  assert.match(js, /applicant-type-select/);
  assert.doesNotMatch(js, /pass-state-btn/);
  assert.match(js, /free-pass-badge/);
  assert.match(js, /comment-toggle-btn/);
  assert.match(js, /localStorage/);
  assert.match(js, /REFRESH_MS\s*=\s*1000/);
});

test('index replaces the 100th cutoff with total and average UP cards', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /100위 커트라인/);
  assert.doesNotMatch(html, /id="cutUp"/);
  assert.match(html, /id="totalUp"/);
  assert.match(html, /id="averageUp"/);
});

test('table no longer has a manual free-pass column and comments default to compact expand controls', () => {
  const html = read('index.html');
  const js = read('app.js');
  const css = read('styles.css');
  assert.doesNotMatch(html, /<th class="pass-col">프리패스<\/th>/);
  assert.doesNotMatch(js, /100위 커트라인/);
  assert.match(js, /프리패스 포함/);
  assert.match(js, /프리패스 제외/);
  assert.match(js, /더보기/);
  assert.match(js, /접기/);
  assert.match(css, /text-overflow:ellipsis/);
  assert.match(css, /comment-text\.collapsed/);
});

test('app renders New badge next to applicants written today', () => {
  const js = read('app.js');
  const css = read('styles.css');
  assert.match(js, /isKstToday/);
  assert.match(js, /new-badge/);
  assert.match(js, />New<|>NEW</);
  assert.match(css, /\.new-badge/);
});

test('classification and personal filters use requested semantic colors', () => {
  const js = read('app.js');
  const css = read('styles.css');
  assert.match(js, /type-soldier/);
  assert.match(js, /type-officer/);
  assert.match(css, /--orange:/);
  assert.match(css, /--purple:/);
  assert.match(css, /#soldierFilterBtn\{color:var\(--green\)/);
  assert.match(css, /#officerFilterBtn\{color:var\(--orange\)/);
  assert.match(css, /filter-btn\.favorite\{color:var\(--yellow\)/);
  assert.match(css, /filter-btn\.pass[^}]*color:var\(--purple\)/);
  assert.match(css, /free-pass-badge[^}]*color:[^}]*purple|free-pass-badge[^}]*var\(--purple\)/);
  assert.match(css, /type-soldier[^}]*var\(--green\)/);
  assert.match(css, /type-officer[^}]*var\(--orange\)/);
});

test('rank movement persists in local storage and is reused for 24 hours', () => {
  const js = read('app.js');
  assert.match(js, /rankChanges:\s*'mabyeongdae4-up-ranking:rank-changes:v1'/);
  assert.match(js, /readRankChangeHistory\(localStorage\.getItem\(STORAGE\.rankChanges\)\)/);
  assert.match(js, /recordRankChange/);
  assert.match(js, /getActiveRankChange/);
  assert.match(js, /localStorage\.setItem\(STORAGE\.rankChanges/);
  assert.doesNotMatch(js, /rankChanges\s*=\s*nextChanges/);
});

test('new applicant counter is clickable and filters to KST today applicants', () => {
  const html = read('index.html');
  const js = read('app.js');
  const css = read('styles.css');
  assert.match(html, /<button[^>]+id="newApplicantFilterBtn"[^>]*>[^<]*새로운 신청자/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(js, /newApplicantsOnly/);
  assert.match(js, /newApplicantFilter/);
  assert.match(js, /newApplicantsOnly\s*&&\s*!isKstToday\(item\.regDate\)/);
  assert.match(js, /newApplicantsOnly\s*=\s*!newApplicantsOnly/);
  assert.match(js, /새로운 신청자/);
  assert.match(css, /badge-live\.active/);
});

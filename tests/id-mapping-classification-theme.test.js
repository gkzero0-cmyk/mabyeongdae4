const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const utils = require('../ranking-overrides');

test('SOOP station ID mapping from workbook adds verified season badges', () => {
  assert.equal(Object.keys(utils.SOOP_SEASON_ID_MAP || {}).length, 42);
  assert.deepEqual(utils.getMabyeongdaeSeasons({ userId: 'devil0108', userNick: '새닉네임', comment: '' }), [1, 2, 3]);
  assert.deepEqual(utils.getMabyeongdaeSeasons({ userId: 'bach023', userNick: '울...', comment: '' }), [2, 3]);
  assert.deepEqual(utils.getMabyeongdaeSeasons({ userId: 'chunbongtv', userNick: '다른표시명', comment: '' }), [3]);
  assert.deepEqual(utils.getMabyeongdaeSeasons({ userId: 'hwt1014', userNick: '황원태', comment: '' }), [1, 2, 3]);
});

test('verified station ID seasons merge with name and comment history', () => {
  assert.deepEqual(
    utils.getMabyeongdaeSeasons({ userId: 'bach023', userNick: '울산큰고래', comment: '마병대 1 참가 경험 있습니다.' }),
    [1, 2, 3]
  );
});

test('explicit application fields accept slash separators and win over pepper text', () => {
  assert.equal(utils.detectApplicantType('신청분야/ 병사 마크서버 경험 있습니다.'), 'soldier');
  assert.equal(utils.detectApplicantType('신청 분야 / 훈병 지원합니다.'), 'soldier');
  assert.equal(utils.detectApplicantType('지원분야/ 훈련병'), 'soldier');
  assert.equal(utils.detectApplicantType('신청분야/ 병사 후추하겠습니다!'), 'soldier');
  assert.equal(utils.detectApplicantType('지원 분야/ 간부 후추 가능합니다.'), 'officer');
});

test('settings transfer controls are hidden and theme toggle is visible', () => {
  const html = read('index.html');
  assert.match(html, /id="exportSettingsBtn"[^>]*hidden|hidden[^>]*id="exportSettingsBtn"/);
  assert.match(html, /for="importSettingsInput"[^>]*hidden|hidden[^>]*for="importSettingsInput"/);
  assert.match(html, /id="themeToggleBtn"/);
  assert.match(html, /aria-pressed="false"/);
});

test('theme choice persists and light theme has dedicated styles', () => {
  const js = read('app.js');
  const css = `${read('styles.css')}\n${read('layout-fixes.css')}`;
  assert.match(js, /theme:\s*'mabyeongdae4-up-ranking:theme:v1'/);
  assert.match(js, /document\.documentElement\.dataset\.theme/);
  assert.match(js, /localStorage\.setItem\(STORAGE\.theme/);
  assert.match(js, /themeToggleBtn/);
  assert.match(css, /\[data-theme="light"\]/);
  assert.match(css, /color-scheme:\s*light/);
});

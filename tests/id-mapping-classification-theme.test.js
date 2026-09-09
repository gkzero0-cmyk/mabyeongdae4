const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const utils = require('../ranking-overrides');

test('SOOP station ID mapping from updated workbook adds verified season badges', () => {
  // updated workbook: 170 ready=Y rows collapse to 169 unique SOOP IDs
  // because miome3 appears under two historical display names and must union seasons 2+3.
  assert.equal(Object.keys(utils.SOOP_SEASON_ID_MAP || {}).length, 169);
  assert.deepEqual(utils.getMabyeongdaeSeasons({ userId: 'devil0108', userNick: '새닉네임', comment: '' }), [1, 2, 3]);
  assert.deepEqual(utils.getMabyeongdaeSeasons({ userId: 'rose0957', userNick: '다른표시명', comment: '' }), [1]);
  assert.deepEqual(utils.getMabyeongdaeSeasons({ userId: 'nmohoho', userNick: '달묘_', comment: '' }), [2, 3]);
  assert.deepEqual(utils.getMabyeongdaeSeasons({ userId: 'heda221112', userNick: '헤다ㆍ', comment: '' }), [2]);
  assert.deepEqual(utils.getMabyeongdaeSeasons({ userId: 'bureu2002', userNick: '부르', comment: '' }), [3]);
  assert.deepEqual(utils.getMabyeongdaeSeasons({ userId: 'miome3', userNick: '고미호♡', comment: '' }), [2, 3]);
  assert.deepEqual(utils.getMabyeongdaeSeasons({ userId: 'chunbongtv', userNick: '다른표시명', comment: '' }), [3]);
});

test('updated mapping asset is cache-busted in the browser', () => {
  const html = read('index.html');
  assert.match(html, /src="\.\/ranking-overrides\.js\?v=20260909f"/);
});

test('verified workbook station ID is authoritative over conflicting comment history', () => {
  assert.deepEqual(
    utils.getMabyeongdaeSeasons({ userId: 'bach023', userNick: '울산큰고래', comment: '마병대 1 참가 경험 있습니다.' }),
    [2, 3]
  );

  assert.deepEqual(
    utils.getMabyeongdaeSeasons({
      userId: 'heda221112',
      userNick: '헤다ㆍ',
      comment: '병사 / 마병대 1회 경험 有. 저번 마병대 참여 시 방송적으로 성장하고 싶다고 신청했습니다.'
    }),
    [2]
  );

  assert.deepEqual(
    utils.getMabyeongdaeSeasons({
      userId: 'chiy0u',
      userNick: '치유+',
      comment: '마병대1(면회만 했음), 마병대2(과호흡) 참가. 마병대3을 과호흡의 두려움으로 참가를 피했습니다.'
    }),
    [2]
  );
});

test('unverified station IDs can still use explicit self-reported history fallback', () => {
  assert.deepEqual(
    utils.getMabyeongdaeSeasons({ userId: 'not-in-workbook', userNick: '새신청자', comment: '마병대 1, 3 참가 경험 있습니다.' }),
    [1, 3]
  );
});

test('explicit application fields accept slash separators and win over pepper text', () => {
  assert.equal(utils.detectApplicantType('신청분야/ 병사 마크서버 경험 있습니다.'), 'soldier');
  assert.equal(utils.detectApplicantType('신청 분야 / 훈병 지원합니다.'), 'soldier');
  assert.equal(utils.detectApplicantType('지원분야/ 훈련병'), 'soldier');
  assert.equal(utils.detectApplicantType('신청분야/ 병사 후추하겠습니다!'), 'soldier');
  assert.equal(utils.detectApplicantType('지원 분야/ 간부 후추 가능합니다.'), 'officer');
});

test('settings transfer controls are absent and theme toggle is visible', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /exportSettingsBtn|importSettingsInput|설정 내보내기|설정 불러오기/);
  assert.match(html, /id="themeToggleBtn"/);
  assert.match(html, /aria-pressed="false"/);
});

test('theme choice persists and light theme has dedicated styles', () => {
  const html = read('index.html');
  const js = read('theme.js');
  const css = `${read('styles.css')}\n${read('layout-fixes.css')}`;
  assert.match(html, /<script src="\.\/theme\.js\?v=[^"]+"><\/script>/);
  assert.match(js, /mabyeongdae4-up-ranking:theme:v1/);
  assert.match(js, /document\.documentElement\.dataset\.theme/);
  assert.match(js, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(js, /themeToggleBtn/);
  assert.match(css, /\[data-theme="light"\]/);
  assert.match(css, /color-scheme:\s*light/);
});

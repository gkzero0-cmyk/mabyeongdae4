const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function loadUtils() {
  for (const mod of ['../ranking-utils','../applicant-types-v3','../ranking-overrides','../comment-edit-classification']) {
    delete require.cache[require.resolve(mod)];
  }
  return require('../comment-edit-classification');
}

test('explicit administrative soldier is represented by the internal unknown/admin category', () => {
  const utils = loadUtils();
  assert.equal(utils.resolveApplicantType({ userId:'new-admin', comment:'행정병 신청합니다 / 서버A / 열심히 하겠습니다' }), 'unknown');
  assert.equal(utils.resolveApplicantType({ userId:'new-mix', comment:'병사 OR 행정병 / 서버B / 오래 방송하겠습니다' }), 'unknown');
  assert.equal(utils.resolveApplicantType({ userId:'new-officer-mix', comment:'간부 or 행정병 / 서버C / 재미있게 하겠습니다' }), 'unknown');
});

test('season badges use only verified SOOP ID history and never self-reported fallback history', () => {
  const utils = loadUtils();
  assert.deepEqual(utils.getMabyeongdaeSeasons({ userId:'tadka56', userNick:'양지랖', comment:'마병대 3 참가했습니다' }), []);
  assert.deepEqual(utils.getMabyeongdaeSeasons({ userId:'gofl2237', userNick:'해리', comment:'' }), [1,2,3]);
  assert.deepEqual(utils.getMabyeongdaeSeasons({ userId:'bach023', userNick:'울산큰고래', comment:'' }), [2,3]);
  assert.deepEqual(utils.getMabyeongdaeSeasons({ userId:'015234', userNick:'아눙', comment:'' }), [2]);
});

test('slash-delimited application comments map first three sections to role, experience, and reason', () => {
  const details = require('../applicant-details.js');
  const parsed = details.parseApplicantComment('간부&행정병 / 빙고게임 / 저마크개잘하구요재밌습니다 /');
  assert.equal(parsed.minecraftExperience, '빙고게임');
  assert.equal(parsed.reason, '저마크개잘하구요재밌습니다');
});

test('paragraph-delimited application comments map sections after the role line', () => {
  const details = require('../applicant-details.js');
  const parsed = details.parseApplicantComment('병사 신청합니다\n\n레오펠, 다이아랜딩\n\n끝까지 열심히 하겠습니다');
  assert.equal(parsed.minecraftExperience, '레오펠, 다이아랜딩');
  assert.equal(parsed.reason, '끝까지 열심히 하겠습니다');
});

test('administrative soldier is exposed as a blue UI label without changing the internal storage key', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const ui = fs.readFileSync(path.join(__dirname, '..', 'application-field-ui.js'), 'utf8');
  const css = fs.existsSync(path.join(__dirname, '..', 'admin-history-overrides.css'))
    ? fs.readFileSync(path.join(__dirname, '..', 'admin-history-overrides.css'), 'utf8') : '';
  assert.match(html, /id="unknownFilterBtn"[^>]*>행정병</);
  assert.match(ui, /행정병/);
  assert.match(css, /#unknownFilterBtn/);
  assert.match(css.toLowerCase(), /var\(--blue\)|#6e8dff|#506ef0/);
});

test('history summary entry point and grouped season lists exist', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const detailUi = fs.readFileSync(path.join(__dirname, '..', 'applicant-details-ui.js'), 'utf8');
  assert.match(html, /id="historySummaryBtn"/);
  assert.match(html, />마병대 경력</);
  assert.match(detailUi, /마병대 1/);
  assert.match(detailUi, /마병대 2/);
  assert.match(detailUi, /마병대 3/);
  assert.match(detailUi, /1·2·3 전부 참가/);
  assert.match(detailUi, /2·3 참가/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const utils = require('../ranking-overrides');

test('soldier markers with emoji classify as soldier and mixed officer/admin field stays unknown', () => {
  assert.equal(utils.detectApplicantType('반타 신청합니다! 방송부스 준비되어있습니다! 🍉 병 🍉 마크 경력 있습니다.'), 'soldier');
  assert.equal(utils.detectApplicantType('신청 분야: 🍉 병사 / 마크서버 경험 있습니다.'), 'soldier');
  assert.equal(utils.detectApplicantType('신청 분야: 간부 OR 행정병 / 마크서버 경험 있습니다.'), 'unknown');
  assert.equal(utils.detectApplicantType('지원분야: 간부 또는 병사 / 열심히 하겠습니다.'), 'unknown');
});

test('achievement-style and decorated-name history resolves the correct seasons', () => {
  assert.deepEqual(
    utils.getMabyeongdaeSeasons({
      userId: 'nmohoho',
      userNick: '달묘_',
      comment: '신청분야 : 병사 / 마크서버경험 : 마병대 2,3 준우승 / 열심히 하겠습니다.'
    }),
    [2, 3]
  );
  assert.deepEqual(utils.getMabyeongdaeSeasons({ userId: 'heda221112', userNick: '헤다_', comment: '' }), [2]);
});

test('verified station ID takes priority over a misleading display nickname', () => {
  assert.deepEqual(
    utils.getMabyeongdaeSeasons({ userId: 'bach023', userNick: '니니', comment: '' }),
    [2, 3]
  );
});

test('free-pass exclusion ranking is recalculated from one', () => {
  assert.equal(typeof utils.rankApplicants, 'function');
  const ranked = utils.rankApplicants([
    { userNick: '니니', userId: 'free', up: 500, regDate: '2026-09-09 10:00:00', commentNo: 1 },
    { userNick: '일반A', userId: 'a', up: 400, regDate: '2026-09-09 10:01:00', commentNo: 2 },
    { userNick: '유연서', userId: 'free2', up: 300, regDate: '2026-09-09 10:02:00', commentNo: 3 },
    { userNick: '일반B', userId: 'b', up: 200, regDate: '2026-09-09 10:03:00', commentNo: 4 }
  ], { excludeFreePass: true });
  assert.deepEqual(ranked.map(item => [item.userNick, item.rank]), [['일반A', 1], ['일반B', 2]]);
});

test('settings transfer controls are removed and static assets are cache-busted', () => {
  const html = read('index.html');
  const app = read('app.js');
  assert.doesNotMatch(html, /exportSettingsBtn|importSettingsInput|설정 내보내기|설정 불러오기/);
  assert.doesNotMatch(app, /exportBtn|importInput|exportSettings\(|importSettings\(/);
  assert.match(html, /(?:ranking-overrides|app|theme)\.js\?v=/);
  assert.match(html, /(?:styles|layout-fixes)\.css\?v=/);
});

test('app keeps separate persisted rank movement history for free-pass excluded ranking', () => {
  const app = read('app.js');
  assert.match(app, /rankChangesExcluded/);
  assert.match(app, /rank-changes-excluded:v1/);
  assert.match(app, /excludeFreePass/);
});

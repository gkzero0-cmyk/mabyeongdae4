const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const utils = require('../ranking-overrides');

test('leading soldier declaration wins over narrative mentions of officers', () => {
  assert.equal(utils.detectApplicantType(
    '병사 / 마병대 1회 경험 有\n저번 마병대 참여 시 방송적으로 성장하고 싶고, 간부분들께 방송을 배우고 싶다고 신청했습니다!'
  ), 'soldier');

  assert.equal(utils.detectApplicantType(
    '🐼 병사\n🐼 그냥서버, 다뿌서버, 치칙포폭 등\n간부님들의 명령에 토 달지 않고 뛰겠습니다.'
  ), 'soldier');

  assert.equal(utils.detectApplicantType(
    '🍓병사 🍓마크서버: 마카오톡 1.5, 미미네팜, 그냥서버 등\n간부님들과 잘 어울리겠습니다.'
  ), 'soldier');

  assert.equal(utils.detectApplicantType(
    '병사 지원합니다!!\n마크 서버 경험 다수 / 간부님 말씀 잘 듣겠습니다.'
  ), 'soldier');
});

test('leading mixed role choices remain unknown', () => {
  assert.equal(utils.detectApplicantType('간부 OR 행정병 / 마병대 1,2,3 올 참가'), 'unknown');
  assert.equal(utils.detectApplicantType('간부&행정병 / 빙고게임 / 열심히 하겠습니다.'), 'unknown');
});

test('client uses a shared comments URL and skips expensive rerender when payload version is unchanged', () => {
  const app = read('app.js');
  assert.doesNotMatch(app, /\/api\/comments\?t=\$\{Date\.now\(\)\}/);
  assert.match(app, /lastDataVersion/);
  assert.match(app, /data\.version/);
  assert.match(app, /lastDataVersion\s*!==\s*nextVersion|nextVersion\s*!==\s*lastDataVersion/);
});

test('comments API enables short shared CDN caching and returns a stable payload version', () => {
  const api = read('api/comments.js');
  const vercel = read('vercel.json');
  assert.match(api, /s-maxage=1/);
  assert.match(api, /stale-while-revalidate=4/);
  assert.match(api, /version/);
  assert.doesNotMatch(vercel, /no-store, no-cache, must-revalidate/);
});

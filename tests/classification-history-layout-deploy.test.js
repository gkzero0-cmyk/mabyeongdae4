const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  detectApplicantType,
  getMabyeongdaeSeasons
} = require('../ranking-utils');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('훈병, 훈련병, 병, 병사, 행정병 field values classify as soldier', () => {
  assert.equal(detectApplicantType('신청 분야: 훈병'), 'soldier');
  assert.equal(detectApplicantType('지원 분야 : 훈련병'), 'soldier');
  assert.equal(detectApplicantType('신청분야 병'), 'soldier');
  assert.equal(detectApplicantType('지원분야-병사'), 'soldier');
  assert.equal(detectApplicantType('신청 분야: 행정병'), 'soldier');
});

test('negative officer wording does not override clear soldier intent', () => {
  assert.equal(detectApplicantType('간부 없이 훈병 지원합니다'), 'soldier');
  assert.equal(detectApplicantType('간부 X / 지원분야 병'), 'soldier');
  assert.equal(detectApplicantType('간부 아님, 훈련병 신청합니다'), 'soldier');
  assert.equal(detectApplicantType('간부 말고 병사로 지원합니다'), 'soldier');
  assert.equal(detectApplicantType('간부 지원 안함 / 신청 분야: 훈병'), 'soldier');
});

test('explicit current application field wins over past role history', () => {
  assert.equal(detectApplicantType('마병대3 간부 경험 있습니다. 신청 분야: 훈련병'), 'soldier');
  assert.equal(detectApplicantType('마병대2 병사 참가했습니다. 지원 분야: 간부'), 'officer');
});

test('past season role statements add history badge without participation verb', () => {
  assert.deepEqual(getMabyeongdaeSeasons({ userNick: '신규', comment: '안녕하십니까. 마병대 3 훈련교관, 춘봉입니다.' }), [3]);
  assert.deepEqual(getMabyeongdaeSeasons({ userNick: '신규', comment: '마병대 2 간부였습니다.' }), [2]);
  assert.deepEqual(getMabyeongdaeSeasons({ userNick: '신규', comment: '마1 병사로 활동했습니다.' }), [1]);
  assert.deepEqual(getMabyeongdaeSeasons({ userNick: '신규', comment: '마병대 3 방송을 재미있게 봤습니다.' }), []);
});

test('applicant nickname layout keeps full nickname visible and wraps badges below it', () => {
  const html = read('index.html');
  const css = read('layout-fixes.css');
  assert.match(html, /layout-fixes\.css/);
  assert.match(css, /\.name-row\{[^}]*flex-wrap:wrap/);
  assert.match(css, /\.nick\{[^}]*flex-basis:100%[^}]*white-space:normal[^}]*overflow:visible[^}]*text-overflow:clip/);
});

test('Vercel Node runtime is pinned to Node 24 major', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.engines?.node, '24.x');
});

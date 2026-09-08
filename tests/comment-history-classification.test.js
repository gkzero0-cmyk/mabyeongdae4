const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getMabyeongdaeSeasons,
  detectApplicantType
} = require('../ranking-utils');

test('comment participation history adds past-season badges without requiring roster membership', () => {
  assert.deepEqual(getMabyeongdaeSeasons({ userNick: '처음참가자', comment: '마병대 1 참가했습니다' }), [1]);
  assert.deepEqual(getMabyeongdaeSeasons({ userNick: '처음참가자', comment: '마병대 1, 2 참가했습니다' }), [1, 2]);
  assert.deepEqual(getMabyeongdaeSeasons({ userNick: '처음참가자', comment: '마1·마2·마3 참여했습니다' }), [1, 2, 3]);
  assert.deepEqual(getMabyeongdaeSeasons({ userNick: '처음참가자', comment: '마병대 2 출전 경험 있습니다' }), [2]);
});

test('comment history merges with the fixed roster and avoids bare season mentions', () => {
  assert.deepEqual(getMabyeongdaeSeasons({ userNick: '니니', comment: '마병대 3 참가했습니다' }), [1, 2, 3]);
  assert.deepEqual(getMabyeongdaeSeasons({ userNick: '처음참가자', comment: '마병대 1 방송을 재미있게 봤습니다' }), []);
});

test('current application intent wins over past soldier or officer experience', () => {
  assert.equal(detectApplicantType('마병대2 병사 참가 / 이번 마병대4 간부 지원합니다'), 'officer');
  assert.equal(detectApplicantType('마병대3 간부 경험 있습니다. 이번에는 병사 신청합니다'), 'soldier');
  assert.equal(detectApplicantType('마병대1 간부로 참여했고 행정병 지원합니다'), 'soldier');
});

test('explicit application field wording classifies soldier and officer reliably', () => {
  assert.equal(detectApplicantType('신청 분야: 간부'), 'officer');
  assert.equal(detectApplicantType('지원 분야 : 간부'), 'officer');
  assert.equal(detectApplicantType('신청 분야: 병'), 'soldier');
  assert.equal(detectApplicantType('지원 분야: 병사'), 'soldier');
  assert.equal(detectApplicantType('병사로 지원합니다'), 'soldier');
  assert.equal(detectApplicantType('간부로 신청합니다'), 'officer');
});

test('genuinely conflicting current application intent and pepper remain unknown', () => {
  assert.equal(detectApplicantType('병사 신청합니다 / 간부 지원합니다'), 'unknown');
  assert.equal(detectApplicantType('후추 / 간부 지원합니다'), 'unknown');
});

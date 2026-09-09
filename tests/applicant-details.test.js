const test = require('node:test');
const assert = require('node:assert/strict');
const details = require('../applicant-details.js');

test('parses application fields from structured comment', () => {
  const parsed = details.parseApplicantComment('병사 신청합니다!\n참여한 마크서버> 그냥서버2, 연토피아2\n뽑혀야 하는 이유: 끝까지 열심히 하겠습니다.');
  assert.equal(parsed.minecraftExperience, '그냥서버2, 연토피아2');
  assert.equal(parsed.reason, '끝까지 열심히 하겠습니다.');
});

test('parses common alternate headings', () => {
  const parsed = details.parseApplicantComment('간부 /\n마크 서버 경험 : 레오펠, 다이아랜딩\n지원 이유 : 방송적으로 성장하고 싶습니다.');
  assert.equal(parsed.minecraftExperience, '레오펠, 다이아랜딩');
  assert.equal(parsed.reason, '방송적으로 성장하고 싶습니다.');
});

test('counts applicants with any verified season history once', () => {
  const items = [{userId:'a'}, {userId:'b'}, {userId:'c'}];
  const count = details.countExperiencedApplicants(items, item => item.userId === 'a' ? [1,2] : item.userId === 'b' ? [] : [3]);
  assert.equal(count, 2);
});

test('normalizes attachment urls from api item', () => {
  assert.deepEqual(details.getApplicantPhotoUrls({ photoUrls:['https://x.test/a.jpg','https://x.test/a.jpg','bad'] }), ['https://x.test/a.jpg']);
});

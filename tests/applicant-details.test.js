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

test('live heading variants keep experience and reason sections separate', () => {
  const tadka = details.parseApplicantComment('🫡필! 씅!\n🪖신청분야 : 병사🪖\n🎮마크서버경험 : 그냥서버, 왁업\n\n🫡뽑아야 하는 이유 :\n캐릭터성과 끈기가 있습니다.\n\n🫡각오 : 끝까지 하겠습니다.');
  assert.equal(tadka.minecraftExperience, '그냥서버, 왁업');
  assert.match(tadka.reason, /^캐릭터성과 끈기가 있습니다/);

  const habbang = details.parseApplicantComment('하빵 병사로 지원 하고 싶습니다!\n\n안녕하세요!\n\n마크 경력\n미미네팜, 그냥서버, 지수의꿈\n\n1. 하빵이를 뽑아야 하는 이유\n어떤 역할이든 몰입합니다.');
  assert.equal(habbang.minecraftExperience, '미미네팜, 그냥서버, 지수의꿈');
  assert.equal(habbang.reason, '어떤 역할이든 몰입합니다.');

  const nani = details.parseApplicantComment('신청 분야 : 병사\n\n마크 경험\n\n마카오톡\n\n포켓꾸\n\n뽑혀야하는 이유\n\n배우고 성장하고 싶습니다.');
  assert.match(nani.minecraftExperience, /^마카오톡/);
  assert.match(nani.minecraftExperience, /포켓꾸/);
  assert.equal(nani.reason, '배우고 성장하고 싶습니다.');
});

test('experience heading followed by one paragraph can fall through to an unlabeled reason paragraph', () => {
  const parsed = details.parseApplicantComment('신청분야 : 병사\n마크서버경험\n왁타버스송년회/포켓몬서버\n\n안녕하세요. 마병대에 참가해 성장하고 싶습니다!');
  assert.equal(parsed.minecraftExperience, '왁타버스송년회/포켓몬서버');
  assert.equal(parsed.reason, '안녕하세요. 마병대에 참가해 성장하고 싶습니다!');
});

test('counts applicants with any verified season history once', () => {
  const items = [{userId:'a'}, {userId:'b'}, {userId:'c'}];
  const count = details.countExperiencedApplicants(items, item => item.userId === 'a' ? [1,2] : item.userId === 'b' ? [] : [3]);
  assert.equal(count, 2);
});

test('normalizes attachment urls from api item', () => {
  assert.deepEqual(details.getApplicantPhotoUrls({ photoUrls:['https://x.test/a.jpg','https://x.test/a.jpg','bad'] }), ['https://x.test/a.jpg']);
});

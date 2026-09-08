const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MABYEONGDAE_SEASON_NAMES,
  getMabyeongdaeSeasons,
  hasMabyeongdaeSeason,
  formatMabyeongdaeSeasons
} = require('../ranking-utils');

test('past season history detects single, multiple, all, and no participation', () => {
  assert.deepEqual(getMabyeongdaeSeasons({ userNick: '부르' }), [3]);
  assert.deepEqual(getMabyeongdaeSeasons({ userNick: '니니' }), [1, 2]);
  assert.deepEqual(getMabyeongdaeSeasons({ userNick: '감스트' }), [1, 2, 3]);
  assert.deepEqual(getMabyeongdaeSeasons({ userNick: '처음참가자' }), []);
});

test('past season history can fall back to user id and format combined badge text', () => {
  assert.deepEqual(getMabyeongdaeSeasons({ userNick: '다른이름', userId: '유연서' }), [2, 3]);
  assert.equal(formatMabyeongdaeSeasons({ userNick: '감스트' }), '마1·마2·마3');
  assert.equal(formatMabyeongdaeSeasons({ userNick: '니니' }), '마1·마2');
  assert.equal(formatMabyeongdaeSeasons({ userNick: '처음참가자' }), '');
});

test('season filter helper includes applicants who participated in the selected season', () => {
  const item = { userNick: '감스트' };
  assert.equal(hasMabyeongdaeSeason(item, 1), true);
  assert.equal(hasMabyeongdaeSeason(item, 2), true);
  assert.equal(hasMabyeongdaeSeason(item, 3), true);
  assert.equal(hasMabyeongdaeSeason({ userNick: '부르' }, 1), false);
  assert.equal(hasMabyeongdaeSeason({ userNick: '부르' }, 3), true);
});

test('provided season rosters include representative edge names', () => {
  assert.ok(MABYEONGDAE_SEASON_NAMES[1].includes('갈푸짱'));
  assert.ok(MABYEONGDAE_SEASON_NAMES[1].includes('화양'));
  assert.ok(MABYEONGDAE_SEASON_NAMES[2].includes('쥐돌이쥐돌이'));
  assert.ok(MABYEONGDAE_SEASON_NAMES[2].includes('힙비'));
  assert.ok(MABYEONGDAE_SEASON_NAMES[3].includes('화양씨'));
  assert.ok(MABYEONGDAE_SEASON_NAMES[3].includes('효재'));
});

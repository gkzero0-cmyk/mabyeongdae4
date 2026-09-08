const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildRankMap,
  getRankChange,
  countKstToday,
  readFavoriteIds,
  toggleFavoriteId,
  favoriteKey,
  detectApplicantType,
  resolveApplicantType,
  readObjectMap,
  cyclePassState,
  exportSettings,
  importSettings,
  FREE_PASS_NAMES,
  isFreePassApplicant,
  calculateUpStats,
  shouldCollapseComment,
  isKstToday,
  RANK_CHANGE_TTL_MS,
  readRankChangeHistory,
  recordRankChange,
  getActiveRankChange
} = require('../ranking-utils');

test('buildRankMap stores rank by stable comment number', () => {
  const ranked = [
    { commentNo: '101', userId: 'alpha', rank: 1 },
    { commentNo: '102', userId: 'beta', rank: 2 }
  ];
  const map = buildRankMap(ranked);
  assert.equal(map.get('comment:101'), 1);
  assert.equal(map.get('comment:102'), 2);
});

test('getRankChange reports upward and downward movement', () => {
  assert.deepEqual(getRankChange(5, 8), { direction: 'up', from: 8, to: 5, delta: 3 });
  assert.deepEqual(getRankChange(9, 4), { direction: 'down', from: 4, to: 9, delta: 5 });
  assert.equal(getRankChange(4, 4), null);
  assert.equal(getRankChange(4, undefined), null);
});

test('countKstToday uses the Korea calendar day boundary', () => {
  const now = Date.parse('2026-09-08T06:22:00+09:00');
  const comments = [
    { regDate: '2026-09-08 00:00:00' },
    { regDate: '2026-09-08 06:21:59' },
    { regDate: '2026-09-07 23:59:59' },
    { regDate: '2026-09-07T16:00:00Z' }
  ];
  assert.equal(countKstToday(comments, now), 3);
});

test('favorite helpers persist a clean unique set and survive malformed storage', () => {
  assert.deepEqual(readFavoriteIds('["comment:1","comment:1","comment:2"]'), ['comment:1', 'comment:2']);
  assert.deepEqual(readFavoriteIds('{broken'), []);
  assert.deepEqual(toggleFavoriteId(['comment:1'], 'comment:2'), ['comment:1', 'comment:2']);
  assert.deepEqual(toggleFavoriteId(['comment:1', 'comment:2'], 'comment:1'), ['comment:2']);
});

test('favoriteKey falls back when comment number is unavailable', () => {
  assert.equal(favoriteKey({ commentNo: '77', userId: 'abc', regDate: '2026-09-08' }), 'comment:77');
  assert.equal(favoriteKey({ userId: 'abc', regDate: '2026-09-08 03:00:00' }), 'user:abc|2026-09-08 03:00:00');
});

test('detectApplicantType recognizes expanded soldier application wording', () => {
  assert.equal(detectApplicantType('마병대 4 병사 신청합니다'), 'soldier');
  assert.equal(detectApplicantType('신청 분야: 병'), 'soldier');
  assert.equal(detectApplicantType('행정병 신청 합니다'), 'soldier');
  assert.equal(detectApplicantType('행정병을 지원합니다'), 'soldier');
  assert.equal(detectApplicantType('간부 지원합니다'), 'officer');
});

test('detectApplicantType keeps pepper or mixed officer/soldier comments unclassified', () => {
  assert.equal(detectApplicantType('후추'), 'unknown');
  assert.equal(detectApplicantType('후추 / 병사 신청합니다'), 'unknown');
  assert.equal(detectApplicantType('간부 신청 / 병사 경험 있음'), 'unknown');
  assert.equal(detectApplicantType('간부 경험 / 신청 분야: 병'), 'unknown');
  assert.equal(detectApplicantType('열심히 하겠습니다'), 'unknown');
});

test('resolveApplicantType prefers manual override over automatic detection', () => {
  assert.equal(resolveApplicantType('병사 신청합니다', 'officer'), 'officer');
  assert.equal(resolveApplicantType('간부 신청합니다', ''), 'officer');
  assert.equal(resolveApplicantType('기타', 'unknown'), 'unknown');
});

test('readObjectMap returns only string values from valid JSON objects', () => {
  assert.deepEqual(readObjectMap('{"comment:1":"soldier","comment:2":"officer","bad":4}'), {
    'comment:1': 'soldier',
    'comment:2': 'officer'
  });
  assert.deepEqual(readObjectMap('{broken'), {});
  assert.deepEqual(readObjectMap('["x"]'), {});
});

test('cyclePassState rotates none to pass to excluded and back to none', () => {
  assert.equal(cyclePassState('none'), 'pass');
  assert.equal(cyclePassState('pass'), 'excluded');
  assert.equal(cyclePassState('excluded'), 'none');
  assert.equal(cyclePassState('wat'), 'pass');
});

test('settings export and import round-trip normalized metadata', () => {
  const json = exportSettings({
    favorites: ['comment:2', 'comment:2', 'comment:1'],
    applicantTypes: { 'comment:1': 'soldier' },
    passStates: { 'comment:2': 'excluded' }
  });
  const parsed = importSettings(json);
  assert.deepEqual(parsed.favorites, ['comment:2', 'comment:1']);
  assert.deepEqual(parsed.applicantTypes, { 'comment:1': 'soldier' });
  assert.deepEqual(parsed.passStates, { 'comment:2': 'excluded' });
  assert.equal(parsed.version, 1);
});

test('free pass roster is fixed and matches applicant nickname or id', () => {
  assert.deepEqual(FREE_PASS_NAMES, ['니니', '망구랑', '유연서', '부르', '새잎', '울산큰고래']);
  assert.equal(isFreePassApplicant({ userNick: '니니', userId: 'someone' }), true);
  assert.equal(isFreePassApplicant({ userNick: '다른이름', userId: '유연서' }), true);
  assert.equal(isFreePassApplicant({ userNick: ' 울산큰고래 ', userId: 'whale' }), true);
  assert.equal(isFreePassApplicant({ userNick: '헤리', userId: 'golf2237' }), false);
});

test('calculateUpStats returns total and average UP across all applicants', () => {
  assert.deepEqual(calculateUpStats([{ up: 3051 }, { up: '949' }, { up: null }]), { total: 4000, average: 1333.3333333333333 });
  assert.deepEqual(calculateUpStats([]), { total: 0, average: 0 });
});

test('shouldCollapseComment collapses multiline or long comments only', () => {
  assert.equal(shouldCollapseComment('짧은 댓글입니다.'), false);
  assert.equal(shouldCollapseComment('첫 줄\n둘째 줄'), true);
  assert.equal(shouldCollapseComment('가'.repeat(81)), true);
  assert.equal(shouldCollapseComment('가'.repeat(80)), false);
});

test('isKstToday marks only applicants written today in Korea time', () => {
  const now = Date.parse('2026-09-08T07:56:00+09:00');
  assert.equal(isKstToday('2026-09-08 00:00:00', now), true);
  assert.equal(isKstToday('2026-09-08T00:30:00+09:00', now), true);
  assert.equal(isKstToday('2026-09-07 23:59:59', now), false);
  assert.equal(isKstToday('', now), false);
});

test('rank change history keeps the latest movement visible for 24 hours', () => {
  const now = Date.parse('2026-09-09T03:45:00+09:00');
  const change = { direction: 'up', from: 18, to: 12, delta: 6 };
  const history = recordRankChange({}, 'comment:101', change, now);
  assert.equal(RANK_CHANGE_TTL_MS, 24 * 60 * 60 * 1000);
  assert.deepEqual(getActiveRankChange(history, 'comment:101', now + RANK_CHANGE_TTL_MS - 1), {
    ...change,
    changedAt: now
  });
});

test('a later rank movement replaces the stored movement and restarts the 24 hour window', () => {
  const start = Date.parse('2026-09-09T00:00:00+09:00');
  let history = recordRankChange({}, 'comment:101', { direction: 'up', from: 20, to: 15, delta: 5 }, start);
  const secondAt = start + 10 * 60 * 60 * 1000;
  history = recordRankChange(history, 'comment:101', { direction: 'down', from: 15, to: 17, delta: 2 }, secondAt);
  assert.deepEqual(getActiveRankChange(history, 'comment:101', secondAt + 23 * 60 * 60 * 1000), {
    direction: 'down', from: 15, to: 17, delta: 2, changedAt: secondAt
  });
});

test('rank change history hides and removes entries after 24 hours without movement', () => {
  const changedAt = Date.parse('2026-09-08T12:00:00+09:00');
  const raw = JSON.stringify({
    'comment:101': { direction: 'up', from: 18, to: 12, delta: 6, changedAt },
    'comment:102': { direction: 'down', from: 4, to: 8, delta: 4, changedAt: changedAt + 60 * 60 * 1000 }
  });
  const atExpiry = changedAt + RANK_CHANGE_TTL_MS;
  const cleaned = readRankChangeHistory(raw, atExpiry);
  assert.equal(getActiveRankChange(cleaned, 'comment:101', atExpiry), null);
  assert.ok(cleaned['comment:102']);
  assert.equal(Object.hasOwn(cleaned, 'comment:101'), false);
});

test('rank change history restores valid persisted entries after reload', () => {
  const changedAt = Date.parse('2026-09-09T01:00:00+09:00');
  const raw = JSON.stringify({
    'comment:777': { direction: 'up', from: 9, to: 7, delta: 2, changedAt }
  });
  const restored = readRankChangeHistory(raw, changedAt + 2 * 60 * 60 * 1000);
  assert.deepEqual(getActiveRankChange(restored, 'comment:777', changedAt + 2 * 60 * 60 * 1000), {
    direction: 'up', from: 9, to: 7, delta: 2, changedAt
  });
});

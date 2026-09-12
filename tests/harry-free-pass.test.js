const test = require('node:test');
const assert = require('node:assert/strict');
const utils = require('../ranking-utils.js');

test('Harry is included in the fixed free-pass roster', () => {
  const harry = { userNick: '해리', userId: 'gofl2237' };
  assert.equal(utils.isFreePassApplicant(harry), true);
  assert.equal(utils.FREE_PASS_NAMES.includes('해리'), true);
});

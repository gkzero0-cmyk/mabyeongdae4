const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function loadUtils() {
  delete require.cache[require.resolve('../ranking-utils')];
  delete require.cache[require.resolve('../applicant-types-v3')];
  delete require.cache[require.resolve('../ranking-overrides')];
  delete require.cache[require.resolve('../comment-edit-classification')];
  return require('../comment-edit-classification');
}

test('edited explicit officer comment overrides the old workbook classification', () => {
  const utils = loadUtils();
  const item = {
    userId: 'gofl2237',
    comment: '간부 / 마병대 1,2,3 올 참가\n간부로 신청을 합니다!'
  };
  assert.equal(utils.resolveApplicantType(item, 'unknown'), 'officer');
  assert.equal(utils.getAuthoritativeApplicantType(item), '');
});

test('edited explicit mixed-role comment automatically becomes unclassified', () => {
  const utils = loadUtils();
  assert.equal(
    utils.resolveApplicantType({ userId: 'jaeparkk', comment: '간부 OR 행정병' }, 'officer'),
    'unknown'
  );
});

test('chiya ampersand mixed-role comment stays unclassified even when HTML-escaped', () => {
  const utils = loadUtils();
  const literal = { userId: 'chiya1207', comment: '간부&행정병 / 빙고게임 / 저마크개잘하구요재밌습니다 /' };
  const escaped = { userId: 'chiya1207', comment: '간부&amp;행정병 / 빙고게임 / 저마크개잘하구요재밌습니다 /' };

  assert.equal(utils.resolveApplicantType(literal, 'officer'), 'unknown');
  assert.equal(utils.resolveApplicantType(escaped, 'officer'), 'unknown');
  assert.equal(utils.getAuthoritativeApplicantType(escaped), '');
});

test('edited explicit soldier comment overrides the old workbook classification', () => {
  const utils = loadUtils();
  assert.equal(
    utils.resolveApplicantType({ userId: 'jaeparkk', comment: '병사로 신청합니다.' }, 'officer'),
    'soldier'
  );
});

test('narrative role words still fall back to the reviewed workbook value', () => {
  const utils = loadUtils();
  const item = { userId: 'heda221112', comment: '간부님들 말씀 잘 듣겠습니다.' };
  assert.equal(utils.resolveApplicantType(item, 'officer'), 'soldier');
  assert.equal(utils.getAuthoritativeApplicantType(item), 'soldier');
});

test('browser loads the live-comment override after ranking overrides and before app startup', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const rankingIndex = html.indexOf('ranking-overrides.js');
  const editIndex = html.indexOf('comment-edit-classification.js');
  const appIndex = html.indexOf('app.js');
  assert.ok(rankingIndex >= 0);
  assert.ok(editIndex > rankingIndex);
  assert.ok(appIndex > editIndex);
});

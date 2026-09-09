const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const utils = require('../ranking-overrides');

const expected = {
  gofl2237: 'unknown',
  jaeparkk: 'officer',
  heda221112: 'soldier',
  kimtalggy: 'soldier',
  lsh8071: 'soldier'
};

test('v3 workbook provides an authoritative applicant type for all 167 listed SOOP IDs', () => {
  assert.ok(utils.APPLICANT_TYPE_ID_MAP);
  assert.equal(Object.keys(utils.APPLICANT_TYPE_ID_MAP).length, 167);
  for (const [id, type] of Object.entries(expected)) {
    assert.equal(utils.APPLICANT_TYPE_ID_MAP[id], type, id);
  }
});

test('v3 workbook type wins over both browser manual state and comment auto-detection', () => {
  assert.equal(
    utils.resolveApplicantType({ userId: 'gofl2237', comment: '간부로 신청합니다.' }, 'officer'),
    'unknown'
  );
  assert.equal(
    utils.resolveApplicantType({ userId: 'heda221112', comment: '간부님들 말씀 잘 듣겠습니다.' }, 'officer'),
    'soldier'
  );
  assert.equal(
    utils.resolveApplicantType({ userId: 'jaeparkk', comment: '병사로 신청합니다.' }, 'soldier'),
    'officer'
  );
});

test('unlisted future applicants keep existing manual and automatic fallback behavior', () => {
  assert.equal(
    utils.resolveApplicantType({ userId: 'future_applicant', comment: '병사로 신청합니다.' }, 'officer'),
    'officer'
  );
  assert.equal(
    utils.resolveApplicantType({ userId: 'future_applicant', comment: '병사로 신청합니다.' }),
    'soldier'
  );
});

test('browser classification paths pass the full applicant item so the SOOP ID authority is used', () => {
  const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  assert.match(app, /resolveApplicantType\(item,\s*applicantTypes\[key\]\)/);
  assert.match(app, /const autoType = resolveApplicantType\(item\);/);
});

test('changed applicant authority code is cache-busted in the browser', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /ranking-overrides\.js\?v=20260909g/);
  assert.match(html, /app\.js\?v=20260909g/);
});

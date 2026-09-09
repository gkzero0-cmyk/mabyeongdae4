const fs = require('node:fs');

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, value) { fs.writeFileSync(path, value); }
function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Missing patch target: ${label}`);
  return source.replace(search, replacement);
}

// ranking-overrides.js: v3 workbook SOOP ID mapping is the highest-priority source.
{
  const path = 'ranking-overrides.js';
  let source = read(path);

  if (!source.includes('const APPLICANT_TYPE_ID_MAP =')) {
    source = replaceRequired(
      source,
      "})(typeof globalThis !== 'undefined' ? globalThis : this, function (base) {\n",
      "})(typeof globalThis !== 'undefined' ? globalThis : this, function (base) {\n  const APPLICANT_TYPE_ID_MAP = typeof module === 'object' && module.exports\n    ? require('./applicant-types-v3')\n    : (typeof globalThis !== 'undefined' && globalThis.Mabyeongdae4ApplicantTypesV3) || Object.freeze({});\n\n",
      'authoritative map import'
    );
  }

  if (!source.includes('function getAuthoritativeApplicantType(')) {
    source = replaceRequired(
      source,
      "  function normalizeSoopId(value) {\n    return String(value || '').trim().toLowerCase();\n  }\n",
      "  function normalizeSoopId(value) {\n    return String(value || '').trim().toLowerCase();\n  }\n\n  function getAuthoritativeApplicantType(itemOrId) {\n    const sourceValue = itemOrId && typeof itemOrId === 'object' ? itemOrId.userId : itemOrId;\n    const type = APPLICANT_TYPE_ID_MAP[normalizeSoopId(sourceValue)];\n    return ['soldier', 'officer', 'unknown'].includes(type) ? type : '';\n  }\n",
      'authoritative type helper'
    );
  }

  source = replaceRequired(
    source,
    "  function resolveApplicantType(comment, manualType) {\n    const manual = String(manualType || '').trim();\n    if (['soldier', 'officer', 'unknown'].includes(manual)) return manual;\n    return detectApplicantType(comment);\n  }",
    "  function resolveApplicantType(itemOrComment, manualType) {\n    const item = itemOrComment && typeof itemOrComment === 'object' ? itemOrComment : null;\n    const authoritative = item ? getAuthoritativeApplicantType(item) : '';\n    if (authoritative) return authoritative;\n\n    const manual = String(manualType || '').trim();\n    if (['soldier', 'officer', 'unknown'].includes(manual)) return manual;\n    return detectApplicantType(item ? item.comment : itemOrComment);\n  }",
    'resolveApplicantType priority'
  );

  if (!source.includes('    APPLICANT_TYPE_ID_MAP,')) {
    source = replaceRequired(
      source,
      "    SOOP_SEASON_ID_MAP,\n    detectApplicantType,\n    resolveApplicantType,",
      "    SOOP_SEASON_ID_MAP,\n    APPLICANT_TYPE_ID_MAP,\n    getAuthoritativeApplicantType,\n    detectApplicantType,\n    resolveApplicantType,",
      'exports'
    );
  }
  write(path, source);
}

// app.js: pass full applicant objects so SOOP ID authority is applied everywhere.
{
  const path = 'app.js';
  let source = read(path);
  source = replaceRequired(
    source,
    '    readFavoriteIds, toggleFavoriteId, detectApplicantType, resolveApplicantType,\n',
    '    readFavoriteIds, toggleFavoriteId, detectApplicantType, resolveApplicantType, getAuthoritativeApplicantType,\n',
    'destructure authoritative helper'
  );
  source = replaceRequired(
    source,
    '    return resolveApplicantType(item.comment, applicantTypes[key]);',
    '    return resolveApplicantType(item, applicantTypes[key]);',
    'getType full item'
  );
  source = replaceRequired(
    source,
    '      const autoType = detectApplicantType(item.comment);\n      const currentType = getType(item);',
    '      const autoType = resolveApplicantType(item);\n      const authoritativeType = getAuthoritativeApplicantType(item);\n      const currentType = getType(item);',
    'row authoritative type'
  );

  const oldSelect = String.raw`        <td class="type"><select class="applicant-type-select ${typeClass}" data-key="${esc(key)}"><option value="auto"${applicantTypes[key] == null ? ' selected' : ''}>자동 (${typeLabel(autoType)})</option><option value="soldier"${applicantTypes[key] === 'soldier' ? ' selected' : ''}>병사</option><option value="officer"${applicantTypes[key] === 'officer' ? ' selected' : ''}>간부</option><option value="unknown"${applicantTypes[key] === 'unknown' ? ' selected' : ''}>미분류</option></select></td>`;
  const newSelect = String.raw`        <td class="type"><select class="applicant-type-select ${typeClass}" data-key="${esc(key)}"${authoritativeType ? ' disabled title="v3 기준파일 최우선"' : ''}><option value="auto"${authoritativeType || applicantTypes[key] == null ? ' selected' : ''}>${authoritativeType ? `기준파일 (${typeLabel(authoritativeType)})` : `자동 (${typeLabel(autoType)})`}</option><option value="soldier"${!authoritativeType && applicantTypes[key] === 'soldier' ? ' selected' : ''}>병사</option><option value="officer"${!authoritativeType && applicantTypes[key] === 'officer' ? ' selected' : ''}>간부</option><option value="unknown"${!authoritativeType && applicantTypes[key] === 'unknown' ? ' selected' : ''}>미분류</option></select></td>`;
  source = replaceRequired(source, oldSelect, newSelect, 'authoritative select display');
  write(path, source);
}

// index.html: load the generated workbook mapping before ranking overrides and bust changed scripts.
{
  const path = 'index.html';
  let source = read(path);
  if (!source.includes('applicant-types-v3.js')) {
    source = replaceRequired(
      source,
      '<script src="./ranking-overrides.js?v=20260909f"></script>',
      '<script src="./applicant-types-v3.js?v=20260909g"></script>\n  <script src="./ranking-overrides.js?v=20260909g"></script>',
      'v3 map script insertion'
    );
  } else {
    source = source.replace(/applicant-types-v3\.js\?v=[^\"]+/, 'applicant-types-v3.js?v=20260909g');
    source = source.replace(/ranking-overrides\.js\?v=[^\"]+/, 'ranking-overrides.js?v=20260909g');
  }
  source = source.replace(/app\.js\?v=[^\"]+/, 'app.js?v=20260909g');
  write(path, source);
}

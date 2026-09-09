const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function write(path, value) {
  fs.writeFileSync(path, value);
}

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Missing patch target: ${label}`);
  return source.replace(search, replacement);
}

// 1) Applicant classification: a clear role declaration at the start of the
// application wins over later narrative references to officers/soldiers.
{
  const path = 'ranking-overrides.js';
  let source = read(path);
  if (!source.includes('function leadingRoleType(text)')) {
    const helper = String.raw`  function leadingRoleType(text) {
    const firstLine = stripNegativeOfficer(String(text || ''))
      .split(/\n+/)
      .map(line => line.trim())
      .find(Boolean);
    if (!firstLine) return '';

    const line = firstLine.replace(/^[^\p{L}\p{N}]*/u, '').trim();
    if (!line) return '';

    const mixedOfficerFirst = /^(?:일반\s*)?간부\s*(?:OR|또는|혹은|&|\/|\|)\s*(?:행정병|훈련병|훈병|병사|병)(?=$|[\s\/|,;:：()[\]{}<>·&-])/iu;
    const mixedSoldierFirst = /^(?:일반\s*)?(?:행정병|훈련병|훈병|병사|병)\s*(?:OR|또는|혹은|&|\/|\|)\s*간부(?=$|[\s\/|,;:：()[\]{}<>·&-])/iu;
    if (mixedOfficerFirst.test(line) || mixedSoldierFirst.test(line)) return 'unknown';

    const match = line.match(/^(?:일반\s*)?(간부|행정병|훈련병|훈병|병사|병)(?=$|[\s\/|,;:：()[\]{}<>·&-])/u);
    if (!match) return '';
    return match[1] === '간부' ? 'officer' : 'soldier';
  }

`;
    source = replaceRequired(source, '  function detectApplicantType(comment) {', helper + '  function detectApplicantType(comment) {', 'classification helper insertion');
    source = replaceRequired(
      source,
      "    if (!text) return 'unknown';\n\n    const currentText = stripNegativeOfficer(stripPastHistory(text));",
      "    if (!text) return 'unknown';\n\n    const leadingType = leadingRoleType(text);\n    if (leadingType) return leadingType;\n\n    const currentText = stripNegativeOfficer(stripPastHistory(text));",
      'classification precedence'
    );
    write(path, source);
  }
}

// 2) Browser: keep the 1-second poll cadence, but use one cacheable API URL for
// all visitors and avoid rebuilding the full table when the payload is unchanged.
{
  const path = 'app.js';
  let source = read(path);
  source = source.replace('const REFRESH_MS = 1500;', 'const REFRESH_MS = 1000;');
  if (!source.includes('let lastDataVersion')) {
    source = replaceRequired(source, '  let loading = false;\n', "  let loading = false;\n  let lastDataVersion = '';\n", 'last data version state');
  }
  source = source.replace("const response = await fetch(`/api/comments?t=${Date.now()}`, { cache:'no-store' });", "const response = await fetch('/api/comments');");
  if (!source.includes('const nextVersion = String(data.version')) {
    source = replaceRequired(
      source,
      "      const nextAll = Array.isArray(data.comments) ? data.comments : [];\n      updateRankHistory(nextAll);\n      all = nextAll;\n      render();",
      "      const nextAll = Array.isArray(data.comments) ? data.comments : [];\n      const nextVersion = String(data.version || `${data.total || nextAll.length}:${data.fetchedAt || ''}`);\n      if (lastDataVersion !== nextVersion) {\n        updateRankHistory(nextAll);\n        all = nextAll;\n        lastDataVersion = nextVersion;\n        render();\n      }",
      'skip unchanged render'
    );
  }
  source = source.replace("${manual ? '수동 갱신 완료' : '1초 자동 갱신 중'}", "${manual ? '수동 갱신 완료' : '1초 자동 갱신 중'}");
  write(path, source);
}

// 3) API: short shared CDN cache + stable content version.
{
  const path = 'api/comments.js';
  let source = read(path);
  if (!source.startsWith("const crypto = require('node:crypto');")) {
    source = "const crypto = require('node:crypto');\n" + source;
  }
  source = source.replace('const CACHE_MS = 850;', 'const CACHE_MS = 1200;');
  if (!source.includes("createHash('sha1')")) {
    source = replaceRequired(
      source,
      "  return {\n    ok: true,\n    channelId: CHANNEL_ID,\n    postId: POST_ID,\n    postUrl: POST_URL,\n    fetchedAt: new Date().toISOString(),\n    total: seen.size,\n    pages: maxPages,\n    comments: [...seen.values()]\n  };",
      "  const comments = [...seen.values()];\n  const version = crypto.createHash('sha1').update(JSON.stringify(comments)).digest('hex').slice(0, 16);\n  return {\n    ok: true,\n    channelId: CHANNEL_ID,\n    postId: POST_ID,\n    postUrl: POST_URL,\n    fetchedAt: new Date().toISOString(),\n    version,\n    total: seen.size,\n    pages: maxPages,\n    comments\n  };",
      'payload version'
    );
  }
  source = source.replace(
    "res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');",
    "res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=1, stale-while-revalidate=4');\n  res.setHeader('CDN-Cache-Control', 'public, s-maxage=1, stale-while-revalidate=4');"
  );
  write(path, source);
}

// 4) Vercel routing header must not override the function with no-store.
{
  const path = 'vercel.json';
  let source = read(path);
  source = source.replace('no-store, no-cache, must-revalidate', 'public, max-age=0, s-maxage=1, stale-while-revalidate=4');
  write(path, source);
}

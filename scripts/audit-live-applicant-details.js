const details = require('../applicant-details.js');
const utils = require('../comment-edit-classification.js');

const API_URL = 'https://mabyeongdae4.vercel.app/api/comments';

function normalize(text) {
  return String(text || '').replace(/\r\n?/g, '\n').trim();
}

function nonEmptyLines(text) {
  return normalize(text).split(/\n+/).map(v => v.trim()).filter(Boolean);
}

function slashParts(text) {
  return normalize(text).split(/\s*\/\s*/).map(v => v.trim()).filter(Boolean);
}

function looksRole(text) {
  const v = String(text || '').replace(/^[^\p{L}\p{N}]*/u, '').trim();
  return /^(?:(?:신청|지원)\s*분야\s*[:：\-]?\s*)?(?:간부|병사|병|훈련병|훈병|행정병)(?:\b|\s|[&|,;:：()[\]{}<>·\/-])/u.test(v)
    || /^(?:간부|병사|병|훈련병|훈병|행정병).{0,50}(?:신청|지원)/u.test(v);
}

function labelLines(text) {
  return nonEmptyLines(text).filter(line => /(?:신청\s*분야|지원\s*분야|마크.*(?:경험|서버)|서버.*경험|뽑.*이유|지원.*이유|신청.*이유|각오|어필)/u.test(line)).map(line => line.slice(0, 90));
}

function compact(text, max=220) {
  const v = normalize(text).replace(/\s+/g, ' ');
  return v.length > max ? v.slice(0, max) + '…' : v;
}

(async () => {
  const res = await fetch(API_URL, { headers: { 'user-agent': 'mabyeongdae4-live-audit/1.0' } });
  if (!res.ok) throw new Error(`API HTTP ${res.status}`);
  const payload = await res.json();
  if (!payload.ok || !Array.isArray(payload.comments)) throw new Error('Invalid API payload');
  const items = payload.comments;

  const issues = [];
  const labels = new Map();
  let parsedExperience = 0;
  let parsedReason = 0;
  let structuredCandidates = 0;
  let adminMentions = 0;
  let adminMisclassified = 0;

  for (const item of items) {
    const raw = normalize(item.comment);
    const parsed = details.parseApplicantComment(raw);
    if (parsed.minecraftExperience) parsedExperience++;
    if (parsed.reason) parsedReason++;

    for (const line of labelLines(raw)) labels.set(line, (labels.get(line) || 0) + 1);

    if (/행정병/u.test(raw)) {
      adminMentions++;
      if (utils.hasExplicitAdministrativeSignal(raw) && utils.resolveApplicantType(item) !== 'unknown') {
        adminMisclassified++;
        issues.push({ kind:'admin-classification', id:item.userId, nick:item.userNick, parsed, comment:compact(raw) });
      }
    }

    const slash = slashParts(raw);
    const lines = nonEmptyLines(raw);
    const paragraphParts = raw.split(/\n\s*\n+/).map(v => v.trim()).filter(Boolean);
    const slashRoleFirst = slash.length >= 3 && looksRole(slash[0]);
    const paragraphRoleFirst = paragraphParts.length >= 3 && looksRole(paragraphParts[0]);
    const lineRoleFirst = lines.length >= 3 && looksRole(lines[0]);
    const headingExperience = /(?:마크\s*서버\s*경험|마크서버경험|마크\s*경험|참여\s*경험\s*서버)/u.test(raw);
    const headingReason = /(?:뽑(?:혀|아)?야\s*하는\s*이유|지원\s*(?:하는\s*)?이유|지원\s*사유|신청\s*(?:한|하는)?\s*이유|신청\s*사유|각오)/u.test(raw);
    const structured = slashRoleFirst || paragraphRoleFirst || lineRoleFirst || headingExperience || headingReason;
    if (structured) structuredCandidates++;

    if ((slashRoleFirst || paragraphRoleFirst || lineRoleFirst) && (!parsed.minecraftExperience || !parsed.reason)) {
      issues.push({ kind:'role-first-structural-miss', id:item.userId, nick:item.userNick, parsed, comment:compact(raw) });
    }
    if (headingExperience && !parsed.minecraftExperience) {
      issues.push({ kind:'experience-heading-miss', id:item.userId, nick:item.userNick, parsed, comment:compact(raw) });
    }
    if (headingReason && !parsed.reason) {
      issues.push({ kind:'reason-heading-miss', id:item.userId, nick:item.userNick, parsed, comment:compact(raw) });
    }
  }

  const career = items.map(item => ({ item, seasons: utils.getMabyeongdaeSeasons(item) })).filter(v => v.seasons.length);
  const names = list => list.map(v => `${v.item.userNick}(${v.item.userId})`).sort((a,b)=>a.localeCompare(b,'ko'));
  const season = n => career.filter(v => v.seasons.includes(n));
  const all123 = career.filter(v => [1,2,3].every(n => v.seasons.includes(n)));
  const only23combo = career.filter(v => v.seasons.includes(2) && v.seasons.includes(3) && !v.seasons.includes(1));
  const tadka = items.find(v => String(v.userId).toLowerCase() === 'tadka56');
  const chiya = items.find(v => String(v.userId).toLowerCase() === 'chiya1207');

  console.log('LIVE_AUDIT_SUMMARY', JSON.stringify({
    total: items.length,
    parsedExperience,
    parsedReason,
    structuredCandidates,
    adminMentions,
    adminMisclassified,
    issueCount: issues.length,
    careerTotal: career.length,
    season1: season(1).length,
    season2: season(2).length,
    season3: season(3).length,
    all123: all123.length,
    only23combo: only23combo.length,
    tadkaSeasons: tadka ? utils.getMabyeongdaeSeasons(tadka) : null,
    chiyaType: chiya ? utils.resolveApplicantType(chiya) : null,
    chiyaParsed: chiya ? details.parseApplicantComment(chiya.comment) : null,
  }, null, 2));

  console.log('CAREER_SEASON_1', JSON.stringify(names(season(1))));
  console.log('CAREER_SEASON_2', JSON.stringify(names(season(2))));
  console.log('CAREER_SEASON_3', JSON.stringify(names(season(3))));
  console.log('CAREER_ALL_123', JSON.stringify(names(all123)));
  console.log('CAREER_23_ONLY', JSON.stringify(names(only23combo)));

  console.log('LABEL_LINES_TOP');
  [...labels.entries()].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0],'ko')).slice(0,120).forEach(([line,count]) => console.log(`${count}\t${line}`));

  console.log('AUDIT_ISSUES');
  issues.slice(0,120).forEach(issue => console.log(JSON.stringify(issue)));

  if (adminMisclassified) process.exitCode = 2;
})();

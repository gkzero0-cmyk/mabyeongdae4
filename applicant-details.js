(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ApplicantDetails = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const EXPERIENCE_HEADING = /^(?:(?:참여(?:한|해본)?|해본|경험(?:한)?)?\s*마크\s*서버(?:\s*경험)?|참여\s*경험\s*서버|마크\s*경험|마크\s*경력|서버\s*경험)(?=$|[\s:：=>\-|·\]】)>}])/iu;
  const REASON_HEADING = /^(?:(?:각오\s*및\s*)?(?:[\p{L}\p{N}_.♥♡·]{1,30}\s*)?뽑(?:혀야|아야)\s*(?:하는|되는)?\s*이유|지원\s*(?:한|하는)?\s*이유|지원\s*사유|지원\s*동기|신청\s*(?:한|하는)?\s*이유|신청\s*사유|어필(?:\s*할\s*점|\s*자료|합니다!?)?|각오)(?=$|[\s:：=>\-|·\]】)>}])/iu;
  const OTHER_HEADING = /^(?:특이\s*사항|컴퓨터(?:\s*및\s*마이크)?\s*세팅|방음|저의\s*장점|장점|참여\s*가능\s*시간|방송\s*가능\s*시간|추가\s*사항)(?=$|[\s:：=>\-|·\]】)>}])/iu;

  function normalizeSectionValue(value) {
    return String(value || '')
      .replace(/^[\s:：>\-|·=\]】)>}]+/u, '')
      .replace(/[\s]+$/u, '')
      .trim();
  }

  function headingCandidate(line) {
    return String(line || '')
      .trim()
      .replace(/^[^\p{L}\p{N}]*/u, '')
      .replace(/^\d+\s*[.)]\s*/u, '')
      .trim();
  }

  function headingMatch(line, regex, field) {
    const candidate = headingCandidate(line);
    if (!candidate) return null;
    const match = candidate.match(regex);
    if (!match) return null;
    const rest = normalizeSectionValue(candidate.slice(match[0].length));
    return { field, rest };
  }

  function parseHeadingLine(line) {
    return headingMatch(line, EXPERIENCE_HEADING, 'minecraftExperience')
      || headingMatch(line, REASON_HEADING, 'reason')
      || headingMatch(line, OTHER_HEADING, 'other');
  }

  function stripHeading(value, field) {
    const text = normalizeSectionValue(value);
    if (!text) return '';
    const lines = text.split('\n');
    const match = parseHeadingLine(lines[0]);
    if (!match || match.field !== field) return text;
    const rest = [match.rest, ...lines.slice(1)].filter((part, index) => part || index > 0).join('\n');
    return normalizeSectionValue(rest);
  }

  function trimCapturedLines(lines) {
    const copy = [...lines];
    while (copy.length && !String(copy[0] || '').trim()) copy.shift();
    while (copy.length && !String(copy[copy.length - 1] || '').trim()) copy.pop();
    return copy.join('\n').trim();
  }

  function looksNarrativeParagraph(value) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return false;
    if (text.length >= 70) return true;
    return /(?:안녕|저는|제가|마병대|지원|신청|방송|성장|기회|열심|끝까지|참가|참여|보여|하고\s*싶|하겠습니다|입니다[.!]?)/u.test(text);
  }

  function splitUnlabeledReasonFromExperience(value) {
    const text = String(value || '').trim();
    const paragraphs = text.split(/\n\s*\n+/).map(v => v.trim()).filter(Boolean);
    if (paragraphs.length < 2) return { experience: text, reason: '' };
    const reasonIndex = paragraphs.findIndex((paragraph, index) => index > 0 && looksNarrativeParagraph(paragraph));
    if (reasonIndex < 1) return { experience: text, reason: '' };
    return {
      experience: paragraphs.slice(0, reasonIndex).join('\n\n'),
      reason: paragraphs.slice(reasonIndex).join('\n\n')
    };
  }

  function parseByHeadings(raw) {
    const lines = String(raw || '').split('\n');
    const buckets = { minecraftExperience: [], reason: [] };
    let active = '';
    let sawExperience = false;
    let sawReason = false;
    let reasonStarted = false;

    for (const line of lines) {
      const heading = parseHeadingLine(line);
      if (heading) {
        if (heading.field === 'minecraftExperience') {
          sawExperience = true;
          active = reasonStarted ? '' : 'minecraftExperience';
          if (active && heading.rest) buckets.minecraftExperience.push(heading.rest);
          continue;
        }
        if (heading.field === 'reason') {
          sawReason = true;
          if (!reasonStarted) {
            reasonStarted = true;
            active = 'reason';
          } else if (/^각오/u.test(headingCandidate(line))) {
            active = '';
          } else {
            active = 'reason';
          }
          if (active && heading.rest) buckets.reason.push(heading.rest);
          continue;
        }
        active = '';
        continue;
      }
      if (active) buckets[active].push(line);
    }

    let minecraftExperience = trimCapturedLines(buckets.minecraftExperience);
    let reason = trimCapturedLines(buckets.reason);

    if (sawExperience && !sawReason && minecraftExperience) {
      const split = splitUnlabeledReasonFromExperience(minecraftExperience);
      minecraftExperience = split.experience;
      reason = split.reason;
    }

    return { minecraftExperience, reason, sawExperience, sawReason };
  }

  function looksLikeRoleSection(value) {
    const text = normalizeSectionValue(value).replace(/^[^\p{L}\p{N}]*/u, '').trim();
    if (!text) return false;
    if (/^(?:신청|지원)\s*분야\s*[:：\-]?\s*(?:간부|병사|병|훈련병|훈병|행정병)/u.test(text)) return true;
    if (/^(?:일반\s*)?(?:간부|병사|병|훈련병|훈병|행정병)(?=$|[\s&|,;:：()[\]{}<>·\/-])/u.test(text)) return true;
    return /^(?:간부|병사|병|훈련병|훈병|행정병).{0,40}(?:신청|지원)/u.test(text);
  }

  function splitSlashSections(raw) {
    const parts = [];
    let current = '';
    for (let i = 0; i < raw.length; i++) {
      const char = raw[i];
      const prev = raw[i - 1] || '';
      const next = raw[i + 1] || '';
      if (char === '/' && prev !== ':' && prev !== '/' && next !== '/') {
        parts.push(normalizeSectionValue(current));
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(normalizeSectionValue(current));
    return parts.filter(Boolean);
  }

  function structuralSections(raw) {
    const slash = splitSlashSections(raw);
    if (slash.length >= 3 && looksLikeRoleSection(slash[0])) {
      return { applicationField: slash[0], experience: slash[1], reason: slash.slice(2).join(' / ') };
    }

    const paragraphs = raw.split(/\n\s*\n+/).map(normalizeSectionValue).filter(Boolean);
    if (paragraphs.length >= 3 && looksLikeRoleSection(paragraphs[0])) {
      return { applicationField: paragraphs[0], experience: paragraphs[1], reason: paragraphs.slice(2).join('\n\n') };
    }

    const lines = raw.split(/\n+/).map(normalizeSectionValue).filter(Boolean);
    if (lines.length >= 3 && looksLikeRoleSection(lines[0])) {
      return { applicationField: lines[0], experience: lines[1], reason: lines.slice(2).join('\n') };
    }
    return { applicationField: '', experience: '', reason: '' };
  }

  function parseApplicantComment(comment) {
    const raw = String(comment || '').replace(/\r\n?/g, '\n').trim();
    const headings = parseByHeadings(raw);
    const structure = structuralSections(raw);

    if (headings.sawExperience || headings.sawReason) {
      return {
        applicationField: structure.applicationField,
        minecraftExperience: headings.minecraftExperience || (structure.experience ? stripHeading(structure.experience, 'minecraftExperience') : ''),
        reason: headings.reason || (headings.sawExperience && !headings.sawReason ? '' : (structure.reason ? stripHeading(structure.reason, 'reason') : ''))
      };
    }

    return {
      applicationField: structure.applicationField,
      minecraftExperience: structure.experience ? stripHeading(structure.experience, 'minecraftExperience') : '',
      reason: structure.reason ? stripHeading(structure.reason, 'reason') : ''
    };
  }

  function countExperiencedApplicants(items, getSeasons) {
    const list = Array.isArray(items) ? items : [];
    const reader = typeof getSeasons === 'function' ? getSeasons : () => [];
    return list.reduce((count, item) => count + (reader(item).length ? 1 : 0), 0);
  }

  function getApplicantPhotoUrls(item) {
    const urls = Array.isArray(item?.photoUrls) ? item.photoUrls : [];
    const seen = new Set();
    const out = [];
    for (const value of urls) {
      const url = String(value || '').trim();
      if (!/^https?:\/\//i.test(url) || seen.has(url)) continue;
      seen.add(url);
      out.push(url);
    }
    return out;
  }

  return {
    parseApplicantComment,
    countExperiencedApplicants,
    getApplicantPhotoUrls
  };
});

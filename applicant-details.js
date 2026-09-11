(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ApplicantDetails = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const HEADING_PATTERNS = [
    {
      field: 'minecraftExperience',
      regex: /(?:참여(?:한|해본)?|해본|경험(?:한)?)?\s*마크\s*서버(?:\s*경험)?|참여\s*경험\s*서버|마크\s*경험/giu
    },
    {
      field: 'reason',
      regex: /각오\s*및\s*뽑혀야\s*하는\s*이유|(?:내가|제가|[가-힣A-Za-z0-9_.♥♡·]+가)?\s*뽑혀야\s*하는\s*이유|지원\s*(?:하는\s*)?이유|지원\s*사유|신청\s*(?:한|하는)?\s*이유|신청\s*사유/giu
    }
  ];

  function normalizeSectionValue(value) {
    return String(value || '')
      .replace(/^[\s:：>\-|·]+/u, '')
      .replace(/[\s]+$/u, '')
      .trim();
  }

  function stripHeading(value, field) {
    const text = normalizeSectionValue(value);
    if (field === 'minecraftExperience') {
      return normalizeSectionValue(text.replace(/^(?:(?:참여(?:한|해본)?|해본|경험(?:한)?)?\s*마크\s*서버(?:\s*경험)?|참여\s*경험\s*서버|마크\s*경험)\s*[:：>\-|·]?\s*/iu, ''));
    }
    return normalizeSectionValue(text.replace(/^(?:각오\s*및\s*뽑혀야\s*하는\s*이유|(?:내가|제가|[가-힣A-Za-z0-9_.♥♡·]+가)?\s*뽑혀야\s*하는\s*이유|지원\s*(?:하는\s*)?이유|지원\s*사유|신청\s*(?:한|하는)?\s*이유|신청\s*사유)\s*[:：>\-|·]?\s*/iu, ''));
  }

  function findMarkers(text) {
    const markers = [];
    for (const { field, regex } of HEADING_PATTERNS) {
      regex.lastIndex = 0;
      for (const match of text.matchAll(regex)) {
        markers.push({ field, index: match.index, end: match.index + match[0].length });
      }
    }
    markers.sort((a, b) => a.index - b.index || a.end - b.end);
    return markers;
  }

  function parseByHeadings(raw) {
    const markers = findMarkers(raw);
    const out = { minecraftExperience: '', reason: '' };
    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];
      if (out[marker.field]) continue;
      const next = markers.slice(i + 1).find(item => item.index > marker.end);
      const end = next ? next.index : raw.length;
      const value = stripHeading(raw.slice(marker.end, end), marker.field);
      if (value) out[marker.field] = value;
    }
    return out;
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
    return {
      applicationField: structure.applicationField,
      minecraftExperience: structure.experience ? stripHeading(structure.experience, 'minecraftExperience') : headings.minecraftExperience,
      reason: structure.reason ? stripHeading(structure.reason, 'reason') : headings.reason
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

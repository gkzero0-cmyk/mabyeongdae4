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

  function parseApplicantComment(comment) {
    const raw = String(comment || '').replace(/\r\n?/g, '\n').trim();
    const markers = findMarkers(raw);
    const out = { minecraftExperience: '', reason: '' };

    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];
      if (out[marker.field]) continue;
      const next = markers.slice(i + 1).find(item => item.index > marker.end);
      const end = next ? next.index : raw.length;
      const value = normalizeSectionValue(raw.slice(marker.end, end));
      if (value) out[marker.field] = value;
    }

    return out;
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

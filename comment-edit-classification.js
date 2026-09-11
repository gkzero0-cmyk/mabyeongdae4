(function (root, factory) {
  const base = typeof module === 'object' && module.exports
    ? require('./ranking-overrides')
    : root?.RankingUtils;
  const api = factory(base || {});
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RankingUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (base) {
  function normalizeRoleComment(comment) {
    return String(comment || '')
      .replace(/&(?:amp|#0*38|#x0*26);/gi, '&')
      .replace(/&(?:nbsp|#0*160|#x0*a0);/gi, ' ');
  }

  function firstLiveLine(comment) {
    return normalizeRoleComment(comment)
      .split(/\n+/)
      .map(line => line.trim())
      .find(Boolean) || '';
  }

  function hasExplicitAdministrativeSignal(comment) {
    const raw = normalizeRoleComment(comment);
    const normalized = raw.replace(/\s+/g, ' ').trim();
    if (!normalized || !/행정병/u.test(normalized)) return false;

    const line = firstLiveLine(raw).replace(/^[^\p{L}\p{N}]*/u, '').trim();
    const roleStart = /^(?:일반\s*)?(?:간부|병사|병|훈련병|훈병|행정병)(?=$|[\s\/|,;:：()[\]{}<>·&-])/u;
    if (roleStart.test(line) && /행정병/u.test(line)) return true;

    if (/(?:신청|지원)\s*분야\s*(?:[:：\/|\-]\s*)?[^\n]{0,100}행정병/iu.test(raw)) return true;
    if (/행정병\s*(?:으로|로)?\s*(?:신청|지원)/u.test(normalized)) return true;
    if (/(?:간부|병사|병|훈련병|훈병)\s*(?:OR|또는|혹은|&|\/|\|)\s*행정병|행정병\s*(?:OR|또는|혹은|&|\/|\|)\s*(?:간부|병사|병|훈련병|훈병)/iu.test(line)) return true;
    return false;
  }

  function hasExplicitLiveApplicantTypeSignal(comment) {
    const raw = normalizeRoleComment(comment);
    const normalized = raw.replace(/\s+/g, ' ').trim();
    if (!normalized) return false;
    if (hasExplicitAdministrativeSignal(raw)) return true;

    const line = firstLiveLine(raw).replace(/^[^\p{L}\p{N}]*/u, '').trim();
    const mixedPattern = /간부\s*(?:OR|또는|혹은|&|\/|\|)\s*(?:행정병|훈련병|훈병|병사|병)|(?:행정병|훈련병|훈병|병사|병)\s*(?:OR|또는|혹은|&|\/|\|)\s*간부/iu;
    if (mixedPattern.test(line)) return true;
    if (/^(?:일반\s*)?(?:간부|행정병|훈련병|훈병|병사|병)(?=$|[\s\/|,;:：()[\]{}<>·&-])/u.test(line)) return true;
    if (/(?:신청|지원)\s*(?:분야\s*)?[:：\/|\-]\s*[^\n]{0,80}(?:간부|행정병|훈련병|훈병|병사|병)/iu.test(raw)) return true;
    if (/(?:^|\s)[123]\s*지망\s*[:：\-]?\s*[^\n]{0,80}(?:간부|행정병|훈련병|훈병|병사|병)/iu.test(raw)) return true;

    const officerIntent = /간부\s*(?:로\s*)?(?:신청|지원)/i.test(normalized);
    const soldierIntent = /(?:행정병|훈련병|훈병|병사)\s*(?:로\s*)?(?:신청|지원)/i.test(normalized)
      || /(?:^|[^\p{L}\p{N}])병\s*(?:(?:으로|로)\s*)?(?:신청|지원)/iu.test(normalized);
    return officerIntent || soldierIntent;
  }

  const originalAuthority = typeof base.getAuthoritativeApplicantType === 'function'
    ? base.getAuthoritativeApplicantType.bind(base)
    : () => '';
  const baseDetect = typeof base.detectApplicantType === 'function'
    ? base.detectApplicantType.bind(base)
    : () => 'unknown';

  function detectApplicantType(comment) {
    const normalized = normalizeRoleComment(comment);
    if (hasExplicitAdministrativeSignal(normalized)) return 'unknown';
    return baseDetect(normalized);
  }

  function getAuthoritativeApplicantType(itemOrId) {
    if (itemOrId && typeof itemOrId === 'object' && hasExplicitLiveApplicantTypeSignal(itemOrId.comment)) return '';
    return originalAuthority(itemOrId);
  }

  function getMabyeongdaeSeasons(item) {
    const id = String(item?.userId || '').trim().toLowerCase();
    const seasons = base.SOOP_SEASON_ID_MAP?.[id];
    if (!Array.isArray(seasons)) return [];
    return [1, 2, 3].filter(season => seasons.includes(season));
  }

  function hasMabyeongdaeSeason(item, season) {
    return getMabyeongdaeSeasons(item).includes(Number(season));
  }

  function formatMabyeongdaeSeasons(item) {
    return getMabyeongdaeSeasons(item).map(season => `마${season}`).join('·');
  }

  function resolveApplicantType(itemOrComment, manualType) {
    const item = itemOrComment && typeof itemOrComment === 'object' ? itemOrComment : null;
    if (item && hasExplicitLiveApplicantTypeSignal(item.comment)) {
      return detectApplicantType(item.comment);
    }

    const authoritative = item ? originalAuthority(item) : '';
    if (authoritative) return authoritative;

    const manual = String(manualType || '').trim();
    if (['soldier', 'officer', 'unknown'].includes(manual)) return manual;
    return detectApplicantType(item ? item.comment : itemOrComment);
  }

  return {
    ...base,
    normalizeRoleComment,
    hasExplicitAdministrativeSignal,
    hasExplicitLiveApplicantTypeSignal,
    detectApplicantType,
    getAuthoritativeApplicantType,
    resolveApplicantType,
    getMabyeongdaeSeasons,
    hasMabyeongdaeSeason,
    formatMabyeongdaeSeasons
  };
});

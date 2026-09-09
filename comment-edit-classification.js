(function (root, factory) {
  const base = typeof module === 'object' && module.exports
    ? require('./ranking-overrides')
    : root?.RankingUtils;
  const api = factory(base || {});
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RankingUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (base) {
  function hasExplicitLiveApplicantTypeSignal(comment) {
    const raw = String(comment || '');
    const normalized = raw.replace(/\s+/g, ' ').trim();
    if (!normalized) return false;

    const firstLine = raw
      .split(/\n+/)
      .map(line => line.trim())
      .find(Boolean) || '';
    const line = firstLine.replace(/^[^\p{L}\p{N}]*/u, '').trim();

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
  const detect = typeof base.detectApplicantType === 'function'
    ? base.detectApplicantType.bind(base)
    : () => 'unknown';

  function getAuthoritativeApplicantType(itemOrId) {
    if (itemOrId && typeof itemOrId === 'object' && hasExplicitLiveApplicantTypeSignal(itemOrId.comment)) return '';
    return originalAuthority(itemOrId);
  }

  function resolveApplicantType(itemOrComment, manualType) {
    const item = itemOrComment && typeof itemOrComment === 'object' ? itemOrComment : null;
    if (item && hasExplicitLiveApplicantTypeSignal(item.comment)) return detect(item.comment);

    const authoritative = item ? originalAuthority(item) : '';
    if (authoritative) return authoritative;

    const manual = String(manualType || '').trim();
    if (['soldier', 'officer', 'unknown'].includes(manual)) return manual;
    return detect(item ? item.comment : itemOrComment);
  }

  return {
    ...base,
    hasExplicitLiveApplicantTypeSignal,
    getAuthoritativeApplicantType,
    resolveApplicantType
  };
});

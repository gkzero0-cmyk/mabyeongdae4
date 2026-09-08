(function (root, factory) {
  const base = typeof module === 'object' && module.exports
    ? require('./ranking-utils')
    : root?.RankingUtils;
  const api = factory(base || {});
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RankingUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (base) {
  function participationHistoryPattern() {
    return /마(?:병대)?\s*[123](?:\s*(?:[,·\/&]|및|와|과)\s*(?:마(?:병대)?\s*)?[123])*(?:[^\/.\n!?]{0,32}?)(?:참가|참여|출전|경험)/gi;
  }

  function roleHistoryPattern() {
    return /마(?:병대)?\s*[123](?:\s*(?:[,·\/&]|및|와|과)\s*(?:마(?:병대)?\s*)?[123])*\s*[,/:：-]?\s*(?:훈련교관|교관|행정병|훈련병|훈병|병사|간부)(?=\s*(?:[,.)]|(?:로|으로)?\s*(?:참가|참여|활동|근무|복무|출전|경험|했습니다|했|했었|였습니다|이었습니다|였|이었|입니다|임|$)))/gi;
  }

  function historyListPrefix(segment) {
    const match = String(segment || '').match(/^마(?:병대)?\s*[123](?:\s*(?:[,·\/&]|및|와|과)\s*(?:마(?:병대)?\s*)?[123])*/i);
    return match ? match[0] : '';
  }

  function commentRoleSeasons(comment) {
    const text = String(comment || '').replace(/\s+/g, ' ').trim();
    const seasons = new Set();
    for (const match of text.matchAll(roleHistoryPattern())) {
      const prefix = historyListPrefix(match[0]);
      for (const digit of prefix.match(/[123]/g) || []) seasons.add(Number(digit));
    }
    return seasons;
  }

  function getMabyeongdaeSeasons(item) {
    const seasons = new Set(typeof base.getMabyeongdaeSeasons === 'function' ? base.getMabyeongdaeSeasons(item) : []);
    for (const season of commentRoleSeasons(item?.comment)) seasons.add(season);
    return [1, 2, 3].filter(season => seasons.has(season));
  }

  function hasMabyeongdaeSeason(item, season) {
    return getMabyeongdaeSeasons(item).includes(Number(season));
  }

  function formatMabyeongdaeSeasons(item) {
    return getMabyeongdaeSeasons(item).map(season => `마${season}`).join('·');
  }

  function stripPastHistory(text) {
    return String(text || '')
      .replace(participationHistoryPattern(), ' ')
      .replace(roleHistoryPattern(), ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function stripNegativeOfficer(text) {
    return String(text || '')
      .replace(/간부\s*(?:는\s*)?(?:없이|[xX]|아님|말고|제외|지원\s*안\s*함|신청\s*안\s*함|안\s*(?:함|합니다|해요|할게요|하겠습니다))/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function explicitFieldType(text) {
    const types = new Set();
    const pattern = /(?:신청|지원)\s*분야\s*[:：-]?\s*(훈련병|훈병|행정병|병사|병|간부)(?=\s|$|[,./()]|입니다|이에요|예요|임)/gi;
    for (const match of String(text || '').matchAll(pattern)) {
      types.add(match[1] === '간부' ? 'officer' : 'soldier');
    }
    if (types.size > 1) return 'unknown';
    return types.size === 1 ? [...types][0] : '';
  }

  function detectApplicantType(comment) {
    const text = String(comment || '').replace(/\s+/g, ' ').trim();
    if (!text || /후추/i.test(text)) return 'unknown';

    const currentText = stripNegativeOfficer(stripPastHistory(text));
    const fieldType = explicitFieldType(currentText);
    if (fieldType) return fieldType;

    const hasOfficerIntent = /간부\s*(?:로\s*)?(?:신청|지원)/i.test(currentText);
    const hasSoldierIntent = /(?:훈련병|훈병|행정병|병사)\s*(?:로\s*)?(?:신청|지원)/i.test(currentText)
      || /병\s*(?:(?:으로|로)\s*)?(?:신청|지원)/i.test(currentText);

    if (hasOfficerIntent && hasSoldierIntent) return 'unknown';
    if (hasOfficerIntent) return 'officer';
    if (hasSoldierIntent) return 'soldier';

    const hasOfficerWord = /간부/i.test(currentText);
    const hasSoldierWord = /훈련병|훈병|행정병|병사/i.test(currentText)
      || /(?:^|[\s:：,./()\-])병(?=$|[\s,./()\-])/i.test(currentText);

    if (hasOfficerWord && hasSoldierWord) return 'unknown';
    if (hasOfficerWord) return 'officer';
    if (hasSoldierWord) return 'soldier';
    return 'unknown';
  }

  function resolveApplicantType(comment, manualType) {
    const manual = String(manualType || '').trim();
    if (['soldier', 'officer', 'unknown'].includes(manual)) return manual;
    return detectApplicantType(comment);
  }

  return {
    ...base,
    detectApplicantType,
    resolveApplicantType,
    getMabyeongdaeSeasons,
    hasMabyeongdaeSeason,
    formatMabyeongdaeSeasons
  };
});

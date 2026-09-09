(function (root, factory) {
  const base = typeof module === 'object' && module.exports
    ? require('./ranking-utils')
    : root?.RankingUtils;
  const api = factory(base || {});
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RankingUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (base) {
  // Source: mabyeongdae_1_2_3_SOOP_station_mapping.xlsx / 사이트적용용.
  // Only ready=Y rows with a verified SOOP ID are included to avoid false matches.
  const SOOP_SEASON_ID_MAP = Object.freeze({
    'devil0108': Object.freeze([1, 2, 3]),
    'nila25': Object.freeze([1, 2, 3]),
    'cnsgkcnehd74': Object.freeze([1, 2, 3]),
    'hwt1014': Object.freeze([1, 2, 3]),
    'hwayang3': Object.freeze([1, 2, 3]),
    'tjrdbs999': Object.freeze([1, 2, 3]),
    'rjsdnr115': Object.freeze([1, 3]),
    'sikhye1004': Object.freeze([1]),
    'bassokim1': Object.freeze([1]),
    'honeys2': Object.freeze([1, 2]),
    'wkdrn0405': Object.freeze([1]),
    '5959700': Object.freeze([1, 2]),
    'bb0rii': Object.freeze([1]),
    'jaeparkk': Object.freeze([1, 2, 3]),
    'bibitrue': Object.freeze([1]),
    '0e0e4e': Object.freeze([1, 2, 3]),
    'gofl2237': Object.freeze([1, 2, 3]),
    'gyeonjahee': Object.freeze([2, 3]),
    'koo2202': Object.freeze([2, 3]),
    'isq1158': Object.freeze([2]),
    'khj011219': Object.freeze([2]),
    'aksen7833': Object.freeze([2, 3]),
    'niniming': Object.freeze([2, 3]),
    'danchu17': Object.freeze([2, 3]),
    'toocat030': Object.freeze([2, 3]),
    'lika07': Object.freeze([2]),
    'maoruyakr': Object.freeze([2]),
    '42dadada': Object.freeze([2]),
    'dnwnwjdqhr53': Object.freeze([2, 3]),
    'legendhyuk': Object.freeze([2, 3]),
    'bach023': Object.freeze([2, 3]),
    'cctvno': Object.freeze([2, 3]),
    'yjkim5500': Object.freeze([2, 3]),
    'aa6232': Object.freeze([2]),
    'suupercutie': Object.freeze([2]),
    'lhtlgm': Object.freeze([2, 3]),
    'miome3': Object.freeze([3]),
    'yjw5067': Object.freeze([3]),
    'chachki': Object.freeze([3]),
    'choelssu': Object.freeze([3]),
    'chunbongtv': Object.freeze([3]),
    'callmeharuby': Object.freeze([3])
  });

  function normalizeSoopId(value) {
    return String(value || '').trim().toLowerCase();
  }

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
    const idSeasons = SOOP_SEASON_ID_MAP[normalizeSoopId(item?.userId)] || [];
    for (const season of idSeasons) seasons.add(season);
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
    const pattern = /(?:신청|지원)\s*분야\s*(?:[:：\/|-]\s*)?(훈련병|훈병|행정병|병사|병|간부)(?=\s|$|[,./()]|입니다|이에요|예요|임)/gi;
    for (const match of String(text || '').matchAll(pattern)) {
      types.add(match[1] === '간부' ? 'officer' : 'soldier');
    }
    if (types.size > 1) return 'unknown';
    return types.size === 1 ? [...types][0] : '';
  }

  function detectApplicantType(comment) {
    const text = String(comment || '').replace(/\s+/g, ' ').trim();
    if (!text) return 'unknown';

    const currentText = stripNegativeOfficer(stripPastHistory(text));
    const fieldType = explicitFieldType(currentText);
    if (fieldType) return fieldType;
    if (/후추/i.test(currentText)) return 'unknown';

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
    SOOP_SEASON_ID_MAP,
    detectApplicantType,
    resolveApplicantType,
    getMabyeongdaeSeasons,
    hasMabyeongdaeSeason,
    formatMabyeongdaeSeasons
  };
});

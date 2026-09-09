(function (root, factory) {
  const base = typeof module === 'object' && module.exports
    ? require('./ranking-utils')
    : root?.RankingUtils;
  const api = factory(base || {});
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RankingUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (base) {
  const APPLICANT_TYPE_ID_MAP = typeof module === 'object' && module.exports
    ? require('./applicant-types-v3')
    : (typeof globalThis !== 'undefined' && globalThis.Mabyeongdae4ApplicantTypesV3) || Object.freeze({});

  // Source: mabyeongdae_1_2_3_SOOP_station_mapping_updated.xlsx / 사이트적용용.
  // Only ready=Y rows with a verified SOOP ID are included to avoid false matches.
  // 170 ready rows collapse to 169 unique IDs because miome3 is the same broadcaster
  // under two historical display names; its seasons are unioned to [2, 3].
  const SOOP_SEASON_ID_MAP = Object.freeze({
    "015234": Object.freeze([2]),
    "0e0e4e": Object.freeze([1, 2, 3]),
    "333333333327": Object.freeze([2]),
    "42dadada": Object.freeze([2]),
    "5959700": Object.freeze([1, 2]),
    "aa6232": Object.freeze([2]),
    "aksen7833": Object.freeze([2, 3]),
    "alicehiyam": Object.freeze([3]),
    "amaiyk0105": Object.freeze([2]),
    "angel000429": Object.freeze([1, 3]),
    "angrydino": Object.freeze([3]),
    "asdf3845": Object.freeze([3]),
    "b13246": Object.freeze([3]),
    "bach023": Object.freeze([2, 3]),
    "baekdana": Object.freeze([2]),
    "bassokim1": Object.freeze([1]),
    "bb0rii": Object.freeze([1]),
    "bibitrue": Object.freeze([1]),
    "boogi0472": Object.freeze([2]),
    "bureu2002": Object.freeze([3]),
    "buuuuing": Object.freeze([3]),
    "callmeharuby": Object.freeze([3]),
    "cameleon28": Object.freeze([3]),
    "cctvno": Object.freeze([2, 3]),
    "chachki": Object.freeze([3]),
    "chiy0u": Object.freeze([2]),
    "choelssu": Object.freeze([3]),
    "choose": Object.freeze([2]),
    "chunbongtv": Object.freeze([3]),
    "cnsgkcnehd74": Object.freeze([1, 2, 3]),
    "dalhae1129": Object.freeze([3]),
    "danchu17": Object.freeze([2, 3]),
    "darlida": Object.freeze([2]),
    "ddalgishoux": Object.freeze([1]),
    "ddikku0714": Object.freeze([2]),
    "devil0108": Object.freeze([1, 2, 3]),
    "dmng50": Object.freeze([2, 3]),
    "dnwnwjdqhr53": Object.freeze([2, 3]),
    "donggeul2": Object.freeze([3]),
    "dotcha": Object.freeze([3]),
    "dubulang0901": Object.freeze([2, 3]),
    "dwarf2468": Object.freeze([1]),
    "ekrekrnfl9": Object.freeze([1]),
    "emei6259": Object.freeze([2]),
    "etwo22": Object.freeze([1]),
    "eunchr": Object.freeze([1]),
    "fumagochi": Object.freeze([3]),
    "gio12025": Object.freeze([2]),
    "gofl2237": Object.freeze([1, 2, 3]),
    "gyeonjahee": Object.freeze([2, 3]),
    "habee511": Object.freeze([1]),
    "haepalin": Object.freeze([3]),
    "han2243944": Object.freeze([1]),
    "hanamana1015": Object.freeze([1]),
    "harxxxne": Object.freeze([3]),
    "heda221112": Object.freeze([2]),
    "hibby1004": Object.freeze([3]),
    "honeys2": Object.freeze([1, 2]),
    "hwayang3": Object.freeze([1, 2, 3]),
    "hwt1014": Object.freeze([1, 2, 3]),
    "hyu159": Object.freeze([3]),
    "imhanbily": Object.freeze([2]),
    "irumi1523": Object.freeze([2]),
    "isq1158": Object.freeze([2]),
    "jaeparkk": Object.freeze([1, 2, 3]),
    "jangjh5409": Object.freeze([2]),
    "janine95kim": Object.freeze([3]),
    "jjoasseo13": Object.freeze([2, 3]),
    "juin0123": Object.freeze([1]),
    "juns12114": Object.freeze([2, 3]),
    "kbs9981": Object.freeze([2]),
    "kgywjd2210": Object.freeze([3]),
    "khj011219": Object.freeze([2]),
    "kirababy2": Object.freeze([1]),
    "kjhh0029": Object.freeze([1]),
    "kkumjjogi": Object.freeze([3]),
    "kkyubog": Object.freeze([3]),
    "koo2202": Object.freeze([2, 3]),
    "kyct00028": Object.freeze([2]),
    "kyoonah1217": Object.freeze([3]),
    "lafraise13": Object.freeze([2]),
    "lalapin": Object.freeze([3]),
    "leesoi34": Object.freeze([3]),
    "legendhyuk": Object.freeze([2, 3]),
    "lhtlgm": Object.freeze([2, 3]),
    "libre1900": Object.freeze([1]),
    "liebe24": Object.freeze([1]),
    "lika07": Object.freeze([2]),
    "likey0u": Object.freeze([3]),
    "lilith1211": Object.freeze([2]),
    "lkjh1234": Object.freeze([3]),
    "luriruri": Object.freeze([2, 3]),
    "maeji1203": Object.freeze([2]),
    "manlebreadtv": Object.freeze([2]),
    "maoruyakr": Object.freeze([2]),
    "melodingding": Object.freeze([2]),
    "minseongeun": Object.freeze([2]),
    "miome3": Object.freeze([2, 3]),
    "miroticssb": Object.freeze([3]),
    "mj0128": Object.freeze([3]),
    "mjh0718": Object.freeze([3]),
    "monas2": Object.freeze([1, 2]),
    "moolchoco": Object.freeze([1, 2, 3]),
    "morgan427": Object.freeze([3]),
    "nclavis06": Object.freeze([3]),
    "neez0611": Object.freeze([1]),
    "newmayo": Object.freeze([3]),
    "nghdbwpssp": Object.freeze([3]),
    "niconing": Object.freeze([3]),
    "nila25": Object.freeze([1, 2, 3]),
    "niniming": Object.freeze([2, 3]),
    "niniru": Object.freeze([2]),
    "nlov555jij": Object.freeze([3]),
    "nmachuu060": Object.freeze([3]),
    "nmohoho": Object.freeze([2, 3]),
    "nslah830": Object.freeze([3]),
    "nunknown314": Object.freeze([3]),
    "o0opha": Object.freeze([1, 2]),
    "pakkangmon": Object.freeze([1, 2]),
    "phs6162": Object.freeze([3]),
    "pinktape8": Object.freeze([1]),
    "pqf1234": Object.freeze([3]),
    "puyo0805": Object.freeze([1]),
    "qrang513": Object.freeze([1]),
    "quaorv": Object.freeze([2]),
    "rancho0o": Object.freeze([1]),
    "rapja2025": Object.freeze([2, 3]),
    "rjsdnr115": Object.freeze([1, 3]),
    "rkdalstnld": Object.freeze([2]),
    "rlawlsthfw": Object.freeze([2]),
    "rose0957": Object.freeze([1]),
    "rp1227": Object.freeze([3]),
    "ry0135": Object.freeze([3]),
    "sa5791": Object.freeze([1]),
    "sakbi1": Object.freeze([1, 3]),
    "seecom2": Object.freeze([3]),
    "shuhin0817": Object.freeze([2]),
    "sie4yu": Object.freeze([2]),
    "sikhye1004": Object.freeze([1]),
    "singu64": Object.freeze([2, 3]),
    "smpk96": Object.freeze([2]),
    "snyami": Object.freeze([2]),
    "so218218": Object.freeze([3]),
    "sookbong777": Object.freeze([2]),
    "soyoung6056": Object.freeze([2]),
    "spends": Object.freeze([2, 3]),
    "star124": Object.freeze([2]),
    "suupercutie": Object.freeze([2]),
    "tarusama": Object.freeze([1, 2]),
    "thswlstjr666": Object.freeze([3]),
    "tjrdbs999": Object.freeze([1, 2, 3]),
    "toocat030": Object.freeze([2, 3]),
    "toocats": Object.freeze([3]),
    "toree0409": Object.freeze([1]),
    "ugameming": Object.freeze([1]),
    "utahessx33": Object.freeze([2]),
    "villlo": Object.freeze([2]),
    "wellro314": Object.freeze([1]),
    "wkdghdtjr99": Object.freeze([3]),
    "wkdrn0405": Object.freeze([1]),
    "xex3": Object.freeze([2, 3]),
    "ximong": Object.freeze([2]),
    "yeonew": Object.freeze([3]),
    "yeveee": Object.freeze([1, 2]),
    "yjkim5500": Object.freeze([2, 3]),
    "yjw5067": Object.freeze([3]),
    "zzamta0310": Object.freeze([2]),
    "그냥피엘": Object.freeze([1]),
    "도도이이": Object.freeze([1]),
  });

  function normalizeSoopId(value) {
    return String(value || '').trim().toLowerCase();
  }

  function getAuthoritativeApplicantType(itemOrId) {
    const sourceValue = itemOrId && typeof itemOrId === 'object' ? itemOrId.userId : itemOrId;
    const type = APPLICANT_TYPE_ID_MAP[normalizeSoopId(sourceValue)];
    return ['soldier', 'officer', 'unknown'].includes(type) ? type : '';
  }

  function normalizeDisplayName(value) {
    return String(value || '')
      .normalize('NFKC')
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, '');
  }

  function participationHistoryPattern() {
    return /마(?:병대)?\s*[123](?:\s*(?:[,·\/&]|및|와|과)\s*(?:마(?:병대)?\s*)?[123])*(?:[^\/.\n!?]{0,32}?)(?:참가|참여|출전|경험|우승|준우승|수료|졸업)/gi;
  }

  function roleHistoryPattern() {
    return /마(?:병대)?\s*[123](?:\s*(?:[,·\/&]|및|와|과)\s*(?:마(?:병대)?\s*)?[123])*\s*[,/:：-]?\s*(?:훈련교관|교관|행정병|훈련병|훈병|병사|간부)(?=\s*(?:[,.)]|(?:로|으로)?\s*(?:참가|참여|활동|근무|복무|출전|경험|했습니다|했|했었|였습니다|이었습니다|였|이었|입니다|임|$)))/gi;
  }

  function historyListPrefix(segment) {
    const match = String(segment || '').match(/^마(?:병대)?\s*[123](?:\s*(?:[,·\/&]|및|와|과)\s*(?:마(?:병대)?\s*)?[123])*/i);
    return match ? match[0] : '';
  }

  function commentHistorySeasons(comment) {
    const text = String(comment || '').replace(/\s+/g, ' ').trim();
    const seasons = new Set();
    for (const pattern of [participationHistoryPattern(), roleHistoryPattern()]) {
      for (const match of text.matchAll(pattern)) {
        const prefix = historyListPrefix(match[0]);
        for (const digit of prefix.match(/[123]/g) || []) seasons.add(Number(digit));
      }
    }
    return [1, 2, 3].filter(season => seasons.has(season));
  }

  function nameFallbackSeasons(item) {
    const candidates = [item?.userNick, item?.userId].map(normalizeDisplayName).filter(Boolean);
    const rosters = base.MABYEONGDAE_SEASON_NAMES || {};
    return [1, 2, 3].filter(season => {
      const names = Array.isArray(rosters[season]) ? rosters[season] : [];
      return names.some(name => candidates.includes(normalizeDisplayName(name)));
    });
  }

  function getMabyeongdaeSeasons(item) {
    const idSeasons = SOOP_SEASON_ID_MAP[normalizeSoopId(item?.userId)] || [];
    // The updated workbook is authoritative whenever a verified SOOP ID exists.
    // Do not merge nickname or self-reported comment history into a verified mapping.
    if (idSeasons.length) return [...idSeasons];

    const commentSeasons = commentHistorySeasons(item?.comment);
    let seasons;
    if (commentSeasons.length) {
      // Explicit self-reported history is more reliable than a possibly reused/decorated nickname.
      seasons = new Set();
    } else {
      seasons = new Set(nameFallbackSeasons(item));
      if (!seasons.size && typeof base.getMabyeongdaeSeasons === 'function') {
        for (const season of base.getMabyeongdaeSeasons(item)) seasons.add(season);
      }
    }

    for (const season of commentSeasons) seasons.add(season);
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

  function hasStandaloneSoldierToken(text) {
    return /(?:^|[^\p{L}\p{N}])병(?=$|[^\p{L}\p{N}])/u.test(String(text || ''));
  }

  function hasSoldierRole(text) {
    const value = String(text || '');
    return /훈련병|훈병|행정병|병사/i.test(value) || hasStandaloneSoldierToken(value);
  }

  function trimFieldValue(value) {
    return String(value || '')
      .split(/\s*(?:\/|\|)\s*(?=(?:마크|마병대|서버|경험|자기|소개|지원동기|특이사항))/i)[0]
      .split(/(?:(?:마크\s*서버|마크서버|마병대)\s*경험|자기\s*소개|지원\s*동기|특이사항)\s*[:：]/i)[0]
      .trim();
  }

  function explicitFieldType(text) {
    const types = new Set();
    const pattern = /(?:신청|지원)\s*분야\s*(?:[:：\/|\-]\s*)?([^\n]{1,80})/gi;
    for (const match of String(text || '').matchAll(pattern)) {
      const value = trimFieldValue(match[1]);
      const hasOfficer = /간부/i.test(value);
      const hasSoldier = hasSoldierRole(value);
      if (hasOfficer && hasSoldier) return 'unknown';
      if (hasOfficer) types.add('officer');
      if (hasSoldier) types.add('soldier');
    }
    if (types.size > 1) return 'unknown';
    return types.size === 1 ? [...types][0] : '';
  }

  function leadingRoleType(text) {
    const rawFirstLine = String(text || '')
      .split(/\n+/)
      .map(line => line.trim())
      .find(Boolean);
    if (!rawFirstLine) return '';

    const firstLine = stripNegativeOfficer(rawFirstLine);
    const line = firstLine.replace(/^[^\p{L}\p{N}]*/u, '').trim();
    if (!line) return '';

    const mixedPattern = /간부\s*(?:OR|또는|혹은|&|\/|\|)\s*(?:행정병|훈련병|훈병|병사|병)|(?:행정병|훈련병|훈병|병사|병)\s*(?:OR|또는|혹은|&|\/|\|)\s*간부/iu;
    const field = line.match(/^(?:신청|지원)\s*분야\s*[\]】)]?\s*(?:[:：\/|\-]\s*)?(.+)$/iu);
    if (field) {
      const value = trimFieldValue(field[1]);
      if (mixedPattern.test(value)) return 'unknown';
      const hasOfficer = /간부/i.test(value);
      const hasSoldier = hasSoldierRole(value);
      if (hasOfficer && hasSoldier) return 'unknown';
      if (hasOfficer) return 'officer';
      if (hasSoldier) return 'soldier';
      return '';
    }

    if (mixedPattern.test(line)) return 'unknown';

    const match = line.match(/^(?:일반\s*)?(간부|행정병|훈련병|훈병|병사|병)(?=$|[\s\/|,;:：()[\]{}<>·&-])/u);
    if (!match) return '';
    return match[1] === '간부' ? 'officer' : 'soldier';
  }

  function detectApplicantType(comment) {
    const text = String(comment || '').replace(/\s+/g, ' ').trim();
    if (!text) return 'unknown';

    const leadingType = leadingRoleType(comment);
    if (leadingType) return leadingType;

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
    const hasSoldierWord = hasSoldierRole(currentText);

    if (hasOfficerWord && hasSoldierWord) return 'unknown';
    if (hasOfficerWord) return 'officer';
    if (hasSoldierWord) return 'soldier';
    return 'unknown';
  }

  function resolveApplicantType(itemOrComment, manualType) {
    const item = itemOrComment && typeof itemOrComment === 'object' ? itemOrComment : null;
    const authoritative = item ? getAuthoritativeApplicantType(item) : '';
    if (authoritative) return authoritative;

    const manual = String(manualType || '').trim();
    if (['soldier', 'officer', 'unknown'].includes(manual)) return manual;
    return detectApplicantType(item ? item.comment : itemOrComment);
  }

  function rankApplicants(items, options = {}) {
    const excludeFreePass = Boolean(options.excludeFreePass);
    const list = (Array.isArray(items) ? items : [])
      .filter(item => !excludeFreePass || !(typeof base.isFreePassApplicant === 'function' && base.isFreePassApplicant(item)))
      .slice()
      .sort((a, b) => {
        const upDiff = Number(b?.up || 0) - Number(a?.up || 0);
        if (upDiff) return upDiff;
        const parse = typeof base.parseKstDate === 'function' ? base.parseKstDate : value => Date.parse(value) || 0;
        const timeDiff = parse(a?.regDate) - parse(b?.regDate);
        if (timeDiff) return timeDiff;
        return Number(a?.commentNo || 0) - Number(b?.commentNo || 0);
      });
    return list.map((item, index) => ({ ...item, rank: index + 1 }));
  }

  return {
    ...base,
    SOOP_SEASON_ID_MAP,
    APPLICANT_TYPE_ID_MAP,
    getAuthoritativeApplicantType,
    detectApplicantType,
    resolveApplicantType,
    getMabyeongdaeSeasons,
    hasMabyeongdaeSeason,
    formatMabyeongdaeSeasons,
    rankApplicants
  };
});

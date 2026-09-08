(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RankingUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const RANK_CHANGE_TTL_MS = 24 * 60 * 60 * 1000;
  const FREE_PASS_NAMES = Object.freeze(['니니', '망구랑', '유연서', '부르', '새잎', '울산큰고래']);
  const FREE_PASS_SET = new Set(FREE_PASS_NAMES.map(normalizeRosterName));
  const MABYEONGDAE_SEASON_NAMES = Object.freeze({
    1: Object.freeze(['감스트','유소나','조경훈','르마','가습기','유설아','한세긴','화양','갈푸짱','삼성민','은초롱','지피티','고채린','거대별','김바쏘','김웰로','김챠멜','니니','니즈','단비가최고야','댕추','딸기슈몽이','라무','란쵸','리베','리브레','망야','멍보리','모나양','몽나','물초코','박재박','베지','비쥬','뿌요','삭비','서라0','세이나','야뿌','우메밍','유키라','윤키키','이투','초아','카나시','큐랑','키이세','킹냥이','타루','토뤼','파깡','피크리','하나마나','해리']),
    2: Object.freeze(['가습기','감스트','견자희','구본좌','구월이','기찬하','길매기','김병살','김옥독','꾸티뉴','노미래','니니','니니밍','단츄','달리','달묘','댐보이','도르핀','돌돌이','돗비','두부랑','딸기밈','또오냥','띠꾸','라무','랩자','류채아','리리스','리카','마늘빵','마왕루야','말론','맛지','매지','멜로딩딩','모나양','목츄리','물초코','미오메','민성은','박삐삐','박재박','백단아','백시호','빡쏘','빵땅콩','사이다','서라0','설레랑','손냐미','숙봉이','슈','슈힌','시몽','싱유','아눙','유키','오아','오트','왜냐니','울산큰고래','유설아','유소나','유시에','유연서','이메이','조경훈','조디악','죠아써','주드','주예나','쥐돌이쥐돌이','지피티','진호','짬타수아','초귀요미','츄즈','치유','쿠아','키이세','타루','파깡','하밍','한비','해리','헤다','헤스','홍타쿠','화양','힙비']),
    3: Object.freeze(['감스트','유소나','조경훈','가습기','강뿌잉','강주이','견자희','고미호','고채린','구본좌','김부각','김땃쥐','김자','꾸티뉴','뀨복','나몽','냥쏘','너보링','눈묘','니니밍','니코','단츄','달묘','달해','댐보이','돗챠','두부랑','또오냥','라거머핀','랩자','렌링','류새콤','말론','맛지','맨유박사','목츄리','물초코','미현영','박재박','백하','베지','봄세이','부르','부잉이','빡룡','빵땅콩','삐요코','삭비','새마요','새잎','설레랑','소유나','손진석','송소미','숙희','시나몬','싱유','앨리스얌','여백이다','오늘님','오아','울산큰고래','유연서','재닌','조디악','죠아써','지피티','쪽잉','찐랑','차쯔키','철쑤','춘봉','클라비스','키이세','타요','탱구','투냥츠','푸마고치','피치','하루네','하루비','해리','해파린','헤에','호미밍','홍타쿠','화양씨','효재'])
  });
  const MABYEONGDAE_SEASON_SETS = Object.freeze(Object.fromEntries(
    Object.entries(MABYEONGDAE_SEASON_NAMES).map(([season, names]) => [season, new Set(names.map(normalizeRosterName))])
  ));

  function normalizeRosterName(value) {
    return String(value || '').trim().replace(/\s+/g, '').toLowerCase();
  }

  function isFreePassApplicant(item) {
    return FREE_PASS_SET.has(normalizeRosterName(item?.userNick)) || FREE_PASS_SET.has(normalizeRosterName(item?.userId));
  }

  function getMabyeongdaeSeasons(item) {
    const candidates = [normalizeRosterName(item?.userNick), normalizeRosterName(item?.userId)].filter(Boolean);
    return [1, 2, 3].filter(season => candidates.some(name => MABYEONGDAE_SEASON_SETS[season].has(name)));
  }

  function hasMabyeongdaeSeason(item, season) {
    return getMabyeongdaeSeasons(item).includes(Number(season));
  }

  function formatMabyeongdaeSeasons(item) {
    return getMabyeongdaeSeasons(item).map(season => `마${season}`).join('·');
  }

  function calculateUpStats(items) {
    const list = Array.isArray(items) ? items : [];
    const total = list.reduce((sum, item) => {
      const value = Number(item?.up || 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
    return { total, average: list.length ? total / list.length : 0 };
  }

  function shouldCollapseComment(comment, limit = 80) {
    const text = String(comment || '');
    return /[\r\n]/.test(text) || text.length > limit;
  }

  function favoriteKey(item) {
    const commentNo = String(item?.commentNo || '').trim();
    if (commentNo) return `comment:${commentNo}`;
    const userId = String(item?.userId || '').trim();
    const regDate = String(item?.regDate || '').trim();
    return `user:${userId}|${regDate}`;
  }

  function buildRankMap(ranked) {
    const map = new Map();
    for (const item of ranked || []) {
      const rank = Number(item?.rank);
      if (Number.isFinite(rank) && rank > 0) map.set(favoriteKey(item), rank);
    }
    return map;
  }

  function getRankChange(currentRank, previousRank) {
    const current = Number(currentRank);
    const previous = Number(previousRank);
    if (!Number.isFinite(current) || !Number.isFinite(previous) || current === previous) return null;
    return {
      direction: current < previous ? 'up' : 'down',
      from: previous,
      to: current,
      delta: Math.abs(previous - current)
    };
  }

  function normalizeRankChangeEntry(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const direction = value.direction === 'up' || value.direction === 'down' ? value.direction : '';
    const from = Number(value.from);
    const to = Number(value.to);
    const delta = Number(value.delta);
    const changedAt = Number(value.changedAt);
    if (!direction || !Number.isFinite(from) || !Number.isFinite(to) || !Number.isFinite(delta) || !Number.isFinite(changedAt)) return null;
    if (from <= 0 || to <= 0 || delta <= 0 || changedAt <= 0) return null;
    return { direction, from, to, delta, changedAt };
  }

  function isRankChangeActive(entry, nowMs = Date.now()) {
    const normalized = normalizeRankChangeEntry(entry);
    if (!normalized || !Number.isFinite(nowMs)) return false;
    const age = nowMs - normalized.changedAt;
    return age >= 0 && age < RANK_CHANGE_TTL_MS;
  }

  function readRankChangeHistory(raw, nowMs = Date.now()) {
    let parsed;
    try {
      parsed = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : JSON.parse(String(raw || '{}'));
    } catch {
      return {};
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out = {};
    for (const [key, value] of Object.entries(parsed)) {
      const normalized = normalizeRankChangeEntry(value);
      if (normalized && isRankChangeActive(normalized, nowMs)) out[String(key)] = normalized;
    }
    return out;
  }

  function recordRankChange(history, key, change, nowMs = Date.now()) {
    const cleanKey = String(key || '').trim();
    const next = readRankChangeHistory(history && typeof history === 'object' ? history : {}, nowMs);
    if (!cleanKey || !change || typeof change !== 'object') return next;
    const entry = normalizeRankChangeEntry({ ...change, changedAt: nowMs });
    if (entry) next[cleanKey] = entry;
    return next;
  }

  function getActiveRankChange(history, key, nowMs = Date.now()) {
    const cleanKey = String(key || '').trim();
    if (!cleanKey || !history || typeof history !== 'object') return null;
    const entry = normalizeRankChangeEntry(history[cleanKey]);
    return entry && isRankChangeActive(entry, nowMs) ? entry : null;
  }

  function parseKstDate(value) {
    if (!value) return 0;
    const raw = String(value).trim();
    const naive = raw.match(/^(\d{4})[.-](\d{1,2})[.-](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (naive) {
      const [, y, m, d, hh = '0', mm = '0', ss = '0'] = naive;
      return Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh) - 9, Number(mm), Number(ss));
    }
    const normalized = raw.replace(/\./g, '-');
    const parsed = Date.parse(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function kstDayKey(ms) {
    if (!Number.isFinite(ms)) return '';
    const shifted = new Date(ms + KST_OFFSET_MS);
    return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
  }

  function isKstToday(value, nowMs = Date.now()) {
    const timestamp = parseKstDate(value);
    return Boolean(timestamp && timestamp <= nowMs && kstDayKey(timestamp) === kstDayKey(nowMs));
  }

  function countKstToday(comments, nowMs = Date.now()) {
    return (comments || []).reduce((count, item) => count + (isKstToday(item?.regDate, nowMs) ? 1 : 0), 0);
  }

  function readFavoriteIds(raw) {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return [...new Set(parsed.map(x => String(x || '').trim()).filter(Boolean))];
    } catch {
      return [];
    }
  }

  function toggleFavoriteId(ids, id) {
    const key = String(id || '').trim();
    const set = new Set((ids || []).map(x => String(x || '').trim()).filter(Boolean));
    if (!key) return [...set];
    if (set.has(key)) set.delete(key); else set.add(key);
    return [...set];
  }

  function detectApplicantType(comment) {
    const text = String(comment || '').replace(/\s+/g, ' ').trim();
    if (!text || /후추/i.test(text)) return 'unknown';

    const hasOfficer = /간부/i.test(text);
    const hasSoldier = /병사|행정병/i.test(text) || /신청\s*분야\s*[:：]?\s*병(?:\s|$|[\/,.)])/i.test(text);

    if (hasOfficer && hasSoldier) return 'unknown';
    if (hasOfficer) return 'officer';
    if (hasSoldier) return 'soldier';
    return 'unknown';
  }

  function resolveApplicantType(comment, manualType) {
    const manual = String(manualType || '').trim();
    if (['soldier', 'officer', 'unknown'].includes(manual)) return manual;
    return detectApplicantType(comment);
  }

  function readObjectMap(raw) {
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      const out = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'string') out[String(key)] = value;
      }
      return out;
    } catch {
      return {};
    }
  }

  function cyclePassState(state) {
    if (state === 'pass') return 'excluded';
    if (state === 'excluded') return 'none';
    return 'pass';
  }

  function exportSettings(settings = {}) {
    const normalized = {
      version: 1,
      favorites: [...new Set((settings.favorites || []).map(x => String(x || '').trim()).filter(Boolean))],
      applicantTypes: Object.fromEntries(Object.entries(settings.applicantTypes || {}).filter(([, v]) => typeof v === 'string')),
      passStates: Object.fromEntries(Object.entries(settings.passStates || {}).filter(([, v]) => typeof v === 'string'))
    };
    return JSON.stringify(normalized, null, 2);
  }

  function importSettings(raw) {
    const parsed = JSON.parse(String(raw || '{}'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('설정 파일 형식이 올바르지 않습니다.');
    return {
      version: Number(parsed.version) || 1,
      favorites: [...new Set((Array.isArray(parsed.favorites) ? parsed.favorites : []).map(x => String(x || '').trim()).filter(Boolean))],
      applicantTypes: Object.fromEntries(Object.entries(parsed.applicantTypes || {}).filter(([, v]) => typeof v === 'string')),
      passStates: Object.fromEntries(Object.entries(parsed.passStates || {}).filter(([, v]) => typeof v === 'string'))
    };
  }

  return {
    favoriteKey,
    buildRankMap,
    getRankChange,
    parseKstDate,
    countKstToday,
    isKstToday,
    readFavoriteIds,
    toggleFavoriteId,
    detectApplicantType,
    resolveApplicantType,
    readObjectMap,
    cyclePassState,
    exportSettings,
    importSettings,
    FREE_PASS_NAMES,
    isFreePassApplicant,
    calculateUpStats,
    shouldCollapseComment,
    RANK_CHANGE_TTL_MS,
    readRankChangeHistory,
    recordRankChange,
    getActiveRankChange,
    MABYEONGDAE_SEASON_NAMES,
    getMabyeongdaeSeasons,
    hasMabyeongdaeSeason,
    formatMabyeongdaeSeasons
  };
});

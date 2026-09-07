(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RankingUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const FREE_PASS_NAMES = Object.freeze(['니니', '망구랑', '유연서', '부르', '새잎', '울산큰고래']);
  const FREE_PASS_SET = new Set(FREE_PASS_NAMES.map(normalizeRosterName));

  function normalizeRosterName(value) {
    return String(value || '').trim().replace(/\s+/g, '').toLowerCase();
  }

  function isFreePassApplicant(item) {
    return FREE_PASS_SET.has(normalizeRosterName(item?.userNick)) || FREE_PASS_SET.has(normalizeRosterName(item?.userId));
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
    shouldCollapseComment
  };
});

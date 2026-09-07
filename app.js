(() => {
  const REFRESH_MS = 1000;
  const STORAGE = {
    favorites: 'mabyeongdae4-up-ranking:favorites:v1',
    types: 'mabyeongdae4-up-ranking:types:v1'
  };
  const {
    favoriteKey, buildRankMap, getRankChange, parseKstDate, countKstToday, isKstToday,
    readFavoriteIds, toggleFavoriteId, detectApplicantType, resolveApplicantType,
    readObjectMap, exportSettings, importSettings, FREE_PASS_NAMES, isFreePassApplicant,
    calculateUpStats, shouldCollapseComment
  } = window.RankingUtils;

  const $ = id => document.getElementById(id);
  const els = {
    tbody: $('tbody'), total: $('totalCount'), topUp: $('topUp'), totalUp: $('totalUp'), averageUp: $('averageUp'),
    soldierCount: $('soldierCount'), officerCount: $('officerCount'), passCount: $('passCount'),
    newApplicant: $('newApplicantCount'), search: $('searchInput'), status: $('status'), notice: $('notice'),
    refresh: $('refreshBtn'), activeFilterText: $('activeFilterText'),
    favoriteFilter: $('favoriteFilterBtn'), soldierFilter: $('soldierFilterBtn'), officerFilter: $('officerFilterBtn'),
    unknownFilter: $('unknownFilterBtn'), passFilter: $('passFilterBtn'), excludedFilter: $('excludedFilterBtn'),
    exportBtn: $('exportSettingsBtn'), importInput: $('importSettingsInput'),
    sortButtons: [...document.querySelectorAll('[data-sort]')]
  };

  let all = [];
  let loading = false;
  let sortMode = 'up';
  let typeFilter = 'all';
  let freePassMode = 'include';
  let favoritesOnly = false;
  let favoriteIds = readFavoriteIds(localStorage.getItem(STORAGE.favorites));
  let applicantTypes = readObjectMap(localStorage.getItem(STORAGE.types));
  let previousRanks = new Map();
  let rankChanges = new Map();
  let hasRankBaseline = false;
  const expandedComments = new Set();
  const fmt = new Intl.NumberFormat('ko-KR');
  const esc = s => String(s ?? '').replace(/[&<>'"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const station = id => `https://www.sooplive.com/station/${encodeURIComponent(id)}`;
  const profile = id => {
    const clean = String(id || '').trim();
    if (!clean) return '';
    return `https://profile.img.sooplive.co.kr/LOGO/${clean.slice(0,2).toLowerCase()}/${clean}/${clean}.jpg`;
  };
  const parseTime = value => parseKstDate(value) || 0;
  const prettyDate = value => {
    const timestamp = parseKstDate(value);
    if (!timestamp) return String(value || '-');
    return new Intl.DateTimeFormat('ko-KR', { timeZone:'Asia/Seoul', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false }).format(new Date(timestamp));
  };

  function sortRank(list) {
    return [...list].sort((a, b) => {
      const upDiff = Number(b.up || 0) - Number(a.up || 0);
      if (upDiff) return upDiff;
      const timeDiff = parseTime(a.regDate) - parseTime(b.regDate);
      if (timeDiff) return timeDiff;
      return Number(a.commentNo || 0) - Number(b.commentNo || 0);
    });
  }

  function sortView(ranked) {
    if (sortMode === 'newest') return [...ranked].sort((a,b) => parseTime(b.regDate) - parseTime(a.regDate) || Number(b.commentNo || 0) - Number(a.commentNo || 0));
    if (sortMode === 'oldest') return [...ranked].sort((a,b) => parseTime(a.regDate) - parseTime(b.regDate) || Number(a.commentNo || 0) - Number(b.commentNo || 0));
    return ranked;
  }

  function saveSettings() {
    localStorage.setItem(STORAGE.favorites, JSON.stringify(favoriteIds));
    localStorage.setItem(STORAGE.types, JSON.stringify(applicantTypes));
  }

  function getType(item) {
    const key = favoriteKey(item);
    return resolveApplicantType(item.comment, applicantTypes[key]);
  }

  function typeLabel(type) {
    return type === 'soldier' ? '병사' : type === 'officer' ? '간부' : '미분류';
  }

  function rankChangeHtml(item) {
    const change = rankChanges.get(favoriteKey(item));
    if (!change) return '';
    const arrow = change.direction === 'up' ? '▲' : '▼';
    return `<span class="rank-change ${change.direction}"><span class="from-to">${change.from}위 → ${change.to}위</span>${arrow}${change.delta}</span>`;
  }

  function updateFilterButtons() {
    els.soldierFilter.classList.toggle('active', typeFilter === 'soldier');
    els.officerFilter.classList.toggle('active', typeFilter === 'officer');
    els.unknownFilter.classList.toggle('active', typeFilter === 'unknown');
    els.favoriteFilter.classList.toggle('active', favoritesOnly);
    els.passFilter.classList.toggle('active', freePassMode === 'include');
    els.excludedFilter.classList.toggle('active', freePassMode === 'exclude');
    els.sortButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.sort === sortMode));
  }

  function render() {
    const ranked = sortRank(all).map((item, index) => ({ ...item, rank: index + 1 }));
    const favoriteSet = new Set(favoriteIds);
    const q = els.search.value.trim().toLowerCase();
    const counts = ranked.reduce((acc, item) => {
      const type = getType(item);
      if (type === 'soldier') acc.soldier++;
      if (type === 'officer') acc.officer++;
      if (isFreePassApplicant(item)) acc.freePass++;
      return acc;
    }, { soldier:0, officer:0, freePass:0 });
    const upStats = calculateUpStats(ranked);

    const view = sortView(ranked).filter(item => {
      const key = favoriteKey(item);
      if (favoritesOnly && !favoriteSet.has(key)) return false;
      if (typeFilter !== 'all' && getType(item) !== typeFilter) return false;
      if (freePassMode === 'exclude' && isFreePassApplicant(item)) return false;
      if (!q) return true;
      return `${item.userNick} ${item.userId} ${item.comment}`.toLowerCase().includes(q);
    });

    els.total.textContent = fmt.format(ranked.length);
    els.topUp.textContent = ranked.length ? fmt.format(ranked[0].up || 0) : '-';
    els.totalUp.textContent = fmt.format(upStats.total);
    els.averageUp.textContent = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(upStats.average);
    els.soldierCount.textContent = fmt.format(counts.soldier);
    els.officerCount.textContent = fmt.format(counts.officer);
    els.passCount.textContent = fmt.format(counts.freePass);
    els.newApplicant.textContent = fmt.format(countKstToday(all));
    els.favoriteFilter.textContent = `★ 즐겨찾기 ${fmt.format(favoriteIds.length)}`;
    els.passFilter.textContent = `✓ 프리패스 포함 ${fmt.format(FREE_PASS_NAMES.length)}명`;
    els.excludedFilter.textContent = '× 프리패스 제외';
    updateFilterButtons();

    const filterNames = [];
    if (typeFilter !== 'all') filterNames.push(typeLabel(typeFilter));
    if (freePassMode === 'exclude') filterNames.push('프리패스 제외');
    if (favoritesOnly) filterNames.push('즐겨찾기');
    els.activeFilterText.textContent = filterNames.length ? `${filterNames.join(' · ')} 필터 · ${fmt.format(view.length)}명 표시` : `전체 신청자 · ${fmt.format(view.length)}명 표시`;

    if (!view.length) {
      els.tbody.innerHTML = `<tr><td colspan="7"><div class="empty">조건에 맞는 신청자가 없습니다.</div></td></tr>`;
      return;
    }

    let html = '';
    for (const item of view) {
      const key = favoriteKey(item);
      const favorite = favoriteSet.has(key);
      const image = profile(item.userId);
      const avatar = item.userId
        ? `<a class="avatar-link" href="${station(item.userId)}" target="_blank" rel="noopener noreferrer" title="${esc(item.userNick)} 방송국 열기"><img class="avatar" src="${image}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="avatar-fallback" style="display:none">↗</span></a>`
        : '<span class="avatar-link"><span class="avatar-fallback">?</span></span>';
      const autoType = detectApplicantType(item.comment);
      const currentType = getType(item);
      const typeClass = currentType === 'soldier' ? 'type-soldier' : currentType === 'officer' ? 'type-officer' : 'type-unknown';
      const isNew = isKstToday(item.regDate);
      const freePass = isFreePassApplicant(item);
      const expanded = expandedComments.has(key);
      const collapsible = shouldCollapseComment(item.comment);
      const commentUrl = item.commentUrl || `https://www.sooplive.com/station/devil0108/post/206507027${item.commentNo ? `#comment_noti${encodeURIComponent(item.commentNo)}` : ''}`;
      html += `<tr data-rank="${item.rank}">
        <td class="rank"><div class="rank-stack"><span class="rank-badge">${item.rank}</span>${rankChangeHtml(item)}</div></td>
        <td class="user"><div class="userbox">${avatar}<div class="names"><div class="name-row"><span class="nick">${esc(item.userNick)}</span>${isNew ? '<span class="new-badge">New</span>' : ''}${freePass ? '<span class="free-pass-badge">프리패스</span>' : ''}<button class="favorite-btn${favorite ? ' active' : ''}" data-key="${esc(key)}" type="button" title="${favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}">${favorite ? '★' : '☆'}</button></div><div class="id">${esc(item.userId || '-')}</div></div></div></td>
        <td class="comment"><div class="comment-wrap"><span class="comment-text${expanded ? ' expanded' : ' collapsed'}">${esc(item.comment || '-')}</span>${collapsible ? `<button class="comment-toggle-btn" type="button" data-key="${esc(key)}">${expanded ? '접기' : '더보기'}</button>` : ''}<span class="tag-auto">자동분류: ${typeLabel(autoType)}</span></div></td>
        <td class="type"><select class="applicant-type-select ${typeClass}" data-key="${esc(key)}"><option value="auto"${applicantTypes[key] == null ? ' selected' : ''}>자동 (${typeLabel(autoType)})</option><option value="soldier"${applicantTypes[key] === 'soldier' ? ' selected' : ''}>병사</option><option value="officer"${applicantTypes[key] === 'officer' ? ' selected' : ''}>간부</option><option value="unknown"${applicantTypes[key] === 'unknown' ? ' selected' : ''}>미분류</option></select></td>
        <td class="up"><span class="upnum">${fmt.format(item.up || 0)}</span></td>
        <td class="time">${esc(prettyDate(item.regDate))}</td>
        <td class="link"><a class="comment-link" href="${esc(commentUrl)}" target="_blank" rel="noopener noreferrer">신청 댓글 보기 ↗</a></td>
      </tr>`;
    }
    els.tbody.innerHTML = html;
  }

  function updateRankHistory(nextAll) {
    const ranked = sortRank(nextAll).map((item, index) => ({ ...item, rank: index + 1 }));
    const nextRanks = buildRankMap(ranked);
    const nextChanges = new Map();
    if (hasRankBaseline) {
      for (const item of ranked) {
        const key = favoriteKey(item);
        const change = getRankChange(item.rank, previousRanks.get(key));
        if (change) nextChanges.set(key, change);
      }
    }
    previousRanks = nextRanks;
    rankChanges = nextChanges;
    hasRankBaseline = true;
  }

  async function load(manual = false) {
    if (loading) return;
    loading = true;
    if (manual) {
      els.refresh.disabled = true;
      els.refresh.textContent = '↻ 불러오는 중';
    }
    try {
      const response = await fetch(`/api/comments?t=${Date.now()}`, { cache:'no-store' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const nextAll = Array.isArray(data.comments) ? data.comments : [];
      updateRankHistory(nextAll);
      all = nextAll;
      render();
      const time = new Date(data.fetchedAt || Date.now()).toLocaleTimeString('ko-KR', { timeZone:'Asia/Seoul', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
      els.status.innerHTML = `<strong>${time}</strong> 기준 · ${manual ? '수동 갱신 완료' : '1초 자동 갱신 중'}`;
      els.notice.classList.remove('show');
      els.notice.textContent = '';
    } catch (error) {
      els.status.textContent = '최근 데이터 갱신 실패';
      els.notice.textContent = `SOOP 데이터를 불러오지 못했습니다. 자동으로 다시 시도합니다. (${error.message})`;
      els.notice.classList.add('show');
      if (!all.length) els.tbody.innerHTML = '<tr><td colspan="7"><div class="empty">댓글 데이터를 불러오지 못했습니다.</div></td></tr>';
    } finally {
      loading = false;
      if (manual) {
        els.refresh.disabled = false;
        els.refresh.textContent = '↻ 지금 새로고침';
      }
    }
  }

  function toggleTypeFilter(next) {
    typeFilter = typeFilter === next ? 'all' : next;
    render();
  }

  els.search.addEventListener('input', render);
  els.sortButtons.forEach(btn => btn.addEventListener('click', () => { sortMode = btn.dataset.sort || 'up'; render(); }));
  els.soldierFilter.addEventListener('click', () => toggleTypeFilter('soldier'));
  els.officerFilter.addEventListener('click', () => toggleTypeFilter('officer'));
  els.unknownFilter.addEventListener('click', () => toggleTypeFilter('unknown'));
  els.favoriteFilter.addEventListener('click', () => { favoritesOnly = !favoritesOnly; render(); });
  els.passFilter.addEventListener('click', () => { freePassMode = 'include'; render(); });
  els.excludedFilter.addEventListener('click', () => { freePassMode = 'exclude'; render(); });
  els.refresh.addEventListener('click', () => load(true));

  els.tbody.addEventListener('click', event => {
    const favoriteButton = event.target.closest('.favorite-btn');
    if (favoriteButton) {
      favoriteIds = toggleFavoriteId(favoriteIds, favoriteButton.dataset.key || '');
      saveSettings();
      render();
      return;
    }
    const commentToggle = event.target.closest('.comment-toggle-btn');
    if (commentToggle) {
      const key = commentToggle.dataset.key || '';
      if (expandedComments.has(key)) expandedComments.delete(key); else expandedComments.add(key);
      render();
    }
  });

  els.tbody.addEventListener('change', event => {
    const select = event.target.closest('.applicant-type-select');
    if (!select) return;
    const key = select.dataset.key || '';
    if (select.value === 'auto') delete applicantTypes[key]; else applicantTypes[key] = select.value;
    saveSettings();
    render();
  });

  els.exportBtn.addEventListener('click', () => {
    const json = exportSettings({ favorites: favoriteIds, applicantTypes });
    const blob = new Blob([json], { type:'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mabyeongdae4-ranking-settings-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  els.importInput.addEventListener('change', async () => {
    const file = els.importInput.files?.[0];
    if (!file) return;
    try {
      const imported = importSettings(await file.text());
      favoriteIds = imported.favorites;
      applicantTypes = imported.applicantTypes;
      saveSettings();
      render();
      els.notice.textContent = '설정 파일을 불러왔습니다.';
      els.notice.classList.add('show');
      setTimeout(() => els.notice.classList.remove('show'), 2200);
    } catch (error) {
      els.notice.textContent = `설정 파일을 불러오지 못했습니다. (${error.message})`;
      els.notice.classList.add('show');
    } finally {
      els.importInput.value = '';
    }
  });

  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(false); });
  render();
  load(false);
  setInterval(() => { if (!document.hidden) load(false); }, REFRESH_MS);
})();

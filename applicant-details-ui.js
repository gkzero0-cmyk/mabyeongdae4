(() => {
  const details = window.ApplicantDetails;
  const utils = window.RankingUtils;
  if (!details || !utils) return;

  const API_URL = '/api/comments';
  const fmt = new Intl.NumberFormat('ko-KR');
  const topUp = document.getElementById('topUp');
  const tbody = document.getElementById('tbody');
  const historySummaryBtn = document.getElementById('historySummaryBtn');
  let comments = [];
  let byUserId = new Map();
  let lastFetchAt = 0;
  let experiencedCount = null;
  let refreshPromise = null;

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  }[char]));

  function profileUrl(id) {
    const clean = String(id || '').trim();
    if (!clean) return '';
    return `https://profile.img.sooplive.co.kr/LOGO/${clean.slice(0,2).toLowerCase()}/${clean}/${clean}.jpg`;
  }

  function stationUrl(id) {
    return `https://www.sooplive.com/station/${encodeURIComponent(String(id || '').trim())}`;
  }

  function normalizeFieldLabel(text, item) {
    const label = String(text || '').trim();
    const direct = label.match(/(행정병|병사|간부|미분류)/u);
    if (direct) return direct[1] === '미분류' ? '행정병' : direct[1];
    const resolved = typeof utils.resolveApplicantType === 'function' ? utils.resolveApplicantType(item) : 'unknown';
    return resolved === 'soldier' ? '병사' : resolved === 'officer' ? '간부' : '행정병';
  }

  function ensureModal() {
    let modal = document.getElementById('applicantDetailModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'applicantDetailModal';
    modal.className = 'applicant-detail-modal';
    modal.hidden = true;
    modal.innerHTML = '<div class="applicant-detail-backdrop" data-detail-close></div><section class="applicant-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="applicantDetailTitle"><div id="applicantDetailContent"></div></section>';
    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
      if (event.target.closest('[data-detail-close]')) closeModal();
    });
    return modal;
  }

  function closeModal() {
    const modal = document.getElementById('applicantDetailModal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('detail-modal-open');
  }

  function ensureHistoryModal() {
    let modal = document.getElementById('historySummaryModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'historySummaryModal';
    modal.className = 'history-summary-modal';
    modal.hidden = true;
    modal.innerHTML = '<div class="applicant-detail-backdrop" data-history-close></div><section class="history-summary-dialog" role="dialog" aria-modal="true" aria-labelledby="historySummaryTitle"><div id="historySummaryContent"></div></section>';
    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
      if (event.target.closest('[data-history-close]')) closeHistoryModal();
    });
    return modal;
  }

  function closeHistoryModal() {
    const modal = document.getElementById('historySummaryModal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('detail-modal-open');
  }

  function photoGalleryHtml(item) {
    const urls = details.getApplicantPhotoUrls(item);
    if (!urls.length) {
      return '<div class="applicant-photo-empty"><span>▧</span><strong>첨부된 사진 없음</strong><p>신청 댓글에 첨부된 이미지가 없습니다.</p></div>';
    }
    return `<div class="applicant-photo-grid ${urls.length > 1 ? 'multiple' : 'single'}">${urls.map((url, index) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="applicant-photo-link"><img src="${esc(url)}" alt="${esc(item.userNick)} 신청 첨부 사진 ${index + 1}" loading="lazy"></a>`).join('')}</div>`;
  }

  function renderModal(item, row) {
    const parsed = details.parseApplicantComment(item.comment);
    const seasons = typeof utils.getMabyeongdaeSeasons === 'function' ? utils.getMabyeongdaeSeasons(item) : [];
    const seasonBadges = seasons.map(season => `<span class="detail-season-badge">마병대 ${season}</span>`).join('');
    const select = row?.querySelector('.applicant-type-select');
    const selectedText = select?.options?.[select.selectedIndex]?.textContent || '';
    const fieldLabel = normalizeFieldLabel(selectedText, item);
    const fieldClass = fieldLabel === '병사' ? 'soldier' : fieldLabel === '간부' ? 'officer' : 'unknown';
    const commentUrl = item.commentUrl || `https://www.sooplive.com/station/devil0108/post/206507027${item.commentNo ? `#comment_noti${encodeURIComponent(item.commentNo)}` : ''}`;
    const experience = parsed.minecraftExperience || '신청 댓글에서 마크서버경험 내용을 구분하지 못했습니다.';
    const reason = parsed.reason || '신청 댓글에서 뽑혀야 하는 이유/지원 이유 내용을 구분하지 못했습니다.';
    const image = profileUrl(item.userId);

    const modal = ensureModal();
    const content = modal.querySelector('#applicantDetailContent');
    content.innerHTML = `
      <header class="applicant-detail-header">
        <div class="applicant-detail-identity">
          <img class="applicant-detail-avatar" src="${esc(image)}" alt="" onerror="this.style.display='none'">
          <div>
            <div class="applicant-detail-name-row">
              <h2 id="applicantDetailTitle">${esc(item.userNick || item.userId || '신청자')}</h2>
              <span class="detail-field-badge ${fieldClass}">${esc(fieldLabel)}</span>
            </div>
            <div class="applicant-detail-id">${esc(item.userId || '-')}</div>
            <div class="detail-season-badges">${seasonBadges || '<span class="detail-first-badge">마병대 첫 참가</span>'}</div>
          </div>
        </div>
        <button class="applicant-detail-close" type="button" data-detail-close aria-label="닫기">×</button>
      </header>
      <div class="applicant-detail-main">
        <div class="applicant-detail-copy">
          <section class="detail-section">
            <h3>신청 분야</h3>
            <p class="detail-application-field ${fieldClass}">${esc(fieldLabel)}</p>
          </section>
          <section class="detail-section">
            <h3>마크서버경험</h3>
            <p>${esc(experience)}</p>
          </section>
          <section class="detail-section">
            <h3>뽑혀야 하는 이유</h3>
            <p>${esc(reason)}</p>
          </section>
          <details class="detail-original-comment">
            <summary>신청 댓글 원문 보기</summary>
            <p>${esc(item.comment || '-')}</p>
          </details>
        </div>
        <aside class="applicant-detail-photos" aria-label="신청 댓글 첨부 사진">
          <div class="detail-photo-title">신청 댓글 첨부 사진</div>
          ${photoGalleryHtml(item)}
        </aside>
      </div>
      <footer class="applicant-detail-footer">
        <a class="detail-link primary" href="${esc(commentUrl)}" target="_blank" rel="noopener noreferrer">신청 댓글 원문 보기 ↗</a>
        <a class="detail-link" href="${esc(stationUrl(item.userId))}" target="_blank" rel="noopener noreferrer">방송국 보기 ↗</a>
      </footer>`;

    modal.hidden = false;
    document.body.classList.add('detail-modal-open');
    modal.querySelector('.applicant-detail-close')?.focus();
  }

  function careerEntries() {
    return comments
      .map(item => ({ item, seasons: utils.getMabyeongdaeSeasons(item) }))
      .filter(entry => entry.seasons.length)
      .sort((a, b) => String(a.item.userNick || a.item.userId || '').localeCompare(String(b.item.userNick || b.item.userId || ''), 'ko'));
  }

  function careerNameChips(entries) {
    if (!entries.length) return '<span class="history-empty">해당 신청자 없음</span>';
    return `<div class="history-name-list">${entries.map(({ item }) => `<span class="history-name-chip">${esc(item.userNick || item.userId || '-')}</span>`).join('')}</div>`;
  }

  function renderHistorySummary() {
    const entries = careerEntries();
    const bySeason = season => entries.filter(entry => entry.seasons.includes(season));
    const allThree = entries.filter(entry => [1,2,3].every(season => entry.seasons.includes(season)));
    const twoThree = entries.filter(entry => entry.seasons.includes(2) && entry.seasons.includes(3) && !entry.seasons.includes(1));
    const modal = ensureHistoryModal();
    const content = modal.querySelector('#historySummaryContent');

    content.innerHTML = `
      <header class="history-summary-header">
        <div>
          <div class="history-kicker">검증된 SOOP ID 기준</div>
          <h2 id="historySummaryTitle">마병대 경력</h2>
          <p>현재 마병대4 신청자 중 마병대 1·2·3에 실제 참가 이력이 확인된 신청자를 집계합니다.</p>
        </div>
        <button class="applicant-detail-close" type="button" data-history-close aria-label="닫기">×</button>
      </header>
      <div class="history-summary-body">
        <section class="history-total-card"><span>경력자 총합</span><strong>${fmt.format(entries.length)}명</strong><p>중복 없이 한 사람을 한 명으로 계산</p></section>
        ${[1,2,3].map(season => {
          const group = bySeason(season);
          return `<section class="history-group"><div class="history-group-title"><strong>마병대 ${season}</strong><span>${fmt.format(group.length)}명</span></div>${careerNameChips(group)}</section>`;
        }).join('')}
        <div class="history-combo-grid">
          <section class="history-group special"><div class="history-group-title"><strong>1·2·3 전부 참가</strong><span>${fmt.format(allThree.length)}명</span></div>${careerNameChips(allThree)}</section>
          <section class="history-group special"><div class="history-group-title"><strong>2·3 참가</strong><span>${fmt.format(twoThree.length)}명</span></div>${careerNameChips(twoThree)}</section>
        </div>
      </div>`;

    modal.hidden = false;
    document.body.classList.add('detail-modal-open');
    modal.querySelector('.applicant-detail-close')?.focus();
  }

  function mapComments(items) {
    comments = Array.isArray(items) ? items : [];
    byUserId = new Map();
    for (const item of comments) {
      const id = String(item?.userId || '').trim().toLowerCase();
      if (id) byUserId.set(id, item);
    }
    experiencedCount = details.countExperiencedApplicants(comments, item => utils.getMabyeongdaeSeasons(item));
    applyExperiencedCount();
  }

  function applyExperiencedCount() {
    if (!topUp || experiencedCount == null) return;
    const next = fmt.format(experiencedCount);
    if (topUp.textContent !== next) topUp.textContent = next;
  }

  async function refreshData(force = false) {
    if (!force && Date.now() - lastFetchAt < 3500 && comments.length) return comments;
    if (refreshPromise) return refreshPromise;
    refreshPromise = fetch(API_URL, { cache: 'no-store' })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
        mapComments(data.comments);
        lastFetchAt = Date.now();
        return comments;
      })
      .catch(() => comments)
      .finally(() => { refreshPromise = null; });
    return refreshPromise;
  }

  function enhanceNames() {
    if (!tbody) return;
    tbody.querySelectorAll('.nick:not([data-detail-ready])').forEach(nick => {
      nick.dataset.detailReady = '1';
      nick.classList.add('applicant-detail-trigger');
      nick.setAttribute('role', 'button');
      nick.setAttribute('tabindex', '0');
      nick.setAttribute('title', '신청서 상세 보기');
      nick.setAttribute('aria-label', `${nick.textContent.trim()} 신청서 상세 보기`);
    });
    tbody.querySelectorAll('.comment-text:not([data-detail-ready])').forEach(comment => {
      comment.dataset.detailReady = '1';
      comment.classList.add('applicant-detail-trigger');
      comment.setAttribute('role', 'button');
      comment.setAttribute('tabindex', '0');
      comment.setAttribute('title', '신청서 상세 보기');
      const nick = comment.closest('tr')?.querySelector('.nick')?.textContent.trim() || '신청자';
      comment.setAttribute('aria-label', `${nick} 신청서 상세 보기`);
    });
  }

  async function openFromTrigger(trigger) {
    const row = trigger.closest('tr');
    const userId = String(row?.querySelector('.id')?.textContent || '').trim().toLowerCase();
    if (!userId) return;
    await refreshData(Date.now() - lastFetchAt > 2000);
    const item = byUserId.get(userId);
    if (item) renderModal(item, row);
  }

  if (tbody) {
    tbody.addEventListener('click', event => {
      const trigger = event.target.closest('.applicant-detail-trigger');
      if (trigger) openFromTrigger(trigger);
    });
    tbody.addEventListener('keydown', event => {
      const trigger = event.target.closest('.applicant-detail-trigger');
      if (!trigger || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      openFromTrigger(trigger);
    });
    new MutationObserver(() => {
      enhanceNames();
      applyExperiencedCount();
    }).observe(tbody, { childList: true, subtree: true });
  }

  if (topUp) {
    new MutationObserver(applyExperiencedCount).observe(topUp, { childList: true, characterData: true, subtree: true });
  }

  if (historySummaryBtn) {
    historySummaryBtn.addEventListener('click', async () => {
      await refreshData(Date.now() - lastFetchAt > 2000);
      renderHistorySummary();
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModal();
      closeHistoryModal();
    }
  });

  enhanceNames();
  refreshData(true);
  window.setInterval(() => refreshData(false), 4000);
})();

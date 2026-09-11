(() => {
  const ADMIN_LABEL = '행정병';

  function replaceUnknownLabel(node) {
    if (!node || typeof node.textContent !== 'string' || !node.textContent.includes('미분류')) return;
    node.textContent = node.textContent.replace(/미분류/g, ADMIN_LABEL);
  }

  function simplifyApplicantFieldUi() {
    const header = document.querySelector('th.type');
    if (header && header.textContent !== '신청분야') header.textContent = '신청분야';

    const unknownFilter = document.getElementById('unknownFilterBtn');
    if (unknownFilter && unknownFilter.textContent !== ADMIN_LABEL) unknownFilter.textContent = ADMIN_LABEL;

    document.querySelectorAll('.applicant-type-select').forEach(select => {
      if (select.getAttribute('title') === 'v3 기준파일 최우선') {
        select.setAttribute('title', '신청분야 고정');
      }
      select.querySelectorAll('option').forEach(option => {
        const match = String(option.textContent || '').trim().match(/^기준파일\s*\((병사|간부|미분류|행정병)\)$/u);
        if (match) {
          option.textContent = match[1] === '미분류' ? ADMIN_LABEL : match[1];
        } else {
          replaceUnknownLabel(option);
        }
      });
    });

    document.querySelectorAll('.tag-auto, #activeFilterText').forEach(node => {
      replaceUnknownLabel(node);
      if (node.textContent.includes(ADMIN_LABEL)) node.classList.add('admin-role-label');
      else node.classList.remove('admin-role-label');
    });
  }

  simplifyApplicantFieldUi();
  const target = document.body;
  if (target && typeof MutationObserver === 'function') {
    const observer = new MutationObserver(simplifyApplicantFieldUi);
    observer.observe(target, { childList: true, subtree: true, characterData: true });
  }
})();

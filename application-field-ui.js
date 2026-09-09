(() => {
  function simplifyApplicantFieldUi() {
    const header = document.querySelector('th.type');
    if (header && header.textContent !== '신청분야') header.textContent = '신청분야';

    document.querySelectorAll('.applicant-type-select').forEach(select => {
      if (select.getAttribute('title') === 'v3 기준파일 최우선') {
        select.setAttribute('title', '신청분야 고정');
      }
      select.querySelectorAll('option').forEach(option => {
        const match = String(option.textContent || '').trim().match(/^기준파일\s*\((병사|간부|미분류)\)$/u);
        if (match) option.textContent = match[1];
      });
    });
  }

  simplifyApplicantFieldUi();
  const target = document.getElementById('tbody') || document.body;
  if (target && typeof MutationObserver === 'function') {
    const observer = new MutationObserver(simplifyApplicantFieldUi);
    observer.observe(target, { childList: true, subtree: true });
  }
})();

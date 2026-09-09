(() => {
  const STORAGE_KEY = 'mabyeongdae4-up-ranking:theme:v1';
  const LIGHT = 'light';
  const DARK = 'dark';

  function normalizeTheme(value) {
    return value === LIGHT ? LIGHT : DARK;
  }

  function readTheme() {
    try {
      return normalizeTheme(localStorage.getItem(STORAGE_KEY));
    } catch (_) {
      return DARK;
    }
  }

  function applyTheme(theme) {
    const next = normalizeTheme(theme);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    const meta = document.getElementById('themeColorMeta');
    if (meta) meta.setAttribute('content', next === LIGHT ? '#f4f7fb' : '#070a0f');
    const button = document.getElementById('themeToggleBtn');
    if (button) {
      const light = next === LIGHT;
      button.setAttribute('aria-pressed', light ? 'true' : 'false');
      button.textContent = light ? '🌙 다크 모드' : '☀ 라이트 모드';
    }
    return next;
  }

  let currentTheme = applyTheme(readTheme());

  function bindThemeToggle() {
    const button = document.getElementById('themeToggleBtn');
    if (!button || button.dataset.themeBound === 'true') return;
    button.dataset.themeBound = 'true';
    applyTheme(currentTheme);
    button.addEventListener('click', () => {
      currentTheme = currentTheme === LIGHT ? DARK : LIGHT;
      try {
        localStorage.setItem(STORAGE_KEY, currentTheme);
      } catch (_) {}
      applyTheme(currentTheme);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindThemeToggle, { once: true });
  } else {
    bindThemeToggle();
  }
})();

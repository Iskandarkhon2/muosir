const STORAGE_KEY = 'muosir_theme';

function getStoredTheme() {
  try {
    const preference = localStorage.getItem(STORAGE_KEY);
    return preference === 'dark' || preference === 'light' ? preference : null;
  } catch (error) {
    console.warn('Theme preference could not be read:', error);
    return null;
  }
}

function setTheme(theme, { persist = false } = {}) {
  if (theme !== 'dark' && theme !== 'light') {
    throw new TypeError(`Unsupported theme: ${theme}`);
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('theme-light', theme === 'light');

  document.querySelectorAll('.theme-toggle-btn').forEach(button => {
    const nextThemeLabel = theme === 'light' ? 'dark' : 'light';
    const label = window.muosirI18n?.translate(`theme_${nextThemeLabel}`)
      || (theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему');
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
    button.querySelector('.theme-icon-sun')?.classList.toggle('hidden', theme === 'light');
    button.querySelector('.theme-icon-moon')?.classList.toggle('hidden', theme !== 'light');
  });

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = theme === 'light' ? '#F8FAFC' : '#0A0D14';

  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Theme preference could not be saved:', error);
    }
  }
}

function initializeTheme() {
  const initialTheme = getStoredTheme()
    || 'light';
  setTheme(initialTheme);

  document.querySelectorAll('.theme-toggle-btn').forEach(button => {
    button.addEventListener('click', () => {
      const currentTheme = document.documentElement.dataset.theme;
      setTheme(currentTheme === 'light' ? 'dark' : 'light', { persist: true });
    });
  });

  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY) return;
    if (event.newValue === 'dark' || event.newValue === 'light') {
      setTheme(event.newValue);
    } else {
      setTheme('light');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTheme, { once: true });
} else {
  initializeTheme();
}

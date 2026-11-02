(() => {
  function applyTheme(theme) {
    const isLight = theme === 'light';
    document.documentElement.classList.toggle('theme-light', isLight);
    document.documentElement.dataset.theme = isLight ? 'light' : 'dark';

    document.querySelectorAll('.theme-toggle-btn').forEach(button => {
      button.setAttribute('aria-label', isLight ? 'Включить тёмную тему' : 'Включить светлую тему');
      button.setAttribute('title', isLight ? 'Тёмная тема' : 'Светлая тема');
      button.querySelector('.theme-icon-sun')?.classList.toggle('hidden', isLight);
      button.querySelector('.theme-icon-moon')?.classList.toggle('hidden', !isLight);
    });
  }

  function setupThemeToggle() {
    let theme = 'dark';
    try {
      theme = localStorage.getItem('muosir_theme') || theme;
    } catch (error) {
      console.warn('Theme preference could not be read:', error);
    }

    applyTheme(theme);
    document.querySelectorAll('.theme-toggle-btn').forEach(button => {
      button.addEventListener('click', () => {
        const nextTheme = document.documentElement.classList.contains('theme-light') ? 'dark' : 'light';
        try {
          localStorage.setItem('muosir_theme', nextTheme);
        } catch (error) {
          console.warn('Theme preference could not be saved:', error);
        }
        applyTheme(nextTheme);
      });
    });
  }

  function setupLanguageSwitcher() {
    const i18n = window.muosirI18n;
    if (!i18n) return;

    i18n.applyTranslations();
    document.querySelectorAll('[data-lang-btn]').forEach(button => {
      button.addEventListener('click', () => i18n.setLang(button.dataset.langBtn));
    });
  }

  function setupMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const menu = document.getElementById('mobile-nav-menu');
    if (!toggle || !menu) return;

    const closeMenu = () => {
      menu.classList.add('hidden');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', event => {
      event.stopPropagation();
      const isOpen = !menu.classList.contains('hidden');
      menu.classList.toggle('hidden', isOpen);
      toggle.setAttribute('aria-expanded', String(!isOpen));
    });

    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('click', event => {
      if (!(event.target instanceof Node)) return;
      if (!menu.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  function initialize() {
    setupThemeToggle();
    setupLanguageSwitcher();
    setupMobileMenu();
    window.muosirAnalytics?.trackPageView();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();

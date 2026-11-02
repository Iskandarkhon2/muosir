(() => {
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

  function setupCompanyContacts() {
    const store = window.muosirStore;
    if (!store) return;

    const render = () => {
      const company = store.getData().company;
      document.querySelectorAll('.dynamic-phone-link').forEach(link => {
        link.href = `tel:${company.phoneClean}`;
        link.textContent = company.phone;
      });
      document.querySelectorAll('.dynamic-email-link').forEach(link => {
        link.href = `mailto:${company.email}`;
        link.textContent = company.email;
      });
      document.querySelectorAll('[data-dynamic-whatsapp]').forEach(link => {
        link.href = `https://wa.me/${company.whatsappClean || '992922992000'}`;
      });
    };

    render();
    window.addEventListener('muosir_store_updated', render);
  }

  function setupProductExplorer() {
    if (!document.querySelector('.site-content') || !window.muosirStore) return;
    if (document.querySelector('script[src$="product-explorer.js"]')) return;

    const script = document.createElement('script');
    script.src = 'src/features/site/product-explorer.js';
    script.defer = true;
    document.body.append(script);
  }

  function setupPhotoLightbox() {
    if (!document.querySelector('[data-lightbox-src]')) return;
    if (document.querySelector('script[src$="photo-lightbox.js"]')) return;

    const script = document.createElement('script');
    script.src = 'src/features/site/photo-lightbox.js';
    script.defer = true;
    document.body.append(script);
  }

  function initialize() {
    setupLanguageSwitcher();
    setupMobileMenu();
    setupCompanyContacts();
    setupProductExplorer();
    setupPhotoLightbox();
    window.muosirAnalytics?.trackPageView();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();

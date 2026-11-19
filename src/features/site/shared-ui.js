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

  function setupProgressiveHomepage() {
    const stages = Array.from(document.querySelectorAll('[data-homepage-stage]'));
    const buttons = Array.from(document.querySelectorAll('[data-homepage-stage-toggle]'));
    if (!stages.length || !buttons.length) return;

    const revealThrough = targetStage => {
      const targetIndex = stages.indexOf(targetStage);
      if (targetIndex < 0) return;

      stages.slice(0, targetIndex + 1).forEach(stage => stage.classList.remove('hidden'));
      updateButtons();
    };

    const updateButtons = () => {
      const nextStage = stages.find(stage => stage.classList.contains('hidden'));
      buttons.forEach(button => {
        const isNext = nextStage && button.dataset.homepageStageToggle === nextStage.id;
        const buttonStage = stages.find(stage => stage.id === button.dataset.homepageStageToggle);
        const control = button.closest('[data-homepage-stage-control]');
        control?.classList.toggle('hidden', !isNext);
        button.classList.toggle('hidden', !isNext);
        button.setAttribute('aria-expanded', String(Boolean(buttonStage && !buttonStage.classList.contains('hidden'))));
      });
    };

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const stage = document.getElementById(button.dataset.homepageStageToggle);
        if (stage) revealThrough(stage);
      });
    });

    document.addEventListener('click', event => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;

      const target = document.getElementById(link.getAttribute('href').slice(1));
      const targetStage = target?.closest('[data-homepage-stage]');
      if (targetStage) revealThrough(targetStage);
    });

    updateButtons();
    const initialTarget = window.location.hash
      ? document.getElementById(window.location.hash.slice(1))
      : null;
    const initialStage = initialTarget?.closest('[data-homepage-stage]');
    if (initialStage) {
      revealThrough(initialStage);
      requestAnimationFrame(() => initialTarget.scrollIntoView());
    }
  }

  function setupCompanyContacts() {
    const store = window.muosirStore;
    if (!store) return;

    const render = () => {
      const company = store.getData().company;
      const domesticPhone = String(company.phoneClean || '992925505050').replace(/\D/g, '') || '992925505050';
      const domesticDisplayPhone = company.phone || `+${domesticPhone}`;
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
      const exportPage = /(?:^|\/)export\.html$/i.test(window.location.pathname);
      document.querySelectorAll('a[href^="https://wa.me/"]').forEach(link => {
        const isHeaderLink = Boolean(link.closest('header'));
        const isExportLink = link.hasAttribute('data-export-whatsapp')
          || link.dataset.whatsappDestination === 'export';
        if (!isHeaderLink && (exportPage || isExportLink)) return;

        const url = new URL(link.href);
        url.pathname = `/${domesticPhone}`;
        if (isHeaderLink || link.hasAttribute('data-domestic-whatsapp')) url.search = '';
        link.href = url.href;

        if (isHeaderLink) {
          const numberLabel = link.querySelector('span:last-child');
          if (numberLabel) {
            numberLabel.textContent = domesticDisplayPhone;
          } else {
            link.textContent = `WhatsApp ${domesticDisplayPhone}`;
          }
        } else {
          link.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
              node.textContent = node.textContent.replace(/\+?992[\s()-]*92[\s-]*299[\s-]*2000/g, domesticDisplayPhone);
            }
          });
        }
      });
      const floatingPhone = exportPage
        ? String(company.whatsappClean || '992922992000').replace(/\D/g, '') || '992922992000'
        : domesticPhone;
      const floatingDisplayPhone = exportPage
        ? company.whatsapp || `+${floatingPhone}`
        : domesticDisplayPhone;
      document.querySelectorAll('a[aria-label="WhatsApp Chat"]').forEach(link => {
        link.title = `WhatsApp (${floatingDisplayPhone})`;
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
    script.type = 'module';
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
    setupProgressiveHomepage();
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

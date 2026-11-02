(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealSelector = '.motion-section, .page-hero, [data-motion-reveal]';
  const cardSelector = '.glass-card, .glass-card-accent, article';

  function prepareReveal(element, index = 0) {
    if (element.dataset.motionPrepared) return;
    element.dataset.motionPrepared = 'true';
    element.classList.add('motion-reveal');
    element.style.setProperty('--motion-index', String(Math.min(index, 6)));
    if (reducedMotion || !revealObserver) {
      element.classList.add('is-visible');
      return;
    }
    revealObserver.observe(element);
  }

  const revealObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' })
    : null;

  function setupReveals() {
    document.querySelectorAll(revealSelector).forEach((element, index) => {
      prepareReveal(element, index % 4);
    });

    document.querySelectorAll('header, .motion-section:first-of-type h1, .motion-section:first-of-type p, .motion-section:first-of-type a, .motion-section:first-of-type button, .page-hero h1')
      .forEach((element, index) => prepareReveal(element, index));

    document.querySelectorAll(cardSelector).forEach((element, index) => {
      prepareReveal(element, index % 5);
    });
  }

  function setupMagneticTargets() {
    if (reducedMotion || !window.matchMedia('(pointer: fine)').matches) return;

    document.querySelectorAll('a.btn-primary-glow, button.btn-primary-glow, .btn-glass-secondary')
      .forEach(element => {
        if (element.dataset.magneticReady) return;
        element.dataset.magneticReady = 'true';
        element.classList.add('magnetic-target');

        element.addEventListener('pointermove', event => {
          const bounds = element.getBoundingClientRect();
          const offsetX = (event.clientX - bounds.left - bounds.width / 2) * 0.08;
          const offsetY = (event.clientY - bounds.top - bounds.height / 2) * 0.08;
          element.style.setProperty('--magnetic-x', `${offsetX.toFixed(1)}px`);
          element.style.setProperty('--magnetic-y', `${offsetY.toFixed(1)}px`);
        });

        element.addEventListener('pointerleave', () => {
          element.style.setProperty('--magnetic-x', '0px');
          element.style.setProperty('--magnetic-y', '0px');
        });
      });
  }

  function setupPageTransitions() {
    if (reducedMotion) return;

    const curtain = document.createElement('div');
    curtain.className = 'page-transition-curtain';
    curtain.setAttribute('aria-hidden', 'true');
    document.body.append(curtain);
    requestAnimationFrame(() => document.documentElement.classList.add('page-ready'));

    document.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a[href]');
      if (!link || event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
          link.target || link.hasAttribute('download')) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin ||
          destination.pathname === window.location.pathname ||
          destination.hash && destination.pathname === window.location.pathname) return;

      event.preventDefault();
      document.documentElement.classList.add('page-exiting');
      window.setTimeout(() => window.location.assign(destination.href), 180);
    });

    window.addEventListener('pageshow', () => {
      document.documentElement.classList.remove('page-exiting');
    });
  }

  function initializeMotion() {
    setupReveals();
    setupMagneticTargets();
    setupPageTransitions();

    window.addEventListener('muosir_products_rendered', () => {
      setupReveals();
      setupMagneticTargets();
    });
    window.addEventListener('muosir_store_updated', () => {
      requestAnimationFrame(() => {
        setupReveals();
        setupMagneticTargets();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMotion, { once: true });
  } else {
    initializeMotion();
  }
})();

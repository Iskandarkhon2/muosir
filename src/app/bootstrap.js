/**
 * bootstrap.js - Main Application Controller for Muosir Plast B2B Export Landing
 * Coordinates the public site UI, data rendering, and inquiry flows.
 */

import { addLeadHoneypot, setLeadFeedback, submitLead } from '../features/forms/lead-api.js';

document.addEventListener('DOMContentLoaded', () => {
  const store = window.muosirStore;
  const i18n = window.muosirI18n;
  const analytics = window.muosirAnalytics;

  let currentCategory = 'all';
  let currentProdTab = 'all';
  const productionIllustrations = {
    lines: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M8 38V12h32v26M14 38V20h8v18m6 0V20h8v18M6 38h36M14 16h20" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    process: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M8 12h32v24H8zM13 18h22M13 24h22M13 30h12m7 0h3" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    warehouse: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M7 39V19l17-10 17 10v20M7 20h34M14 25h8v8h-8zm12 0h8v8h-8zM20 39V28h8v11" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    qc: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 7 39 13v10c0 9-6 15-15 19C15 38 9 32 9 23V13l15-6Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="m17 24 5 5 10-11" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    shipping: '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M6 13h23v21H6zM29 20h8l6 7v7H29zM13 39a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm22 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  // --- Initial Renderings ---
  renderCompanyHeaderAndContacts();
  renderStats();
  renderIndustries();
  renderCatalogTabs();
  renderCatalogProducts();
  renderAdvantages();
  renderProductionShowcase();
  renderDocuments();
  setupForms();
  setupModals();
  setupWhatsAppWidget();
  setupBackToTop();
  // Listen to store updates
  window.addEventListener('muosir_store_updated', () => {
    renderCompanyHeaderAndContacts();
    renderStats();
    renderIndustries();
    renderCatalogProducts();
    renderAdvantages();
    renderProductionShowcase();
    renderDocuments();
    i18n.applyTranslations();
  });

  // Listen to language changes (RU, EN, UZ, KK)
  window.addEventListener('muosir_lang_changed', () => {
    renderCompanyHeaderAndContacts();
    renderStats();
    renderIndustries();
    renderCatalogTabs();
    renderCatalogProducts();
    renderAdvantages();
    renderProductionShowcase();
    renderDocuments();
  });

  // --- Render Functions ---

  function renderCompanyHeaderAndContacts() {
    const data = store.getData();
    const lang = i18n.getLang();

    // Update contacts on page
    const phoneLinks = document.querySelectorAll('.dynamic-phone-link');
    phoneLinks.forEach(el => {
      el.href = `tel:${data.company.phoneClean}`;
      el.textContent = data.company.phone;
    });

    const emailLinks = document.querySelectorAll('.dynamic-email-link');
    emailLinks.forEach(el => {
      el.href = `mailto:${data.company.email}`;
      el.textContent = data.company.email;
    });

    const addressEls = document.querySelectorAll('.dynamic-address-text');
    addressEls.forEach(el => {
      let addr = data.company.address;
      if (lang === 'en') addr = data.company.addressEn || addr;
      else if (lang === 'uz') addr = data.company.addressUz || addr;
      else if (lang === 'kk') addr = data.company.addressKk || addr;
      el.textContent = addr;
    });
  }

  function renderStats() {
    const data = store.getData();
    const container = document.getElementById('stats-grid');
    if (!container) return;

    const lang = i18n.getLang();
    container.innerHTML = data.stats.map(s => {
      let lbl = s.label;
      if (lang === 'en') lbl = s.labelEn || lbl;
      else if (lang === 'uz') lbl = s.labelUz || lbl;
      else if (lang === 'kk') lbl = s.labelKk || lbl;

      return `
        <div class="glass-card p-4 sm:p-6 rounded-2xl text-center interactive-card border border-slate-800/80 hover:border-cyan-500/50 transition-all">
          <div class="card-shine"></div>
          <div class="text-3xl lg:text-4xl font-extrabold stat-value text-blue-400 tracking-tight">
            ${s.number}
          </div>
          <div class="stat-label text-xs sm:text-sm font-normal sm:font-semibold text-slate-300 mt-2.5">
            ${lbl}
          </div>
        </div>
      `;
    }).join('');
  }

  // Section 1 of ТЗ: Target B2B Industries
  function renderIndustries() {
    const container = document.getElementById('industries-grid');
    if (!container) return;

    const items = [
      {
        icon: `<svg class="w-4 h-4 sm:w-6 sm:h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>`,
        badge: "МОЛОЧНАЯ ПРОМЫШЛЕННОСТЬ",
        titleKey: "ind_dairy",
        descKey: "ind_dairy_desc",
        tag: "Стаканы Ø 95 мм, нахлобучки"
      },
      {
        icon: `<svg class="w-4 h-4 sm:w-6 sm:h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>`,
        badge: "ФАСОВКА И ПТИЦЕФАБРИКИ",
        titleKey: "ind_eggs",
        descKey: "ind_eggs_desc",
        tag: "Упаковка для 10 и 15 яиц"
      },
      {
        icon: `<svg class="w-4 h-4 sm:w-6 sm:h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/></svg>`,
        badge: "КОНДИТЕРСКИЕ ФАБРИКИ",
        titleKey: "ind_confect",
        descKey: "ind_confect_desc",
        tag: "Тортовницы, коррексы"
      },
      {
        icon: `<svg class="w-4 h-4 sm:w-6 sm:h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
        badge: "ПИЩЕВЫЕ ПРОИЗВОДСТВА И ФАСОВКА",
        titleKey: "ind_food",
        descKey: "ind_food_desc",
        tag: "Ланч-боксы, салатники"
      },
      {
        icon: `<svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
        badge: "HORECA И FAST FOOD",
        titleKey: "ind_horeca",
        descKey: "ind_horeca_desc",
        tag: "Стаканы, супницы, соусники"
      }
    ];

    container.innerHTML = items.map(item => `
      <div class="glass-card industry-card p-3 sm:p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all interactive-card flex flex-col justify-between">
        <div class="card-shine"></div>
        <div>
          <div class="industry-card__top flex items-center justify-between mb-4">
          <div class="industry-card__icon w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center">
              ${item.icon}
            </div>
          <span class="industry-card__badge max-w-[5rem] text-right text-[9px] leading-tight sm:text-[10px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
              ${item.badge}
            </span>
          </div>
        <div class="industry-card__content">
        <h3 class="text-xs sm:text-base font-bold text-white mb-2" data-i18n="${item.titleKey}">
            ${i18n.translate(item.titleKey)}
          </h3>
        <p class="text-[11px] sm:text-xs text-slate-300 leading-relaxed" data-i18n="${item.descKey}">
            ${i18n.translate(item.descKey)}
          </p>
        </div>
      </div>
      <div class="industry-card__footer mt-4 pt-3 border-t border-slate-800/80 text-[10px] sm:text-[11px] font-semibold text-blue-400 flex flex-col items-start gap-2">
          <span>${item.tag}</span>
          <a href="catalog.html?industry=${item.titleKey === 'ind_dairy' ? 'dairy' : item.titleKey === 'ind_eggs' ? 'eggs' : item.titleKey === 'ind_confect' ? 'confectionery' : item.titleKey === 'ind_food' ? 'food' : 'horeca'}" class="hover:text-cyan-300 transition-colors">В каталог →</a>
        </div>
      </div>
    `).join('');
  }

  function renderCatalogTabs() {
    const data = store.getData();
    const container = document.getElementById('catalog-tabs');
    if (!container) return;

    const lang = i18n.getLang();
    container.innerHTML = data.categories.map(c => {
      let name = c.name;
      if (lang === 'en') name = c.nameEn || name;
      else if (lang === 'uz') name = c.nameUz || name;
      else if (lang === 'kk') name = c.nameKk || name;

      return `
        <button 
          type="button" 
          data-cat-id="${c.id}" 
          class="cat-tab-btn whitespace-nowrap flex-shrink-0 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            currentCategory === c.id 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/35 border border-blue-400/40' 
              : 'btn-glass-secondary text-slate-300 hover:text-white'
          }"
        >
          ${name}
        </button>
      `;
    }).join('');

    container.querySelectorAll('.cat-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCategory = btn.getAttribute('data-cat-id');
        renderCatalogTabs();
        renderCatalogProducts();
      });
    });
  }

  function renderCatalogProducts() {
    const container = document.getElementById('catalog-grid');
    if (!container) return;

    const products = store.getProducts(currentCategory);
    const data = store.getData();
    const lang = i18n.getLang();

    if (products.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-500">
          В данной категории продукция обновляется.
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(p => {
      let title = p.title;
      let desc = p.desc;
      if (lang === 'en') { title = p.titleEn || title; desc = p.descEn || desc; }
      else if (lang === 'uz') { title = p.titleUz || title; desc = p.descUz || desc; }
      else if (lang === 'kk') { title = p.titleKk || title; desc = p.descKk || desc; }

      // WhatsApp prefilled message matching Section 11 of ТЗ:
      // «Здравствуйте. Меня интересует продукция Муосир пласт: {название товара}»
      const waText = encodeURIComponent(
        `Здравствуйте, завод Muosir Plast. Интересует оптовая партия продукции: ${p.title} (${p.id}), объем: по запросу. Направьте коммерческое предложение.`
      );
      const waUrl = `https://wa.me/${data.company.whatsappClean || '992922992000'}?text=${waText}`;

      return `
        <div class="glass-card rounded-2xl p-5 flex flex-col justify-between interactive-card border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 group">
          <div class="card-shine"></div>
          
          <div>
            <!-- Product Image / Tech Diagram -->
            <div class="relative w-full h-52 bg-slate-950/80 rounded-xl overflow-hidden flex items-center justify-center p-4 border border-slate-800/50 group-hover:border-blue-500/30 transition-all">
              <img 
                src="${p.photo || p.image}" 
                alt="${title}" 
                loading="lazy" 
                class="max-h-full max-w-full object-contain filter drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
              />
              <span class="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                ${p.material}
              </span>
            </div>

            <!-- Title & Description -->
            <h3 class="text-base font-extrabold text-white mt-4 line-clamp-2 group-hover:text-cyan-300 transition-colors tracking-tight">
              ${title}
            </h3>
            <p class="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
              ${desc}
            </p>

            <p class="mt-4 text-xs text-slate-400">Материал: <span class="font-spec text-slate-200">${p.material}</span></p>
          </div>

          <!-- Action Buttons -->
          <div class="mt-5 grid grid-cols-2 gap-2">
            <button 
              type="button" 
              onclick="window.muosirApp.openQuoteModal('${p.id}')"
              class="btn-primary-glow w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span data-i18n="catalog_btn_quote">${i18n.translate('catalog_btn_quote')}</span>
            </button>
            <a 
              href="${waUrl}" 
              target="_blank" 
              rel="noopener noreferrer"
              onclick="window.muosirAnalytics.trackWhatsAppClick('Catalog Card', '${p.title.replace(/'/g, "\\'")}', '${p.sku || 'general'}')"
              class="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 hover:border-emerald-500/60 transition-all flex items-center justify-center gap-1.5"
            >
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.588 1.777.896 2.796.896 3.183 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.769-5.769-5.769zm3.36 8.163c-.144.405-.837.774-1.17.822-.312.043-.687.05-1.111-.087-.275-.088-.63-.207-1.077-.4-1.895-.82-3.125-2.735-3.22-2.862-.095-.127-.775-1.029-.775-1.963 0-.934.489-1.393.663-1.584.174-.191.38-.239.507-.239.127 0 .254.001.365.006.119.006.278-.045.435.333.16.385.547 1.332.595 1.428.048.095.079.206.016.333-.064.127-.095.206-.19.317-.095.111-.2.248-.286.333-.095.095-.195.198-.084.389.111.19.493.813 1.057 1.316.726.647 1.339.848 1.53.943.19.095.302.079.413-.048.111-.127.476-.556.603-.746.127-.19.254-.159.428-.095.175.063 1.111.524 1.302.619.19.095.317.143.365.222.048.079.048.46-.096.865z"/></svg>
              <span data-i18n="catalog_btn_whatsapp">${i18n.translate('catalog_btn_whatsapp')}</span>
            </a>
          </div>

          ${p.customizable ? `
            <button type="button" data-customize-product="${p.id}" class="button-secondary mt-2.5 w-full">
              Посмотреть со своим логотипом
            </button>
          ` : ''}
        </div>
      `;
    }).join('');
    window.dispatchEvent(new CustomEvent('muosir_products_rendered'));
  }

  // Section 7 of ТЗ: 7 Advantages matching requirements
  function renderAdvantages() {
    const data = store.getData();
    const container = document.getElementById('advantages-grid');
    if (!container) return;

    const lang = i18n.getLang();

    const iconSvgs = {
      factory: `<svg class="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`,
      truck: `<svg class="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>`,
      percent: `<svg class="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"/></svg>`,
      layers: `<svg class="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>`,
      settings: `<svg class="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>`,
      shield: `<svg class="w-7 h-7 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
      globe: `<svg class="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
    };

    container.innerHTML = data.advantages.map(a => {
      let title = a.title;
      let desc = a.desc;
      if (lang === 'en') { title = a.titleEn || title; desc = a.descEn || desc; }
      else if (lang === 'uz') { title = a.titleUz || title; desc = a.descUz || desc; }
      else if (lang === 'kk') { title = a.titleKk || title; desc = a.descKk || desc; }

      return `
        <div class="glass-card rounded-2xl p-6 interactive-card border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between">
          <div class="card-shine"></div>
          <div>
            <div class="w-14 h-14 rounded-2xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-center mb-5 shadow-inner">
              ${iconSvgs[a.icon] || iconSvgs.factory}
            </div>
            <h3 class="text-base sm:text-lg font-bold text-white mb-2.5">
              ${title}
            </h3>
            <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
              ${desc}
            </p>
          </div>
        </div>
      `;
    }).join('');
  }

  // Section 12 of ТЗ: Visual Production Showcase with Tabs & Video Modal
  function renderProductionShowcase() {
    const data = store.getData();
    const container = document.getElementById('production-gallery-container');
    const tabsContainer = document.getElementById('production-tabs');
    if (!container) return;

    const lang = i18n.getLang();

    // Render filter tabs
    if (tabsContainer) {
      const tabs = [
        { id: 'all', label: i18n.translate('prod_tab_all') },
        { id: 'lines', label: i18n.translate('prod_tab_lines') },
        { id: 'process', label: i18n.translate('prod_tab_process') },
        { id: 'warehouse', label: i18n.translate('prod_tab_warehouse') },
        { id: 'qc', label: i18n.translate('prod_tab_qc') },
        { id: 'shipping', label: i18n.translate('prod_tab_shipping') }
      ];

      tabsContainer.innerHTML = tabs.map(t => `
        <button 
          type="button" 
          data-prod-tab="${t.id}"
          class="px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            currentProdTab === t.id
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }"
        >
          ${t.label}
        </button>
      `).join('');

      tabsContainer.querySelectorAll('[data-prod-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
          currentProdTab = btn.getAttribute('data-prod-tab');
          renderProductionShowcase();
        });
      });
    }

    const items = currentProdTab === 'all'
      ? data.productionShowcase
      : data.productionShowcase.filter(item => item.category === currentProdTab);

    container.innerHTML = items.map(item => {
      let title = item.title;
      let desc = item.desc;
      if (lang === 'en') { title = item.titleEn || title; desc = item.descEn || desc; }
      else if (lang === 'uz') { title = item.titleUz || title; desc = item.descUz || desc; }
      else if (lang === 'kk') { title = item.titleKk || title; desc = item.descKk || desc; }

      return `
        <div class="glass-card rounded-2xl overflow-hidden border border-slate-800 hover:border-cyan-500/40 transition-all interactive-card flex flex-col">
          <div class="card-shine"></div>
          <div class="production-card-visual" aria-hidden="true">
            ${productionIllustrations[item.category] || productionIllustrations.lines}
          </div>
          <div class="p-5 flex-1 flex flex-col justify-between">
            <div>
              <h3 class="text-base font-bold text-white mb-2">${title}</h3>
              <p class="text-xs text-slate-400 leading-relaxed">${desc}</p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Согдийская область, Таджикистан</span>
              <span class="text-emerald-400 font-semibold">Пищевая безопасность</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Section 13 of ТЗ: Documents & Certificates with PDF preview and download
  function renderDocuments() {
    const data = store.getData();
    const container = document.getElementById('documents-grid');
    if (!container) return;

    const lang = i18n.getLang();

    container.innerHTML = data.documents.map(d => {
      let title = d.title;
      if (lang === 'en') title = d.titleEn || title;
      else if (lang === 'uz') title = d.titleUz || title;
      else if (lang === 'kk') title = d.titleKk || title;
      const documentActions = d.file
        ? `
          <button type="button" onclick="window.muosirApp.openPdfModal('${d.file}', '${d.title.replace(/'/g, "\\'")}')" class="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold">
            <span data-i18n="doc_btn_view">${i18n.translate('doc_btn_view')}</span>
          </button>
          <a href="${d.file}" download onclick="window.muosirAnalytics.trackDownloadCatalog('${d.title.replace(/'/g, "\\'")}')" class="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold">
            <span data-i18n="doc_btn_download">${i18n.translate('doc_btn_download')}</span>
          </a>
        `
        : `<a href="mailto:info@muosirplast.tj" class="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold">${i18n.translate('doc_request')}</a>`;

      return `
        <div class="glass-card p-5 rounded-2xl border border-slate-800 flex items-start gap-4 hover:border-blue-500/40 transition-all interactive-card">
          <div class="card-shine"></div>
          <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex-shrink-0 flex items-center justify-center text-blue-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <div class="flex-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">
              ${d.type}${d.number ? ` · ${d.number}` : ''}
            </span>
            <h4 class="text-sm font-bold text-white mt-1.5 leading-snug">
              ${title}
            </h4>
            <div class="mt-3 flex items-center gap-3">${documentActions}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Back To Top Button ---
  function setupBackToTop() {
    const btn = document.getElementById('back-to-top-btn');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // --- Forms Handling (Sections 10, 17, 18, 19 of ТЗ) ---
  function setupForms() {
    const mainForm = document.getElementById('b2b-lead-form');
    if (mainForm) {
      addLeadHoneypot(mainForm);
      // Track input start
      mainForm.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('focus', () => {
          analytics.trackFormStart('Main Lead Form');
        }, { once: true });
      });

      mainForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!mainForm.reportValidity()) return;
        const formData = new FormData(mainForm);
        const utm = analytics.getUtm();

        const leadPayload = {
          name: formData.get('name') || '',
          company: formData.get('company') || '',
          country: formData.get('country') || '',
          phone: formData.get('phone') || '',
          email: formData.get('email') || '',
          product: formData.get('category') || 'All categories',
          volume: formData.get('volume') || '',
          comment: formData.get('comment') || '',
          utmSource: utm.source,
          utmMedium: utm.medium,
          utmCampaign: utm.campaign,
          utmContent: utm.content,
          utmTerm: utm.term,
          sourcePage: window.location.pathname
        };

        const submitButton = mainForm.querySelector('[type="submit"]');
        if (submitButton) submitButton.disabled = true;
        setLeadFeedback(mainForm, 'Отправляем заявку…');
        try {
          await submitLead(leadPayload);
          analytics.trackLead(leadPayload);
          mainForm.reset();
          openThankYouModal(leadPayload);
          setLeadFeedback(mainForm, 'Заявка зарегистрирована на сервере.');
        } catch (error) {
          console.error('Main inquiry submission failed:', error);
          setLeadFeedback(mainForm, error.message || 'Не удалось отправить заявку. Попробуйте ещё раз.', true);
        } finally {
          if (submitButton) submitButton.disabled = false;
        }
      });
    }

    // Modal Quick Quote Form
    const modalForm = document.getElementById('modal-quote-form');
    if (modalForm) {
      addLeadHoneypot(modalForm);
      modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!modalForm.reportValidity()) return;
        const formData = new FormData(modalForm);
        const utm = analytics.getUtm();

        const leadPayload = {
          name: formData.get('name') || '',
          company: formData.get('company') || '',
          country: formData.get('country') || '',
          phone: formData.get('phone') || '',
          email: formData.get('email') || '',
          product: formData.get('product') || 'Selected Product',
          volume: formData.get('volume') || '',
          comment: formData.get('comment') || '',
          utmSource: utm.source,
          utmMedium: utm.medium,
          utmCampaign: utm.campaign,
          utmContent: utm.content,
          utmTerm: utm.term,
          sourcePage: 'Product Quick Quote Modal'
        };

        const submitButton = modalForm.querySelector('[type="submit"]');
        if (submitButton) submitButton.disabled = true;
        setLeadFeedback(modalForm, 'Отправляем заявку…');
        try {
          await submitLead(leadPayload);
          analytics.trackLead(leadPayload);
          modalForm.reset();
          closeModal('quote-modal');
          openThankYouModal(leadPayload);
        } catch (error) {
          console.error('Quick quote submission failed:', error);
          setLeadFeedback(modalForm, error.message || 'Не удалось отправить заявку. Попробуйте ещё раз.', true);
        } finally {
          if (submitButton) submitButton.disabled = false;
        }
      });
    }
  }

  // --- Modals Setup ---
  function setupModals() {
    window.muosirApp = {
      openQuoteModal: (productId) => {
        const modal = document.getElementById('quote-modal');
        if (!modal) return;

        const product = store.getProductById(productId);
        const productSelect = document.getElementById('modal-form-product');
        if (product && productSelect) {
          productSelect.value = product.title;
        }

        analytics.trackViewProduct(product);
        analytics.trackFormStart('Product Quick Quote');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      },
      openPdfModal: (pdfUrl, title) => {
        const modal = document.getElementById('pdf-viewer-modal');
        const frame = document.getElementById('pdf-modal-frame');
        const titleEl = document.getElementById('pdf-modal-title');
        const dlLink = document.getElementById('pdf-modal-download');
        if (!modal || !frame) return;

        frame.src = pdfUrl;
        if (titleEl) titleEl.textContent = title;
        if (dlLink) dlLink.href = pdfUrl;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
      },
      openVideoModal: () => {
        const modal = document.getElementById('video-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      },
      closeModal: (modalId) => {
        closeModal(modalId);
      }
    };

    // Close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-close-modal');
        closeModal(modalId);
      });
    });

    // Close on backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.add('hidden');
          overlay.classList.remove('flex');
          // If closing pdf modal, clear iframe src
          const frame = overlay.querySelector('iframe');
          if (frame) frame.src = '';
        }
      });
    });
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      const frame = modal.querySelector('iframe');
      if (frame) frame.src = '';
    }
  }

  // Section 17 of ТЗ: Thank-You Modal
  function openThankYouModal(lead) {
    const modal = document.getElementById('thank-you-modal');
    if (!modal) return;

    const data = store.getData();
    // Prepare personal WhatsApp link with lead info
    const waText = encodeURIComponent(
      `Здравствуйте. Меня интересует продукция Муосир пласт: ${lead.product}. Я оставил заявку: ${lead.name} (${lead.company}, ${lead.country}). Хотел бы получить информацию по экспортным поставкам.`
    );
    const waBtn = document.getElementById('thank-you-wa-btn');
    if (waBtn) {
      waBtn.href = `https://wa.me/${data.company.whatsappClean || '992922992000'}?text=${waText}`;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  // --- Floating WhatsApp Widget (Section 11 of ТЗ) ---
  function setupWhatsAppWidget() {
    const waTrigger = document.getElementById('whatsapp-widget-btn');
    const waBox = document.getElementById('whatsapp-widget-popup');
    const waClose = document.getElementById('whatsapp-widget-close');
    const waSendBtn = document.getElementById('whatsapp-widget-send');
    const waInput = document.getElementById('whatsapp-widget-input');

    if (!waTrigger || !waBox) return;

    waTrigger.addEventListener('click', () => {
      waBox.classList.toggle('hidden');
      if (!waBox.classList.contains('hidden') && waInput) {
        waInput.focus();
      }
    });

    if (waClose) {
      waClose.addEventListener('click', () => {
        waBox.classList.add('hidden');
      });
    }

    if (waSendBtn && waInput) {
      waSendBtn.addEventListener('click', () => {
        const data = store.getData();
        const msg = waInput.value.trim() || 'Здравствуйте. Меня интересует продукция Муосир пласт. Хотел бы получить информацию по экспортным поставкам.';
        analytics.trackWhatsAppClick('Floating Widget', msg);
        const url = `https://wa.me/${data.company.whatsappClean || '992922992000'}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
        waBox.classList.add('hidden');
        waInput.value = '';
      });

      waInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          waSendBtn.click();
        }
      });
    }
  }
});

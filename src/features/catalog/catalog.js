document.addEventListener('DOMContentLoaded', () => {
  const store = window.muosirStore;
  const i18n = window.muosirI18n;
  const grid = document.getElementById('catalog-products-grid');
  const count = document.getElementById('product-count');
  const emptyState = document.getElementById('no-products-msg');
  const search = document.getElementById('catalog-search-input');
  const reset = document.getElementById('catalog-reset-filter');
  const quoteProduct = document.getElementById('quote-product-field');
  const industryFilters = document.getElementById('catalog-industry-filters');

  if (!store || !i18n || !grid) return;

  const products = store.getProducts('all');
  const industries = [
    { id: 'dairy', categories: ['dairy'], labels: ['Молочная промышленность', 'Dairy industry', 'Sut sanoati', 'Сүт өнеркәсібі'] },
    { id: 'eggs', categories: ['eggs'], labels: ['Птицеводство и фасовка яиц', 'Poultry and egg packing', 'Parrandachilik va tuxum qadoqlash', 'Құс шаруашылығы және жұмыртқа'] },
    { id: 'confectionery', categories: ['confectionery'], labels: ['Кондитерские предприятия', 'Confectionery', 'Qandolatchilik korxonalari', 'Кондитерлік кәсіпорындар'] },
    { id: 'food', categories: ['containers'], labels: ['Пищевые производства и фасовка', 'Food production and packing', 'Oziq-ovqat ishlab chiqarish va qadoqlash', 'Азық-түлік өндірісі және қаптау'] },
    { id: 'horeca', categories: ['cups', 'containers'], labels: ['HoReCa и Fast Food', 'HoReCa and fast food', 'HoReCa va tezkor ovqatlanish', 'HoReCa және жылдам тамақтану'] }
  ];

  let activeCategory = 'all';
  let activeMaterial = 'all';
  let activeIndustry = new URLSearchParams(window.location.search).get('industry') || 'all';
  let searchQuery = '';

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  function productText(product, key) {
    const suffix = i18n.getLang() === 'ru'
      ? ''
      : i18n.getLang().charAt(0).toUpperCase() + i18n.getLang().slice(1);
    return product[`${key}${suffix}`] || product[key] || '';
  }

  function renderIndustryFilters() {
    if (!industryFilters) return;
    const languageIndex = { ru: 0, en: 1, uz: 2, kk: 3 }[i18n.getLang()] || 0;
    const options = [{ id: 'all', label: ['Все отрасли', 'All industries', 'Barcha sohalar', 'Барлық салалар'][languageIndex] }]
      .concat(industries.map(industry => ({
        id: industry.id,
        label: industry.labels[languageIndex]
      })));

    industryFilters.innerHTML = options.map(option => `
      <button type="button" class="industry-filter${activeIndustry === option.id ? ' is-active' : ''}"
        data-industry="${option.id}" aria-pressed="${activeIndustry === option.id}">
        ${escapeHtml(option.label)}
      </button>
    `).join('');
  }

  function matchesSearch(product, query) {
    if (!query) return true;
    const fields = [
      productText(product, 'title'),
      productText(product, 'desc'),
      product.sku,
      product.article,
      product.categoryId,
      product.material,
      product.volume
    ];
    return fields.some(field => String(field || '').toLocaleLowerCase().includes(query));
  }

  function renderProducts() {
    const query = searchQuery.trim().toLocaleLowerCase();
    const industry = industries.find(item => item.id === activeIndustry);
    const visibleProducts = products.filter(product => {
      if (activeCategory !== 'all' && product.categoryId !== activeCategory) return false;
      if (industry && !industry.categories.includes(product.categoryId)) return false;
      if (activeMaterial !== 'all' && !(product.material || '').toUpperCase().includes(activeMaterial)) return false;
      return matchesSearch(product, query);
    });

    if (count) count.textContent = String(visibleProducts.length);
    if (emptyState) emptyState.classList.toggle('hidden', visibleProducts.length > 0);

    grid.innerHTML = visibleProducts.map(product => {
      const title = productText(product, 'title');
      const description = productText(product, 'desc');
      const image = product.photo || product.image;
      const material = escapeHtml(product.material || 'Полимер');
      const productId = escapeHtml(product.id);

      return `
        <article class="product-card glass-card rounded-2xl p-5 flex flex-col">
          <div class="product-card__image">
            <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" width="640" height="480" loading="lazy">
            <span class="product-card__material">${material.split(/[ /(]/)[0]}</span>
          </div>
          <div class="product-card__body">
            <p class="product-card__spec">${material}</p>
            <h3>${escapeHtml(title)}</h3>
            <p class="product-card__sku">${escapeHtml(product.sku || '')}</p>
            <p class="product-card__description">${escapeHtml(description)}</p>
          </div>
          <div class="product-card__actions">
            <button type="button" class="button-secondary" data-product-details="${productId}">
              Технический паспорт
            </button>
            ${product.customizable ? `
              <button type="button" class="button-secondary" data-customize-product="${productId}">
                Посмотреть со своим логотипом
              </button>
            ` : ''}
            <button type="button" class="button-primary" data-quote-product="${productId}">
              Запросить предложение
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  industryFilters?.addEventListener('click', event => {
    const button = event.target.closest('[data-industry]');
    if (!button) return;
    activeIndustry = button.dataset.industry;
    renderIndustryFilters();
    renderProducts();
  });

  grid.addEventListener('click', event => {
    const detailsButton = event.target.closest('[data-product-details]');
    if (detailsButton) {
      const product = products.find(item => item.id === detailsButton.dataset.productDetails);
      if (product) window.muosirProductExplorer?.open(product.sku);
      return;
    }

    const button = event.target.closest('[data-quote-product]');
    if (!button || !quoteProduct) return;
    const product = products.find(item => item.id === button.dataset.quoteProduct);
    quoteProduct.value = product ? `${productText(product, 'title')} (${product.sku})` : '';
    document.getElementById('quick-quote-section')?.scrollIntoView({ behavior: 'smooth' });
    quoteProduct.focus();
  });

  document.querySelectorAll('#catalog-category-tabs [data-cat]').forEach(button => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.cat || 'all';
      document.querySelectorAll('#catalog-category-tabs [data-cat]').forEach(tab => {
        const selected = tab === button;
        tab.classList.toggle('is-active', selected);
        tab.setAttribute('aria-pressed', String(selected));
      });
      renderProducts();
    });
  });

  document.querySelectorAll('.mat-filter').forEach(button => {
    button.addEventListener('click', () => {
      activeMaterial = button.dataset.mat || 'all';
      document.querySelectorAll('.mat-filter').forEach(filter => {
        const selected = filter === button;
        filter.classList.toggle('is-active', selected);
        filter.setAttribute('aria-pressed', String(selected));
      });
      renderProducts();
    });
  });

  search?.addEventListener('input', () => {
    searchQuery = search.value;
    renderProducts();
  });

  reset?.addEventListener('click', () => {
    searchQuery = '';
    activeCategory = 'all';
    activeMaterial = 'all';
    activeIndustry = 'all';
    if (search) search.value = '';
    document.querySelectorAll('#catalog-category-tabs [data-cat]').forEach(button => {
      const selected = button.dataset.cat === 'all';
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('.mat-filter').forEach(button => {
      const selected = button.dataset.mat === 'all';
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    renderIndustryFilters();
    renderProducts();
  });

  window.addEventListener('muosir_lang_changed', () => {
    renderIndustryFilters();
    renderProducts();
  });

  const requestedSku = new URLSearchParams(window.location.search).get('quoteSku');
  if (requestedSku && quoteProduct) {
    const product = store.getProductBySku(requestedSku);
    if (product) quoteProduct.value = `${productText(product, 'title')} (${product.sku})`;
  }

  renderIndustryFilters();
  document.querySelectorAll('#catalog-category-tabs [data-cat]').forEach(button => {
    const selected = button.dataset.cat === activeCategory;
    button.setAttribute('aria-pressed', String(selected));
  });
  renderProducts();
});

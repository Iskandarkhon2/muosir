import { loadCatalogProducts, matchesCatalogSearch } from './catalog-data.js';
import { localizeCatalogText } from './catalog-localization.mjs';

document.addEventListener('DOMContentLoaded', async () => {
  const store = window.muosirStore;
  const i18n = window.muosirI18n;
  const grid = document.getElementById('catalog-products-grid');
  const count = document.getElementById('product-count');
  const emptyState = document.getElementById('no-products-msg');
  const searchForm = document.getElementById('catalog-search-form');
  const search = document.getElementById('catalog-search-input');
  const reset = document.getElementById('catalog-reset-filter');
  const quoteProduct = document.getElementById('quote-product-field');
  const industryFilters = document.getElementById('catalog-industry-filters');
  const categoryFilters = document.getElementById('catalog-category-filters');
  const materialFilters = document.getElementById('catalog-material-filters');
  const boxQuantityFilters = document.getElementById('catalog-box-quantity-filters');
  const filterDialog = document.getElementById('catalog-filter-dialog');
  const filterOpen = document.getElementById('catalog-filter-open');
  const activeFilterCount = document.getElementById('catalog-filter-active-count');
  const detailsDialog = document.getElementById('catalog-product-dialog');

  if (!i18n || !grid) return;

  let products;
  try {
    products = await loadCatalogProducts();
  } catch (error) {
    console.error('Unable to load catalog product images.', error);
    if (emptyState) {
      emptyState.classList.remove('hidden');
      emptyState.querySelector('h3').textContent = i18n.translate('catalog_load_error');
      emptyState.querySelector('p').textContent = i18n.translate('catalog_load_error_text');
    }
    return;
  }

  const industries = [
    { id: 'dairy', categories: ['dairy'], labels: ['Молочная промышленность', 'Dairy industry', 'Sut sanoati', 'Сүт өнеркәсібі'] },
    { id: 'eggs', categories: ['eggs'], labels: ['Птицеводство и фасовка яиц', 'Poultry and egg packing', 'Parrandachilik va tuxum qadoqlash', 'Құс шаруашылығы және жұмыртқа'] },
    { id: 'confectionery', categories: ['confectionery'], labels: ['Кондитерские предприятия', 'Confectionery', 'Qandolatchilik korxonalari', 'Кондитерлік кәсіпорындар'] },
    { id: 'food', categories: ['containers'], labels: ['Пищевые производства и фасовка', 'Food production and packing', 'Oziq-ovqat ishlab chiqarish va qadoqlash', 'Азық-түлік өндірісі және қаптау'] },
    { id: 'horeca', categories: ['cups', 'containers'], labels: ['HoReCa и Fast Food', 'HoReCa and fast food', 'HoReCa va tezkor ovqatlanish', 'HoReCa және жылдам тамақтану'] }
  ];

  const categories = [
    { id: 'dairy', labels: ['Молочная упаковка', 'Dairy packaging', 'Sut qadoqlari', 'Сүт қаптамасы'] },
    { id: 'eggs', labels: ['Упаковка для яиц', 'Egg packaging', 'Tuxum qadoqlari', 'Жұмыртқа қаптамасы'] },
    { id: 'confectionery', labels: ['Кондитерская тара', 'Confectionery packaging', 'Qandolatchilik qadoqlari', 'Кондитерлік қаптамалар'] },
    { id: 'containers', labels: ['Контейнеры и ланч-боксы', 'Containers and lunch boxes', 'Konteynerlar va tushlik qutilari', 'Контейнерлер және түскі ас қораптары'] },
    { id: 'cups', labels: ['Стаканы и крышки', 'Cups and lids', 'Stakanlar va qopqoqlar', 'Стақандар және қақпақтар'] },
    { id: 'polymer-tape', labels: ['Полимерные ленты', 'Polymer tape', 'Polimer lentalar', 'Полимер таспалар'] }
  ];
  const materials = [
    { id: 'PP', label: 'PP (Полипропилен)' },
    { id: 'PET', label: 'PET (ПЭТ)' },
    { id: 'PS', label: 'PS (Полистирол)' }
  ];
  const boxQuantityRanges = [
    { id: 'up-to-100', labels: ['До 100 шт.', 'Up to 100 pcs.', '100 donagacha', '100 данаға дейін'], min: 1, max: 100 },
    { id: '101-300', labels: ['101–300 шт.', '101–300 pcs.', '101–300 dona', '101–300 дана'], min: 101, max: 300 },
    { id: '301-500', labels: ['301–500 шт.', '301–500 pcs.', '301–500 dona', '301–500 дана'], min: 301, max: 500 },
    { id: '501-1000', labels: ['501–1000 шт.', '501–1000 pcs.', '501–1000 dona', '501–1000 дана'], min: 501, max: 1000 },
    { id: 'over-1000', labels: ['Более 1000 шт.', 'Over 1000 pcs.', '1000 donadan ko‘p', '1000 данаға артық'], min: 1001, max: Infinity },
    { id: 'not-specified', labels: ['Не указано', 'Not specified', 'Ko‘rsatilmagan', 'Көрсетілмеген'] }
  ];
  const requestedIndustry = new URLSearchParams(window.location.search).get('industry');
  let activeCategories = new Set();
  let activeMaterials = new Set();
  let activeIndustries = new Set(industries.some(industry => industry.id === requestedIndustry) ? [requestedIndustry] : []);
  let activeBoxQuantities = new Set();
  let searchQuery = '';

  const selectionsByGroup = {
    industry: activeIndustries,
    category: activeCategories,
    material: activeMaterials,
    'box-quantity': activeBoxQuantities
  };

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
    return localizeCatalogText(product[`${key}${suffix}`] || product[key] || '', i18n.getLang());
  }

  function localizedDetailLabel(label) {
    return localizeCatalogText(label, i18n.getLang());
  }

  function localizedDetailValue(value) {
    return localizeCatalogText(value, i18n.getLang());
  }

  function productSpecification(product) {
    return product.details.map(detail =>
      `${localizedDetailLabel(detail.label)}: ${localizedDetailValue(detail.value)}`
    ).join('; ');
  }

  function getBoxQuantity(product) {
    const detail = product.details.find(item => item.label === 'Количество в коробке');
    const match = detail?.value.match(/[\d\s]+/);
    return match ? Number(match[0].replace(/\s/g, '')) : null;
  }

  function matchesFilterOption(product, group, id) {
    if (id === 'all') return true;
    if (group === 'industry') {
      return industries.find(industry => industry.id === id)?.categories.includes(product.categoryId) || false;
    }
    if (group === 'category') return product.categoryId === id;
    if (group === 'material') return product.specificationText.toUpperCase().includes(id);
    if (group === 'box-quantity') {
      const quantity = getBoxQuantity(product);
      if (id === 'not-specified') return quantity === null;
      const range = boxQuantityRanges.find(option => option.id === id);
      return quantity !== null && Boolean(range) && quantity >= range.min && quantity <= range.max;
    }
    return true;
  }

  function matchesActiveFilters(product, excludedGroup) {
    if (excludedGroup !== 'category' && activeCategories.size && ![...activeCategories].some(id => matchesFilterOption(product, 'category', id))) return false;
    if (excludedGroup !== 'industry' && activeIndustries.size && ![...activeIndustries].some(id => matchesFilterOption(product, 'industry', id))) return false;
    if (excludedGroup !== 'material' && activeMaterials.size && ![...activeMaterials].some(id => matchesFilterOption(product, 'material', id))) return false;
    if (excludedGroup !== 'box-quantity' && activeBoxQuantities.size && ![...activeBoxQuantities].some(id => matchesFilterOption(product, 'box-quantity', id))) return false;
    return matchesSearch(product, searchQuery.trim().toLocaleLowerCase());
  }

  function countFilterOption(group, id) {
    return products.filter(product =>
      matchesActiveFilters(product, group) && matchesFilterOption(product, group, id)
    ).length;
  }

  function renderFilterOptions(container, group, allLabel, options, selectedValues, getCount) {
    if (!container) return;
    const allSelected = selectedValues.size === 0;
    const optionMarkup = [{ id: 'all', label: allLabel }, ...options].map(option => {
      const selected = option.id === 'all' ? allSelected : selectedValues.has(option.id);
      const optionCount = getCount(option.id);
      const disabled = option.id !== 'all' && !selected && optionCount === 0;
      return `
        <label class="catalog-filter-option${disabled ? ' is-disabled' : ''}">
          <input type="checkbox" data-catalog-filter="${group}" value="${escapeHtml(option.id)}"${selected ? ' checked' : ''}${disabled ? ' disabled' : ''}>
          <span class="catalog-filter-option__label">${escapeHtml(option.label)}</span>
          <span class="catalog-filter-option__count">${optionCount}</span>
        </label>
      `;
    });
    container.innerHTML = optionMarkup.join('');
  }

  function renderFilterDialog() {
    const languageIndex = { ru: 0, en: 1, uz: 2, kk: 3 }[i18n.getLang()] || 0;
    const openGroups = new Set(
      [...(filterDialog?.querySelectorAll('details[open]') || [])].map(group => group.dataset.filterDetails)
    );
    renderFilterOptions(
      industryFilters,
      'industry',
      ['Все отрасли', 'All industries', 'Barcha sohalar', 'Барлық салалар'][languageIndex],
      industries.map(industry => ({ id: industry.id, label: industry.labels[languageIndex] })),
      activeIndustries,
      id => countFilterOption('industry', id)
    );
    renderFilterOptions(
      categoryFilters,
      'category',
      ['Все категории', 'All categories', 'Barcha kategoriyalar', 'Барлық категориялар'][languageIndex],
      categories.map(category => ({ id: category.id, label: category.labels[languageIndex] })),
      activeCategories,
      id => countFilterOption('category', id)
    );
    renderFilterOptions(
      materialFilters,
      'material',
      ['Все материалы', 'All materials', 'Barcha materiallar', 'Барлық материалдар'][languageIndex],
      materials,
      activeMaterials,
      id => countFilterOption('material', id)
    );
    renderFilterOptions(
      boxQuantityFilters,
      'box-quantity',
      ['Любое количество', 'Any quantity', 'Har qanday miqdor', 'Кез келген сан'][languageIndex],
      boxQuantityRanges.map(option => ({ id: option.id, label: option.labels[languageIndex] })),
      activeBoxQuantities,
      id => countFilterOption('box-quantity', id)
    );
    filterDialog?.querySelectorAll('details[data-filter-details]').forEach(group => {
      group.open = openGroups.has(group.dataset.filterDetails);
    });
    updateFilterAvailability();
    updateFilterTrigger();
  }

  function updateFilterAvailability() {
    filterDialog?.querySelectorAll('input[data-catalog-filter]').forEach(input => {
      const group = input.dataset.catalogFilter;
      const selections = selectionsByGroup[group];
      if (!selections) return;
      const selected = input.value === 'all' ? selections.size === 0 : selections.has(input.value);
      const optionCount = countFilterOption(group, input.value);
      const disabled = input.value !== 'all' && !selected && optionCount === 0;
      const label = input.closest('.catalog-filter-option');
      const count = label?.querySelector('.catalog-filter-option__count');

      input.checked = selected;
      input.disabled = disabled;
      label?.classList.toggle('is-disabled', disabled);
      if (count) count.textContent = String(optionCount);
    });
  }

  function updateFilterTrigger() {
    const selectedCount = activeCategories.size + activeMaterials.size + activeIndustries.size + activeBoxQuantities.size;
    if (activeFilterCount) {
      activeFilterCount.textContent = String(selectedCount);
      activeFilterCount.hidden = selectedCount === 0;
    }
    if (filterOpen) {
      filterOpen.setAttribute('aria-label', selectedCount
        ? `${i18n.translate('catalog_filter_title')}, ${selectedCount}`
        : i18n.translate('catalog_filter_title'));
    }
    Object.entries(selectionsByGroup).forEach(([group, selections]) => {
      const counter = filterDialog?.querySelector(`[data-filter-selected-count="${group}"]`);
      if (!counter) return;
      counter.textContent = String(selections.size);
      counter.hidden = selections.size === 0;
    });
  }

  function matchesSearch(product, query) {
    return matchesCatalogSearch({
      ...product,
      title: productText(product, 'title')
    }, query);
  }

  function renderProducts() {
    const query = searchQuery.trim().toLocaleLowerCase();
    const visibleProducts = products.filter(product => {
      if (activeCategories.size && !activeCategories.has(product.categoryId)) return false;
      if (activeIndustries.size && !industries.some(industry =>
        activeIndustries.has(industry.id) && industry.categories.includes(product.categoryId)
      )) return false;
      if (activeMaterials.size && ![...activeMaterials].some(material => product.specificationText.toUpperCase().includes(material))) return false;
      if (activeBoxQuantities.size && ![...activeBoxQuantities].some(quantity => matchesFilterOption(product, 'box-quantity', quantity))) return false;
      return matchesSearch(product, query);
    });

    if (count) count.textContent = String(visibleProducts.length);
    if (emptyState) emptyState.classList.toggle('hidden', visibleProducts.length > 0);

    grid.innerHTML = visibleProducts.map(product => {
      const title = productText(product, 'title');
      const material = escapeHtml(localizedDetailValue(product.material));
      const productId = escapeHtml(product.id);

      return `
        <article class="product-card glass-card rounded-2xl p-5 flex flex-col" data-product-card="${productId}" tabindex="0" aria-label="${i18n.translate('catalog_open_details')}: ${escapeHtml(title)}">
          <div class="product-card__image">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(title)}" width="640" height="480" loading="lazy">
            ${material ? `<span class="product-card__material">${material.split(/[ /(]/)[0]}</span>` : ''}
          </div>
          <div class="product-card__body">
            ${material ? `<p class="product-card__spec">${material}</p>` : ''}
            <h3>${escapeHtml(title)}</h3>
            <dl class="catalog-product-specs catalog-product-specs--compact">
              ${product.details.map(detail => `
                <div><dt>${escapeHtml(localizedDetailLabel(detail.label))}</dt><dd>${escapeHtml(localizedDetailValue(detail.value))}</dd></div>
              `).join('')}
            </dl>
          </div>
          <div class="product-card__actions">
            <button type="button" class="button-secondary" data-product-details="${productId}">
              ${i18n.translate('catalog_details')}
            </button>
            <button type="button" class="button-primary" data-quote-product="${productId}">
              ${i18n.translate('catalog_request_quote')}
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  function openProductDetails(product) {
    if (!detailsDialog || !product) return;
    const title = productText(product, 'title');
    detailsDialog.innerHTML = `
      <div class="product-quickview__header">
        <div>
          <p class="product-quickview__eyebrow">${i18n.translate('catalog_specs')}</p>
          <h2 class="color-primary">${escapeHtml(title)}</h2>
        </div>
        <button type="button" class="product-quickview__close" data-close-product-details aria-label="${i18n.translate('catalog_close')}">×</button>
      </div>
      <div class="product-quickview__content">
        <div class="product-quickview__main-image">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(title)}">
        </div>
        <div class="product-quickview__details">
          <dl class="catalog-product-specs">
            ${product.details.map(detail => `
              <div><dt>${escapeHtml(localizedDetailLabel(detail.label))}</dt><dd>${escapeHtml(localizedDetailValue(detail.value))}</dd></div>
            `).join('')}
          </dl>
        </div>
      </div>
    `;
    detailsDialog.querySelector('[data-close-product-details]').addEventListener('click', () => detailsDialog.close());
    if (!detailsDialog.open) detailsDialog.showModal();
  }

  filterDialog?.addEventListener('change', event => {
    const input = event.target.closest('input[data-catalog-filter]');
    if (!input) return;

    const selections = {
      industry: activeIndustries,
      category: activeCategories,
      material: activeMaterials,
      'box-quantity': activeBoxQuantities
    }[input.dataset.catalogFilter];
    if (!selections) return;

    if (input.value === 'all') {
      selections.clear();
      input.closest('.catalog-filter-options').querySelectorAll('input:not([value="all"])').forEach(option => {
        option.checked = false;
      });
    } else if (input.checked) {
      selections.add(input.value);
    } else {
      selections.delete(input.value);
    }

    const allOption = input.closest('.catalog-filter-options').querySelector('input[value="all"]');
    if (allOption) allOption.checked = selections.size === 0;
    updateFilterAvailability();
    updateFilterTrigger();
    renderProducts();
  });

  filterOpen?.addEventListener('click', () => {
    if (!filterDialog?.open) {
      filterDialog?.showModal();
      filterOpen.setAttribute('aria-expanded', 'true');
    }
  });
  filterDialog?.addEventListener('close', () => filterOpen?.setAttribute('aria-expanded', 'false'));
  filterDialog?.addEventListener('click', event => {
    if (event.target === filterDialog) filterDialog.close();
  });
  filterDialog?.querySelectorAll('[data-close-catalog-filters]').forEach(button => {
    button.addEventListener('click', () => filterDialog.close());
  });

  grid.addEventListener('click', event => {
    const card = event.target.closest('[data-product-card]');
    if (card && !event.target.closest('button, a, input')) {
      openProductDetails(products.find(item => item.id === card.dataset.productCard));
      return;
    }

    const detailsButton = event.target.closest('[data-product-details]');
    if (detailsButton) {
      openProductDetails(products.find(item => item.id === detailsButton.dataset.productDetails));
      return;
    }

    const button = event.target.closest('[data-quote-product]');
    if (!button || !quoteProduct) return;
    const product = products.find(item => item.id === button.dataset.quoteProduct);
    quoteProduct.value = product ? `${productText(product, 'title')} — ${productSpecification(product)}` : '';
    document.getElementById('quick-quote-section')?.scrollIntoView({ behavior: 'smooth' });
    quoteProduct.focus();
  });

  grid.addEventListener('keydown', event => {
    const card = event.target.closest('[data-product-card]');
    if (!card || event.target !== card || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    openProductDetails(products.find(item => item.id === card.dataset.productCard));
  });

  const applySearch = () => {
    searchQuery = search?.value || '';
    updateFilterAvailability();
    renderProducts();
  };
  search?.addEventListener('input', applySearch);
  searchForm?.addEventListener('submit', event => {
    event.preventDefault();
    applySearch();
    search?.focus();
  });

  reset?.addEventListener('click', () => {
    searchQuery = '';
    activeCategories.clear();
    activeMaterials.clear();
    activeIndustries.clear();
    activeBoxQuantities.clear();
    if (search) search.value = '';
    renderFilterDialog();
    renderProducts();
  });

  window.addEventListener('muosir_lang_changed', () => {
    renderFilterDialog();
    renderProducts();
  });

  const requestedSku = new URLSearchParams(window.location.search).get('quoteSku');
  if (requestedSku && quoteProduct && store) {
    const product = store.getProductBySku(requestedSku);
    if (product) quoteProduct.value = `${productText(product, 'title')} (${product.sku})`;
  }

  renderFilterDialog();
  renderProducts();

  const requestedProductId = new URLSearchParams(window.location.search).get('product');
  if (requestedProductId) {
    openProductDetails(products.find(product => product.id === requestedProductId));
  }
});

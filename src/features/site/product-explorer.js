(() => {
  const labels = {
    ru: {
      search: 'Поиск по каталогу',
      placeholder: 'Название или характеристики товара',
      close: 'Закрыть',
      noResults: 'Ничего не найдено',
      catalogError: 'Не удалось загрузить каталог. Обновите страницу и попробуйте снова.',
      sku: 'Артикул',
      material: 'Материал',
      volume: 'Объём / назначение',
      dimensions: 'Размеры',
      box: 'В коробке',
      pallet: 'На паллете',
      weight: 'Масса короба',
      moq: 'Минимальная партия',
      onRequest: 'Уточнить у менеджера',
      related: 'Сопутствующие товары',
      quote: 'Запросить коммерческое предложение',
      customize: 'Примерить логотип',
      image: 'Изображение изделия',
      searchLabel: 'Открыть поиск по каталогу'
    },
    en: {
      search: 'Search the catalog',
      placeholder: 'Product name or specifications',
      close: 'Close',
      noResults: 'No matching products',
      catalogError: 'The catalog could not be loaded. Refresh the page and try again.',
      sku: 'SKU',
      material: 'Material',
      volume: 'Volume / use',
      dimensions: 'Dimensions',
      box: 'Per box',
      pallet: 'Per pallet',
      weight: 'Box weight',
      moq: 'Minimum order',
      onRequest: 'Ask the sales team',
      related: 'Related products',
      quote: 'Request a quotation',
      customize: 'Preview with a logo',
      image: 'Product image',
      searchLabel: 'Open catalog search'
    },
    uz: {
      search: 'Katalogdan qidirish',
      placeholder: 'Mahsulot nomi yoki xususiyatlari',
      close: 'Yopish',
      noResults: 'Mos mahsulot topilmadi',
      catalogError: 'Katalogni yuklab bo‘lmadi. Sahifani yangilab, qayta urinib ko‘ring.',
      sku: 'Artikul',
      material: 'Material',
      volume: 'Hajm / foydalanish',
      dimensions: 'O‘lchamlar',
      box: 'Qutida',
      pallet: 'Palletda',
      weight: 'Quti og‘irligi',
      moq: 'Minimal buyurtma',
      onRequest: 'Savdo bo‘limidan so‘rang',
      related: 'Tegishli mahsulotlar',
      quote: 'Tijorat taklifini so‘rash',
      customize: 'Logotipni sinab ko‘rish',
      image: 'Mahsulot rasmi',
      searchLabel: 'Katalog qidiruvini ochish'
    },
    kk: {
      search: 'Каталогтан іздеу',
      placeholder: 'Өнім атауы немесе сипаттамалары',
      close: 'Жабу',
      noResults: 'Сәйкес өнім табылмады',
      catalogError: 'Каталогты жүктеу мүмкін болмады. Бетті жаңартып, қайталап көріңіз.',
      sku: 'Артикул',
      material: 'Материал',
      volume: 'Көлемі / қолданылуы',
      dimensions: 'Өлшемдері',
      box: 'Қорапта',
      pallet: 'Паллетте',
      weight: 'Қорап салмағы',
      moq: 'Ең аз тапсырыс',
      onRequest: 'Сату бөлімінен сұраңыз',
      related: 'Қатысты өнімдер',
      quote: 'Коммерциялық ұсыныс сұрау',
      customize: 'Логотипті көру',
      image: 'Өнім суреті',
      searchLabel: 'Каталог іздеуін ашу'
    }
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

  async function initialize() {
    const store = window.muosirStore;
    if (!store || !document.querySelector('.site-content')) return;

    let catalogProducts = [];
    let catalogLoadError = false;
    try {
      const response = await fetch('src/features/catalog/catalog-products.json');
      if (!response.ok) throw new Error(`Catalog manifest request failed: ${response.status}`);
      const filenames = await response.json();
      if (!Array.isArray(filenames) || filenames.some(filename => typeof filename !== 'string' || /[\\/]/.test(filename))) {
        throw new TypeError('Catalog manifest must contain image filenames only.');
      }
      catalogProducts = [...new Set(filenames)].map(filename => {
        const specificationText = filename.replace(/\.[^.]+$/, '');
        const [rawName] = specificationText.split('_');
        const material = specificationText.split('_')
          .find(specification => specification.startsWith('Материал-'))
          ?.slice('Материал-'.length)
          .replace(/-/g, ' ') || '';
        const searchSpecifications = specificationText.split('_').slice(1)
          .map(specification => specification
            .replace(/-/g, ' ')
            .replace(/(\d)(?=(?:шт|см|мл)\b)/gi, '$1 '))
          .join(' · ');
        const name = rawName.replace(/-/g, ' ');
        return {
          filename,
          title: name.charAt(0).toLocaleUpperCase('ru') + name.slice(1),
          material,
          searchSpecifications,
          specificationText,
          image: `catalog/${filename}`
        };
      });
    } catch (error) {
      console.error('Unable to load catalog products for search.', error);
      catalogLoadError = true;
    }

    const locale = () => labels[window.muosirI18n?.getLang() || 'ru'] || labels.ru;
    const translateProduct = (product, field) => {
      const language = window.muosirI18n?.getLang() || 'ru';
      const suffix = language === 'ru' ? '' : language[0].toUpperCase() + language.slice(1);
      return product[`${field}${suffix}`] || product[field] || '';
    };
    const categoryName = product => {
      const category = store.getData().categories?.find(item => item.id === product.categoryId);
      return category ? translateProduct(category, 'name') : product.categoryId || '';
    };

    const searchDialog = document.createElement('dialog');
    searchDialog.className = 'site-search-dialog';
    searchDialog.setAttribute('aria-labelledby', 'site-search-title');
    searchDialog.innerHTML = `
      <div class="site-search-dialog__header">
        <h2 id="site-search-title" class="color-primary"></h2>
        <button type="button" class="site-search-dialog__close" aria-label="Close">×</button>
      </div>
      <label class="site-search-dialog__field">
        <span class="sr-only"></span>
        <input type="search" autocomplete="off" aria-controls="site-search-results">
      </label>
      <div class="site-search-dialog__results" id="site-search-results" role="listbox"></div>
    `;

    const productDialog = document.createElement('dialog');
    productDialog.className = 'product-quickview-dialog';
    productDialog.setAttribute('aria-labelledby', 'product-quickview-title');
    document.body.append(searchDialog, productDialog);

    const searchInput = searchDialog.querySelector('input');
    const searchResults = searchDialog.querySelector('#site-search-results');
    let activeProduct = null;
    let searchSelection = -1;

    function normalizeSearchText(value) {
      return String(value || '')
        .normalize('NFKC')
        .toLocaleLowerCase()
        .replace(/([a-zа-яё])(?=\d)/gi, '$1 ')
        .replace(/(\d)(?=[a-zа-яё])/gi, '$1 ')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function renderSearchResults() {
      const query = normalizeSearchText(searchInput.value);
      const products = catalogProducts.filter(product => {
        const searchText = normalizeSearchText(`${product.title} ${product.specificationText} ${product.material}`);
        return !query || searchText.includes(query);
      }).slice(0, 12);

      searchSelection = -1;
      searchResults.innerHTML = catalogLoadError
        ? `<p class="site-search-dialog__empty color-muted">${escapeHtml(locale().catalogError)}</p>`
        : products.length
        ? products.map(product => `
            <button type="button" class="site-search-result" role="option" aria-selected="false"
              data-catalog-filename="${escapeHtml(product.filename)}">
              <img class="site-search-result__image" src="${escapeHtml(product.image)}" alt="" loading="lazy">
              <span class="site-search-result__name">${escapeHtml(product.title)}</span>
              <span class="site-search-result__meta">${escapeHtml(product.searchSpecifications || product.material || product.specificationText.replace(/[-_]/g, ' '))}</span>
            </button>
          `).join('')
        : `<p class="site-search-dialog__empty color-muted">${escapeHtml(locale().noResults)}</p>`;
    }

    function openCatalogProduct(filename) {
      searchDialog.close();
      const destination = new URL('catalog.html', window.location.href);
      destination.searchParams.set('product', filename);
      window.location.assign(destination.href);
    }

    function getProduct(identifier) {
      return store.getProductBySku(identifier) || store.getProductById(identifier);
    }

    function getRelatedProducts(product) {
      return (product.relatedSkus || [])
        .map(sku => store.getProductBySku(sku))
        .filter(Boolean);
    }

    function openProduct(identifier, updateAddress = true) {
      const product = getProduct(identifier);
      if (!product) return false;
      const shouldTrackView = !productDialog.open || activeProduct?.sku !== product.sku;
      activeProduct = product;

      const title = translateProduct(product, 'title');
      const gallery = (product.gallery || [product.photo || product.image]).filter(Boolean);
      const mainImage = gallery[0] || product.image || product.photo;
      const dimensions = product.dimensions?.description || product.diameter || '';
      const details = [
        [locale().sku, product.sku],
        [locale().material, product.material],
        [locale().volume, product.volume],
        [locale().dimensions, dimensions],
        [locale().box, product.packing?.inBox || product.boxQty],
        [locale().pallet, product.packing?.onPallet],
        [locale().weight, product.packing?.boxWeight],
        [locale().moq, product.moq || product.minOrder]
      ].filter(([, value]) => value);
      const related = getRelatedProducts(product);

      productDialog.innerHTML = `
        <div class="product-quickview__header">
          <div>
            <p class="product-quickview__eyebrow">${escapeHtml(categoryName(product))}</p>
            <h2 id="product-quickview-title" class="color-primary">${escapeHtml(title)}</h2>
          </div>
          <button type="button" class="product-quickview__close" aria-label="${escapeHtml(locale().close)}">×</button>
        </div>
        <div class="product-quickview__content">
          <div class="product-quickview__gallery">
            <div class="product-quickview__main-image">
              <img src="${escapeHtml(mainImage)}" alt="${escapeHtml(title)}">
            </div>
            <div class="product-quickview__thumbnails" role="group" aria-label="${escapeHtml(locale().image)}">
              ${gallery.map((image, index) => `
                <button type="button" class="product-quickview__thumbnail${index === 0 ? ' is-active' : ''}"
                  data-gallery-image="${escapeHtml(image)}" aria-pressed="${index === 0}">
                  <img src="${escapeHtml(image)}" alt="">
                </button>
              `).join('')}
            </div>
          </div>
          <div class="product-quickview__details">
            <dl class="product-quickview__specs">
              ${details.map(([label, value]) => `
                <div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || locale().onRequest)}</dd></div>
              `).join('')}
            </dl>
            <p class="product-quickview__missing">${escapeHtml(locale().onRequest)}: ${escapeHtml(locale().pallet)}, ${escapeHtml(locale().weight)}.</p>
            ${related.length ? `
              <section class="product-quickview__related" aria-label="${escapeHtml(locale().related)}">
                <h3>${escapeHtml(locale().related)}</h3>
                <div>${related.map(item => `
                  <button type="button" data-related-sku="${escapeHtml(item.sku)}">
                    <span>${escapeHtml(translateProduct(item, 'title'))}</span>
                    <small>${escapeHtml(item.sku)}</small>
                  </button>
                `).join('')}</div>
              </section>
            ` : ''}
          </div>
        </div>
        <div class="product-quickview__actions">
          <button type="button" class="button-secondary" data-product-quote>${escapeHtml(locale().quote)}</button>
          ${product.customizable ? `<button type="button" class="button-primary" data-product-customize>${escapeHtml(locale().customize)}</button>` : ''}
        </div>
      `;

      productDialog.querySelector('.product-quickview__close').addEventListener('click', () => productDialog.close());
      productDialog.querySelectorAll('[data-gallery-image]').forEach(button => {
        button.addEventListener('click', () => {
          productDialog.querySelector('.product-quickview__main-image img').src = button.dataset.galleryImage;
          productDialog.querySelectorAll('[data-gallery-image]').forEach(thumbnail => {
            const selected = thumbnail === button;
            thumbnail.classList.toggle('is-active', selected);
            thumbnail.setAttribute('aria-pressed', String(selected));
          });
        });
      });
      productDialog.querySelectorAll('[data-related-sku]').forEach(button => {
        button.addEventListener('click', () => openProduct(button.dataset.relatedSku));
      });
      productDialog.querySelector('[data-product-quote]').addEventListener('click', () => {
        productDialog.close();
        const quoteField = document.getElementById('quote-product-field');
        if (quoteField) {
          quoteField.value = `${title} (${product.sku})`;
          document.getElementById('quick-quote-section')?.scrollIntoView({ behavior: 'smooth' });
          quoteField.focus();
          return;
        }
        window.location.href = `catalog.html?quoteSku=${encodeURIComponent(product.sku)}#quick-quote-section`;
      });
      productDialog.querySelector('[data-product-customize]')?.addEventListener('click', () => {
        productDialog.close();
        if (document.querySelector('script[src*="features/catalog/customizer.js"]')) {
          window.dispatchEvent(new CustomEvent('muosir:open-customizer', { detail: { productId: product.id } }));
          return;
        }
        window.location.href = `catalog.html?customize=${encodeURIComponent(product.id)}`;
      });

      if (updateAddress) {
        const hash = `#product=${encodeURIComponent(product.sku)}`;
        if (window.location.hash !== hash) {
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
        }
      }
      if (!productDialog.open) productDialog.showModal();
      if (shouldTrackView) window.muosirAnalytics?.trackViewProduct?.(product);
      return true;
    }

    function openSearch() {
      if (!searchDialog.open) searchDialog.showModal();
      renderSearchResults();
      searchInput.focus();
      searchInput.select();
    }

    function addSearchTrigger(container) {
      if (!container || container.querySelector('[data-open-site-search]')) return;
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'site-search-trigger';
      trigger.dataset.openSiteSearch = '';
      trigger.setAttribute('aria-label', locale().searchLabel);
      trigger.title = locale().searchLabel;
      trigger.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m16 16 4 4"></path></svg>';
      trigger.addEventListener('click', openSearch);
      container.append(trigger);
    }

    const nav = document.querySelector('.site-content header nav');
    addSearchTrigger(nav);
    addSearchTrigger(document.getElementById('mobile-nav-menu'));

    searchDialog.querySelector('.site-search-dialog__close').addEventListener('click', () => searchDialog.close());
    searchDialog.addEventListener('click', event => {
      if (event.target === searchDialog) searchDialog.close();
    });
    searchInput.addEventListener('input', renderSearchResults);
    searchInput.addEventListener('keydown', event => {
      const options = [...searchResults.querySelectorAll('[data-catalog-filename]')];
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!options.length) return;
        searchSelection = (searchSelection + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
        options.forEach((option, index) => {
          option.setAttribute('aria-selected', String(index === searchSelection));
        });
      } else if (event.key === 'Enter' && options.length) {
        event.preventDefault();
        openCatalogProduct(options[Math.max(searchSelection, 0)].dataset.catalogFilename);
      }
    });
    searchResults.addEventListener('click', event => {
      const result = event.target.closest('[data-catalog-filename]');
      if (!result) return;
      openCatalogProduct(result.dataset.catalogFilename);
    });
    productDialog.addEventListener('click', event => {
      if (event.target === productDialog) productDialog.close();
    });
    productDialog.addEventListener('close', () => {
      if (activeProduct && window.location.hash === `#product=${encodeURIComponent(activeProduct.sku)}`) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      }
      activeProduct = null;
    });
    window.addEventListener('hashchange', () => {
      const identifier = new URLSearchParams(window.location.hash.slice(1)).get('product');
      if (identifier) openProduct(identifier, false);
      else if (productDialog.open) productDialog.close();
    });
    window.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openSearch();
      }
    });
    window.addEventListener('muosir_store_updated', renderSearchResults);
    window.addEventListener('muosir_lang_changed', () => {
      searchDialog.querySelector('#site-search-title').textContent = locale().search;
      searchInput.placeholder = locale().placeholder;
      searchDialog.querySelector('.site-search-dialog__field span').textContent = locale().placeholder;
      searchDialog.querySelector('.site-search-dialog__close').setAttribute('aria-label', locale().close);
      document.querySelectorAll('[data-open-site-search]').forEach(button => {
        button.setAttribute('aria-label', locale().searchLabel);
        button.title = locale().searchLabel;
      });
      renderSearchResults();
      if (productDialog.open && activeProduct) openProduct(activeProduct.sku, false);
    });

    searchDialog.querySelector('#site-search-title').textContent = locale().search;
    searchInput.placeholder = locale().placeholder;
    searchDialog.querySelector('.site-search-dialog__field span').textContent = locale().placeholder;
    searchDialog.querySelector('.site-search-dialog__close').setAttribute('aria-label', locale().close);

    const deepLink = new URLSearchParams(window.location.hash.slice(1)).get('product');
    if (deepLink) openProduct(deepLink, false);

    window.muosirProductExplorer = { open: openProduct, openSearch };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initialize().catch(error => console.error('Unable to initialize catalog search.', error));
    }, { once: true });
  } else {
    initialize().catch(error => console.error('Unable to initialize catalog search.', error));
  }
})();

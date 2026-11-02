(() => {
  const products = {
    'cup-500': {
      labelKey: 'viz_prod_cup_500',
      image: 'assets/images/cup_3d_base.jpg',
      zone: { x: 0.34, y: 0.43, width: 0.32, height: 0.25 }
    },
    container: {
      labelKey: 'viz_prod_container',
      image: 'assets/images/container_3d_base.jpg',
      zone: { x: 0.29, y: 0.39, width: 0.42, height: 0.2 }
    },
    'dairy-cup': {
      labelKey: 'viz_prod_dairy_cup',
      image: 'assets/images/dairy_cup_3d_base.jpg',
      zone: { x: 0.28, y: 0.31, width: 0.44, height: 0.3 }
    },
    'egg-tray': {
      labelKey: 'viz_prod_egg_tray',
      image: 'assets/images/egg_tray_3d_base.jpg',
      zone: { x: 0.27, y: 0.4, width: 0.46, height: 0.2 }
    }
  };

  const maximumFileSize = 5 * 1024 * 1024;
  const acceptedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
  const canvas = document.getElementById('mockup-canvas');
  const context = canvas.getContext('2d');
  const fileInput = document.getElementById('logo-file');
  const uploadZone = document.querySelector('.upload-zone');
  const uploadTitle = document.getElementById('upload-title');
  const uploadError = document.getElementById('upload-error');
  const emptyState = document.getElementById('preview-empty');
  const previewStage = document.getElementById('preview-stage');
  const productName = document.getElementById('preview-product-name');
  const quoteProductName = document.getElementById('quote-product-name');
  const sizeInput = document.getElementById('logo-size');
  const opacityInput = document.getElementById('logo-opacity');
  const sizeOutput = document.getElementById('logo-size-output');
  const opacityOutput = document.getElementById('logo-opacity-output');
  const downloadButton = document.getElementById('download-preview');
  const quoteDialog = document.getElementById('quote-dialog');
  const quoteForm = document.getElementById('quote-form');

  let selectedId = 'cup-500';
  let productImage = new Image();
  let logoImage = null;
  let logoUrl = null;

  function translate(key) {
    return window.muosirI18n?.translate(key) || key;
  }

  function getProductName(product) {
    return window.muosirI18n?.translate(product.labelKey) || product.labelKey;
  }

  function loadProduct(id) {
    const product = products[id];
    if (!product) return;

    selectedId = id;
    previewStage.classList.add('is-changing');
    document.querySelectorAll('[data-product]').forEach(button => {
      const selected = button.dataset.product === id;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    const name = getProductName(product);
    productName.textContent = name;
    quoteProductName.textContent = name;
    const nextImage = new Image();
    nextImage.onload = () => {
      productImage = nextImage;
      renderPreview();
      requestAnimationFrame(() => previewStage.classList.remove('is-changing'));
    };
    nextImage.onerror = () => {
      previewStage.classList.remove('is-changing');
      showUploadError(translate('viz_error_product_image'));
    };
    nextImage.src = product.image;
  }

  function renderPreview() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !productImage.complete || !productImage.naturalWidth) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const renderSize = Math.round(bounds.width * pixelRatio);
    if (canvas.width !== renderSize || canvas.height !== renderSize) {
      canvas.width = renderSize;
      canvas.height = renderSize;
    }

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, bounds.width, bounds.width);
    context.drawImage(productImage, 0, 0, bounds.width, bounds.width);

    if (!logoImage?.complete || !logoImage.naturalWidth) {
      emptyState.hidden = false;
      downloadButton.disabled = true;
      return;
    }

    const zone = products[selectedId].zone;
    const size = Number(sizeInput.value) / 100;
    const maxWidth = bounds.width * zone.width * size;
    const maxHeight = bounds.width * zone.height * size;
    const aspectRatio = logoImage.naturalWidth / logoImage.naturalHeight;
    let logoWidth = maxWidth;
    let logoHeight = logoWidth / aspectRatio;

    if (logoHeight > maxHeight) {
      logoHeight = maxHeight;
      logoWidth = logoHeight * aspectRatio;
    }

    const xPosition = Number(document.getElementById('logo-position-x').value);
    const yPosition = Number(document.getElementById('logo-position-y').value);
    const x = bounds.width * (zone.x + zone.width / 2 + (xPosition - 50) * 0.002) - logoWidth / 2;
    const y = bounds.width * (zone.y + zone.height / 2 + (yPosition - 50) * 0.002) - logoHeight / 2;

    context.globalAlpha = Number(opacityInput.value) / 100;
    context.drawImage(logoImage, x, y, logoWidth, logoHeight);
    context.globalAlpha = 1;
    emptyState.hidden = true;
    downloadButton.disabled = false;
  }

  function showUploadError(message) {
    uploadError.textContent = message;
    uploadError.hidden = !message;
  }

  function loadLogo(file) {
    if (!file) return;
    if (!acceptedTypes.has(file.type)) {
      showUploadError(translate('viz_error_image_type'));
      return;
    }
    if (file.size > maximumFileSize) {
      showUploadError(translate('viz_error_file_size'));
      return;
    }

    showUploadError('');
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    logoUrl = URL.createObjectURL(file);
    const nextLogo = new Image();
    nextLogo.onload = () => {
      logoImage = nextLogo;
      uploadTitle.textContent = file.name;
      renderPreview();
    };
    nextLogo.onerror = () => {
      logoImage = null;
      uploadTitle.textContent = translate('viz_choose_file');
      showUploadError(translate('viz_error_file_read'));
      renderPreview();
    };
    nextLogo.src = logoUrl;
  }

  function setupUpload() {
    fileInput.addEventListener('change', () => loadLogo(fileInput.files[0]));
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadZone.addEventListener(eventName, event => {
        event.preventDefault();
        uploadZone.classList.add('is-dragging');
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      uploadZone.addEventListener(eventName, event => {
        event.preventDefault();
        uploadZone.classList.remove('is-dragging');
      });
    });
    uploadZone.addEventListener('drop', event => loadLogo(event.dataTransfer.files[0]));
  }

  function setupControls() {
    document.querySelectorAll('[data-product]').forEach(button => {
      button.addEventListener('click', () => loadProduct(button.dataset.product));
    });

    [sizeInput, opacityInput, document.getElementById('logo-position-x'), document.getElementById('logo-position-y')]
      .forEach(input => input.addEventListener('input', () => {
        sizeOutput.value = `${sizeInput.value}%`;
        opacityOutput.value = `${opacityInput.value}%`;
        renderPreview();
      }));

    downloadButton.addEventListener('click', () => {
      if (!logoImage) return;
      const link = document.createElement('a');
      link.download = `muosir-${selectedId}-preview.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.append(link);
      link.click();
      link.remove();
    });

    document.getElementById('open-quote').addEventListener('click', () => quoteDialog.showModal());
    document.getElementById('close-quote').addEventListener('click', () => quoteDialog.close());
    quoteDialog.addEventListener('click', event => {
      if (event.target === quoteDialog) quoteDialog.close();
    });

    quoteForm.addEventListener('submit', event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(quoteForm));
      const utm = window.muosirAnalytics?.getUtm() || {};
      const lead = {
        ...values,
        country: '',
        product: getProductName(products[selectedId]),
        comment: 'Запрос на нанесение логотипа.',
        utmSource: utm.source || '',
        utmCampaign: utm.campaign || '',
        utmContent: utm.content || ''
      };

      window.muosirStore?.saveLead(lead);
      window.muosirAnalytics?.trackLead(lead);

      const phone = window.muosirStore?.getData().company.phoneClean || '992922992000';
      const message = [
        'Здравствуйте! Хочу запросить предложение на нанесение логотипа.',
        `Продукция: ${lead.product}`,
        `Имя: ${lead.name}`,
        `Компания: ${lead.company}`,
        `Телефон: ${lead.phone}`,
        lead.email ? `Email: ${lead.email}` : ''
      ].filter(Boolean).join('\n');
      const link = document.createElement('a');
      link.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      quoteDialog.close();
      quoteForm.reset();
    });

    document.querySelectorAll('[data-lang-btn]').forEach(button => {
      button.addEventListener('click', () => window.muosirI18n?.setLang(button.dataset.langBtn));
    });
    window.addEventListener('muosir_lang_changed', () => {
      productName.textContent = getProductName(products[selectedId]);
      quoteProductName.textContent = productName.textContent;
    });
  }

  function initialize() {
    window.muosirI18n?.applyTranslations();
    setupUpload();
    setupControls();
    const requestedProduct = new URLSearchParams(window.location.search).get('prod');
    const catalogProduct = requestedProduct && window.muosirStore?.getProductById(requestedProduct);
    const productId = requestedProduct && Object.prototype.hasOwnProperty.call(products, requestedProduct)
      ? requestedProduct
      : catalogProduct?.categoryId === 'eggs'
        ? 'egg-tray'
        : catalogProduct?.categoryId === 'dairy'
          ? 'dairy-cup'
          : catalogProduct?.categoryId === 'containers' || catalogProduct?.categoryId === 'confectionery'
            ? 'container'
            : 'cup-500';
    loadProduct(productId);

    document.querySelectorAll('.lang-btn').forEach(button => {
      const selected = button.dataset.langBtn === (window.muosirI18n?.getLang() || 'ru');
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    window.addEventListener('resize', renderPreview, { passive: true });
    window.addEventListener('muosir_lang_changed', () => {
      document.querySelectorAll('.lang-btn').forEach(button => {
        const selected = button.dataset.langBtn === window.muosirI18n?.getLang();
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();

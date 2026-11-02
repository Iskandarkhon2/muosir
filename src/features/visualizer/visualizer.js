import { addLeadHoneypot, setLeadFeedback, submitLead } from '../forms/lead-api.js';

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
  let selectedCatalogProduct = null;
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

    const categoryById = {
      'cup-500': 'cups',
      container: 'containers',
      'dairy-cup': 'dairy',
      'egg-tray': 'eggs'
    };
    if (selectedCatalogProduct && selectedCatalogProduct.categoryId !== categoryById[id]) {
      selectedCatalogProduct = null;
    }

    selectedId = id;
    previewStage.classList.add('is-changing');
    document.querySelectorAll('[data-product]').forEach(button => {
      const selected = button.dataset.product === id;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    const name = getProductName(product);
    productName.textContent = name;
    quoteProductName.textContent = selectedCatalogProduct ? `${name} (${selectedCatalogProduct.sku})` : name;
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

    const geometry = getLogoGeometry(bounds.width);
    if (!geometry) return;

    context.globalAlpha = Number(opacityInput.value) / 100;
    context.drawImage(logoImage, geometry.x, geometry.y, geometry.width, geometry.height);
    context.globalAlpha = 1;
    emptyState.hidden = true;
    downloadButton.disabled = false;
  }

  function getLogoGeometry(width) {
    if (!logoImage?.complete || !logoImage.naturalWidth) return null;
    const zone = products[selectedId].zone;
    const size = Number(sizeInput.value) / 100;
    const zoneWidth = width * zone.width;
    const zoneHeight = width * zone.height;
    const maxWidth = zoneWidth * size;
    const maxHeight = zoneHeight * size;
    const scale = Math.min(maxWidth / logoImage.naturalWidth, maxHeight / logoImage.naturalHeight,
      zoneWidth / logoImage.naturalWidth, zoneHeight / logoImage.naturalHeight);
    const logoWidth = logoImage.naturalWidth * scale;
    const logoHeight = logoImage.naturalHeight * scale;
    const zoneX = width * zone.x;
    const zoneY = width * zone.y;
    const xPosition = Number(document.getElementById('logo-position-x').value);
    const yPosition = Number(document.getElementById('logo-position-y').value);
    return {
      x: zoneX + (zoneWidth - logoWidth) * xPosition / 100,
      y: zoneY + (zoneHeight - logoHeight) * yPosition / 100,
      width: logoWidth,
      height: logoHeight,
      zoneX,
      zoneY,
      zoneWidth,
      zoneHeight
    };
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
      document.getElementById('logo-position-x').value = '50';
      document.getElementById('logo-position-y').value = '50';
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

    ['dragenter', 'dragover'].forEach(eventName => {
      previewStage.addEventListener(eventName, event => {
        event.preventDefault();
        previewStage.classList.add('is-dragging');
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      previewStage.addEventListener(eventName, event => {
        event.preventDefault();
        previewStage.classList.remove('is-dragging');
      });
    });
    previewStage.addEventListener('drop', event => loadLogo(event.dataTransfer.files[0]));
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

    let activePointer = null;
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', event => {
      if (!logoImage) return;
      const bounds = canvas.getBoundingClientRect();
      const geometry = getLogoGeometry(bounds.width);
      if (!geometry || !bounds.width || !bounds.height) return;
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      if (x < geometry.x || x > geometry.x + geometry.width
        || y < geometry.y || y > geometry.y + geometry.height) return;
      activePointer = event.pointerId;
      canvas.setPointerCapture(activePointer);
      event.preventDefault();
    });
    canvas.addEventListener('pointermove', event => {
      if (event.pointerId !== activePointer) return;
      const bounds = canvas.getBoundingClientRect();
      const geometry = getLogoGeometry(bounds.width);
      if (!geometry || !bounds.width || !bounds.height) return;
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const maxX = Math.max(0, geometry.zoneWidth - geometry.width);
      const maxY = Math.max(0, geometry.zoneHeight - geometry.height);
      document.getElementById('logo-position-x').value = String(Math.round(maxX
        ? Math.max(0, Math.min(1, (x - geometry.zoneX - geometry.width / 2) / maxX)) * 100
        : 50));
      document.getElementById('logo-position-y').value = String(Math.round(maxY
        ? Math.max(0, Math.min(1, (y - geometry.zoneY - geometry.height / 2) / maxY)) * 100
        : 50));
      renderPreview();
    });
    const releasePointer = event => {
      if (event.pointerId === activePointer) activePointer = null;
    };
    canvas.addEventListener('pointerup', releasePointer);
    canvas.addEventListener('pointercancel', releasePointer);

    document.getElementById('reset-logo-position').addEventListener('click', () => {
      document.getElementById('logo-position-x').value = '50';
      document.getElementById('logo-position-y').value = '50';
      renderPreview();
    });

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

    addLeadHoneypot(quoteForm);
    quoteForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!quoteForm.reportValidity()) return;
      const values = Object.fromEntries(new FormData(quoteForm));
      const utm = window.muosirAnalytics?.getUtm() || {};
      const lead = {
        ...values,
        country: '',
        product: selectedCatalogProduct
          ? `${getProductName(products[selectedId])} (${selectedCatalogProduct.sku})`
          : getProductName(products[selectedId]),
        comment: 'Запрос на нанесение логотипа.',
        utmSource: utm.source || '',
        utmCampaign: utm.campaign || '',
        utmContent: utm.content || '',
        utmMedium: utm.medium || '',
        utmTerm: utm.term || '',
        sourcePage: window.location.pathname
      };

      const phone = window.muosirStore?.getData().company.whatsappClean || '992922992000';
      const message = [
        'Здравствуйте! Хочу запросить предложение на нанесение логотипа.',
        `Продукция: ${lead.product}`,
        `Имя: ${lead.name}`,
        `Компания: ${lead.company}`,
        `Телефон: ${lead.phone}`,
        lead.email ? `Email: ${lead.email}` : ''
      ].filter(Boolean).join('\n');
      const popup = window.open('about:blank', '_blank');
      if (popup) popup.opener = null;
      const submitButton = quoteForm.querySelector('[type="submit"]');
      if (submitButton) submitButton.disabled = true;
      setLeadFeedback(quoteForm, 'Отправляем заявку и сохраняем предпросмотр…');

      try {
        const preview = await new Promise((resolve, reject) => {
          canvas.toBlob(blob => {
            if (!blob) {
              reject(new Error('Не удалось создать предпросмотр.'));
              return;
            }
            resolve(new File([blob], `muosir-${selectedId}-preview.png`, { type: 'image/png' }));
          }, 'image/png');
        });
        await submitLead(lead, preview, 'customizerPreview');
        window.muosirAnalytics?.trackLead(lead);
        const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        if (popup) popup.location.href = whatsappUrl;
        quoteDialog.close();
        quoteForm.reset();
      } catch (error) {
        if (popup) popup.close();
        console.error('Visualizer inquiry submission failed:', error);
        setLeadFeedback(quoteForm, error.message || 'Не удалось отправить заявку. Попробуйте ещё раз.', true);
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
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
    const catalogProduct = requestedProduct && (
      window.muosirStore?.getProductById(requestedProduct)
      || window.muosirStore?.getProductBySku(requestedProduct)
    );
    selectedCatalogProduct = catalogProduct || null;
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

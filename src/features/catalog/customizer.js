import { addLeadHoneypot } from '../forms/lead-api.js';

(() => {
  const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/svg+xml']);
  const maximumFileSize = 5 * 1024 * 1024;
  const printZones = {
    dairy: { x: 0.27, y: 0.35, width: 0.46, height: 0.27 },
    cups: { x: 0.3, y: 0.35, width: 0.4, height: 0.3 },
    containers: { x: 0.25, y: 0.33, width: 0.5, height: 0.34 }
  };
  let dialog;
  let product;
  let productImage;
  let logoImage;
  let logoUrl;
  let productUrl;
  let logoPosition = { x: 0.5, y: 0.5 };

  function initializeDialog() {
    const template = document.createElement('template');
    template.innerHTML = `
      <dialog class="logo-customizer" aria-labelledby="customizer-title">
        <form method="dialog" class="logo-customizer__header">
          <div>
            <p class="logo-customizer__eyebrow">Предварительная визуализация</p>
            <h2 id="customizer-title">Логотип на упаковке</h2>
            <p class="logo-customizer__product"></p>
          </div>
          <button type="submit" class="logo-customizer__close" aria-label="Закрыть окно">×</button>
        </form>
        <div class="logo-customizer__content">
          <div class="logo-customizer__preview">
            <canvas width="720" height="560" aria-label="Предварительный вид продукции с логотипом"></canvas>
          </div>
          <form class="logo-customizer__controls" data-customizer-form>
            <label class="logo-customizer__upload">
              <span>Загрузите логотип</span>
              <input type="file" accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml">
              <small>PNG, JPG или SVG, до 5 МБ. Файл остаётся на вашем устройстве.</small>
            </label>
            <p class="logo-customizer__status" role="status" aria-live="polite"></p>
            <label class="logo-customizer__range">
              <span>Размер логотипа <output data-scale-value>72%</output></span>
              <input type="range" min="50" max="150" value="100" data-logo-scale>
            </label>
            <label class="logo-customizer__range">
              <span>Положение по вертикали <output data-position-value>50%</output></span>
              <input type="range" min="0" max="100" value="50" data-logo-position>
            </label>
            <label class="logo-customizer__select">
              <span>Способ брендирования</span>
              <select data-print-method>
                <option value="IML (вплавляемая этикетка)">IML (вплавляемая этикетка)</option>
                <option value="Офсетная печать">Офсетная печать</option>
              </select>
            </label>
            <label class="logo-customizer__select">
              <span>Планируемый объём</span>
              <input type="text" inputmode="numeric" placeholder="Например, 100 000 шт." data-order-volume>
            </label>
            <label class="logo-customizer__select">
              <span>Ваше имя *</span>
              <input type="text" name="name" autocomplete="name" maxlength="120" required>
            </label>
            <label class="logo-customizer__select">
              <span>Компания *</span>
              <input type="text" name="company" autocomplete="organization" maxlength="160" required>
            </label>
            <label class="logo-customizer__select">
              <span>Телефон / WhatsApp *</span>
              <input type="tel" name="phone" autocomplete="tel" maxlength="60" required>
            </label>
            <label class="logo-customizer__select">
              <span>E-mail</span>
              <input type="email" name="email" autocomplete="email" maxlength="254">
            </label>
            <p class="logo-customizer__notice">Это ориентировочная визуализация. Зона нанесения, технология и макет подтверждаются специалистом до производства. PNG-превью отправляется вместе с заявкой.</p>
            <div class="logo-customizer__actions">
              <button type="button" class="button-secondary" data-reset-logo>Сбросить положение</button>
              <button type="button" class="button-secondary" data-download-preview disabled>Скачать превью</button>
              <button type="submit" class="button-primary" data-request-design>Запросить расчёт с этим логотипом</button>
            </div>
          </form>
        </div>
      </dialog>
    `;
    dialog = template.content.firstElementChild;
    document.body.append(dialog);
    dialog.addEventListener('close', releaseObjectUrls);
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
  }

  function setStatus(message, isError = false) {
    const status = dialog.querySelector('.logo-customizer__status');
    status.textContent = message;
    status.toggleAttribute('data-error', isError);
  }

  function getZone() {
    return printZones[product.categoryId] || printZones.containers;
  }

  function getPreviewGeometry() {
    const canvas = dialog.querySelector('canvas');
    if (!productImage?.complete || !productImage.naturalWidth) return null;

    const width = canvas.width;
    const height = canvas.height;
    const scale = Math.min((width - 56) / productImage.naturalWidth, (height - 56) / productImage.naturalHeight);
    const imageWidth = productImage.naturalWidth * scale;
    const imageHeight = productImage.naturalHeight * scale;
    const imageX = (width - imageWidth) / 2;
    const imageY = (height - imageHeight) / 2;
    const zone = getZone();
    const zoneX = imageX + imageWidth * zone.x;
    const zoneY = imageY + imageHeight * zone.y;
    const zoneWidth = imageWidth * zone.width;
    const zoneHeight = imageHeight * zone.height;
    if (!logoImage?.complete || !logoImage.naturalWidth) {
      return { canvas, width, height, imageX, imageY, imageWidth, imageHeight, zoneX, zoneY, zoneWidth, zoneHeight };
    }

    const logoScale = Number(dialog.querySelector('[data-logo-scale]').value) / 100;
    const ratio = Math.min(
      (zoneWidth * logoScale) / logoImage.naturalWidth,
      zoneWidth / logoImage.naturalWidth,
      zoneHeight / logoImage.naturalHeight
    );
    const logoWidth = logoImage.naturalWidth * ratio;
    const logoHeight = logoImage.naturalHeight * ratio;
    const logoX = zoneX + (zoneWidth - logoWidth) * logoPosition.x;
    const logoY = zoneY + (zoneHeight - logoHeight) * logoPosition.y;
    return {
      canvas,
      width,
      height,
      imageX,
      imageY,
      imageWidth,
      imageHeight,
      zoneX,
      zoneY,
      zoneWidth,
      zoneHeight,
      logoX,
      logoY,
      logoWidth,
      logoHeight
    };
  }

  function renderPreview(includeGuides = true) {
    const geometry = getPreviewGeometry();
    if (!geometry) return;
    const { canvas, width, height } = geometry;
    const context = canvas.getContext('2d');

    context.clearRect(0, 0, width, height);
    context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface-2').trim();
    context.fillRect(0, 0, width, height);
    context.drawImage(productImage, geometry.imageX, geometry.imageY, geometry.imageWidth, geometry.imageHeight);

    if (!logoImage?.complete || !logoImage.naturalWidth) return;

    context.drawImage(logoImage, geometry.logoX, geometry.logoY, geometry.logoWidth, geometry.logoHeight);
    if (!includeGuides) return;
    context.save();
    context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    context.lineWidth = 2;
    context.setLineDash([8, 6]);
    context.strokeRect(geometry.zoneX, geometry.zoneY, geometry.zoneWidth, geometry.zoneHeight);
    context.restore();
  }

  function setupCanvasInteraction() {
    const canvas = dialog.querySelector('canvas');
    let activePointer = null;
    canvas.style.touchAction = 'none';

    canvas.addEventListener('pointerdown', event => {
      if (!logoImage) return;
      const bounds = canvas.getBoundingClientRect();
      const geometry = getPreviewGeometry();
      if (!geometry || !geometry.logoWidth || !bounds.width || !bounds.height) return;
      const x = (event.clientX - bounds.left) * canvas.width / bounds.width;
      const y = (event.clientY - bounds.top) * canvas.height / bounds.height;
      if (x < geometry.logoX || x > geometry.logoX + geometry.logoWidth
        || y < geometry.logoY || y > geometry.logoY + geometry.logoHeight) return;
      activePointer = event.pointerId;
      canvas.setPointerCapture(activePointer);
      event.preventDefault();
    });

    canvas.addEventListener('pointermove', event => {
      if (event.pointerId !== activePointer) return;
      const bounds = canvas.getBoundingClientRect();
      const geometry = getPreviewGeometry();
      if (!geometry || !bounds.width || !bounds.height) return;
      const x = (event.clientX - bounds.left) * canvas.width / bounds.width;
      const y = (event.clientY - bounds.top) * canvas.height / bounds.height;
      const maxX = Math.max(0, geometry.zoneWidth - geometry.logoWidth);
      const maxY = Math.max(0, geometry.zoneHeight - geometry.logoHeight);
      logoPosition = {
        x: maxX ? Math.max(0, Math.min(1, (x - geometry.zoneX - geometry.logoWidth / 2) / maxX)) : 0.5,
        y: maxY ? Math.max(0, Math.min(1, (y - geometry.zoneY - geometry.logoHeight / 2) / maxY)) : 0.5
      };
      const positionInput = dialog.querySelector('[data-logo-position]');
      positionInput.value = String(Math.round(logoPosition.y * 100));
      dialog.querySelector('[data-position-value]').value = `${positionInput.value}%`;
      renderPreview();
    });

    function releasePointer(event) {
      if (event.pointerId !== activePointer) return;
      activePointer = null;
    }
    canvas.addEventListener('pointerup', releasePointer);
    canvas.addEventListener('pointercancel', releasePointer);
  }

  function loadProductImage() {
    const image = new Image();
    image.onload = () => {
      productImage = image;
      renderPreview();
      setStatus('');
    };
    image.onerror = () => setStatus('Не удалось загрузить изображение изделия. Попробуйте позже.', true);
    image.src = product.photo || product.image;
  }

  async function validateSvg(file) {
    if (file.type !== 'image/svg+xml') return file;
    const source = await file.text();
    const documentSvg = new DOMParser().parseFromString(source, 'image/svg+xml');
    const root = documentSvg.documentElement;
    if (root.localName !== 'svg' || documentSvg.querySelector('parsererror')) {
      throw new TypeError('Файл SVG повреждён или имеет неверный формат.');
    }

    const unsafeElement = documentSvg.querySelector('script, foreignObject, iframe, object, embed');
    const unsafeAttribute = [...documentSvg.querySelectorAll('*')].some(element =>
      [...element.attributes].some(attribute =>
        /^on/i.test(attribute.name)
        || ((attribute.name === 'href' || attribute.name.endsWith(':href'))
          && !attribute.value.startsWith('#')
          && !attribute.value.startsWith('data:image/'))
      )
    );
    if (unsafeElement || unsafeAttribute) {
      throw new TypeError('SVG содержит неподдерживаемые активные элементы или внешние ссылки.');
    }
    return new Blob([source], { type: 'image/svg+xml' });
  }

  async function loadLogo(file) {
    if (!file) return;
    if (!allowedTypes.has(file.type)) {
      setStatus('Поддерживаются только файлы PNG, JPG и SVG.', true);
      return;
    }
    if (file.size > maximumFileSize) {
      setStatus('Размер файла должен быть не более 5 МБ.', true);
      return;
    }

    try {
      const source = await validateSvg(file);
      if (logoUrl) URL.revokeObjectURL(logoUrl);
      logoUrl = URL.createObjectURL(source);
      const image = new Image();
      image.onload = () => {
        logoImage = image;
        logoPosition = { x: 0.5, y: 0.5 };
        dialog.querySelector('[data-logo-position]').value = '50';
        dialog.querySelector('[data-position-value]').value = '50%';
        dialog.querySelector('[data-download-preview]').disabled = false;
        setStatus(`Логотип загружен: ${file.name}`);
        renderPreview();
      };
      image.onerror = () => {
        logoImage = null;
        URL.revokeObjectURL(logoUrl);
        logoUrl = null;
        setStatus('Не удалось прочитать изображение. Проверьте файл и попробуйте снова.', true);
      };
      image.src = logoUrl;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Не удалось обработать файл логотипа.', true);
    }
  }

  function releaseObjectUrls() {
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    if (productUrl) URL.revokeObjectURL(productUrl);
    logoUrl = null;
    productUrl = null;
    logoImage = null;
    productImage = null;
    logoPosition = { x: 0.5, y: 0.5 };
    dialog.querySelector('input[type="file"]').value = '';
  }

  function downloadPreview() {
    renderPreview(false);
    const link = document.createElement('a');
    link.download = `muosir-${product.id}-preview.png`;
    link.href = dialog.querySelector('canvas').toDataURL('image/png');
    link.click();
    renderPreview();
  }

  async function requestDesign(event) {
    event.preventDefault();
    if (!logoImage) {
      setStatus('Сначала загрузите логотип для предварительного макета.', true);
      return;
    }

    const form = dialog.querySelector('[data-customizer-form]');
    if (!form.reportValidity()) return;

    const fields = Object.fromEntries(new FormData(form));
    const volume = dialog.querySelector('[data-order-volume]').value.trim() || 'по запросу';
    const method = dialog.querySelector('[data-print-method]').value;
    const message = `Здравствуйте, завод Muosir Plast. Интересует оптовая партия продукции: ${product.title} (${product.sku}), объём: ${volume}. Брендирование: ${method}. Предварительный макет приложен к заявке.`;
    const canvas = dialog.querySelector('canvas');
    const submitButton = dialog.querySelector('[data-request-design]');
    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    submitButton.disabled = true;
    setStatus('Отправляем заявку и сохраняем PNG-превью…');

    try {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(result => {
          if (!result) {
            reject(new Error('Не удалось сформировать PNG-превью.'));
            return;
          }
          resolve(result);
        }, 'image/png');
      });
      if (!blob) throw new Error('Не удалось сформировать PNG-превью.');
      const file = new File([blob], `muosir-${product.id}-preview.png`, { type: 'image/png' });
      const utm = window.muosirAnalytics?.getUtm() || {};
      const lead = {
        name: fields.name,
        company: fields.company,
        phone: fields.phone,
        email: fields.email || '',
        product: `${product.title} (${product.sku})`,
        volume,
        comment: `Запрос расчёта с логотипом. Способ брендирования: ${method}.`,
        sourcePage: window.location.pathname,
        utmSource: utm.source || '',
        utmCampaign: utm.campaign || '',
        utmContent: utm.content || '',
        utmMedium: utm.medium || '',
        utmTerm: utm.term || ''
      };
      await submitLead(lead, file, 'customizerPreview');
      window.muosirAnalytics?.trackLead(lead);

      const phone = window.muosirStore.getData().company.whatsappClean || '992922992000';
      if (popup) popup.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      setStatus('Заявка отправлена. PNG-превью сохранено и приложено к ней.');
    } catch (error) {
      if (popup) popup.close();
      console.error('Customizer inquiry submission failed:', error);
      setStatus(error instanceof Error ? error.message : 'Не удалось отправить заявку.', true);
    } finally {
      submitButton.disabled = false;
    }
  }

  function openCustomizer(productId) {
    product = window.muosirStore?.getProductById(productId)
      || window.muosirStore?.getProductBySku(productId);
    if (!product) {
      setStatus('Не удалось найти выбранную позицию каталога.', true);
      return;
    }
    dialog.querySelector('.logo-customizer__product').textContent = product.title;
    dialog.querySelector('[data-download-preview]').disabled = true;
    dialog.querySelector('[data-logo-scale]').value = '72';
    dialog.querySelector('[data-logo-position]').value = '50';
    dialog.querySelector('[data-logo-scale]').value = '100';
    dialog.querySelector('[data-scale-value]').value = '100%';
    dialog.querySelector('[data-position-value]').value = '50%';
    dialog.querySelector('[data-order-volume]').value = '';
    dialog.querySelector('[data-customizer-form]').reset();
    dialog.querySelector('[data-logo-position]').value = '50';
    logoPosition = { x: 0.5, y: 0.5 };
    setStatus('Логотип будет отображаться только в предварительном макете.');
    dialog.showModal();
    loadProductImage();
  }

  function initialize() {
    initializeDialog();
    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-customize-product]');
      if (trigger) openCustomizer(trigger.dataset.customizeProduct);
    });
    window.addEventListener('muosir:open-customizer', event => {
      if (event.detail?.productId) openCustomizer(event.detail.productId);
    });
    dialog.querySelector('input[type="file"]').addEventListener('change', event => loadLogo(event.target.files[0]));
    const previewArea = dialog.querySelector('.logo-customizer__preview');
    ['dragenter', 'dragover'].forEach(eventName => {
      previewArea.addEventListener(eventName, event => {
        event.preventDefault();
        previewArea.dataset.dragging = 'true';
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      previewArea.addEventListener(eventName, event => {
        event.preventDefault();
        delete previewArea.dataset.dragging;
      });
    });
    previewArea.addEventListener('drop', event => {
      const file = event.dataTransfer?.files?.[0];
      if (file) loadLogo(file);
    });
    dialog.querySelectorAll('[data-logo-scale], [data-logo-position]').forEach(input => {
      input.addEventListener('input', () => {
        dialog.querySelector('[data-scale-value]').value = `${dialog.querySelector('[data-logo-scale]').value}%`;
        dialog.querySelector('[data-position-value]').value = `${dialog.querySelector('[data-logo-position]').value}%`;
        logoPosition.y = Number(dialog.querySelector('[data-logo-position]').value) / 100;
        renderPreview();
      });
    });
    dialog.querySelector('[data-reset-logo]').addEventListener('click', () => {
      logoPosition = { x: 0.5, y: 0.5 };
      dialog.querySelector('[data-logo-position]').value = '50';
      dialog.querySelector('[data-position-value]').value = '50%';
      renderPreview();
    });
    dialog.querySelector('[data-download-preview]').addEventListener('click', downloadPreview);
    const form = dialog.querySelector('[data-customizer-form]');
    addLeadHoneypot(form);
    form.addEventListener('submit', requestDesign);
    setupCanvasInteraction();

    const requestedProduct = new URLSearchParams(window.location.search).get('customize');
    if (requestedProduct) openCustomizer(requestedProduct);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();

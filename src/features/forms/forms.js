import { addLeadHoneypot, setLeadFeedback, submitLead } from './lead-api.js';

(() => {
  const maximumAttachmentSize = 15 * 1024 * 1024;
  const acceptedExtensions = new Set(['pdf', 'xls', 'xlsx', 'doc', 'docx']);

  function getUtmValues() {
    const analytics = window.muosirAnalytics;
    return analytics?.getUtm?.() || {};
  }

  function openWhatsApp(message, form, lead, popup) {
    const company = window.muosirStore?.getData().company;
    const phone = company?.whatsappClean || '992922992000';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    if (popup) popup.location.href = url;
    const hasFile = message.includes('Файл спецификации:');
    setLeadFeedback(
      form,
      hasFile
        ? 'Заявка зарегистрирована на сервере. Прикрепите файл спецификации в открывшемся диалоге WhatsApp.'
        : 'Заявка зарегистрирована на сервере. Проверьте подготовленный запрос в WhatsApp и нажмите «Отправить».',
      false,
      url
    );
    window.muosirAnalytics?.trackLead?.(lead);
    window.muosirAnalytics?.trackWhatsAppClick?.('B2B inquiry form');
  }

  function readForm(form) {
    const values = Object.fromEntries([...new FormData(form).entries()].map(([key, value]) => [
      key,
      value instanceof File ? '' : value
    ]));
    const labels = {
      name: 'Имя',
      company: 'Компания',
      industry: 'Отрасль',
      country: 'Страна назначения',
      phone: 'Телефон / WhatsApp',
      email: 'E-mail',
      product: 'Интересующая продукция',
      volume: 'Объём партии',
      comment: 'Комментарий',
      address: 'Страна и город',
      samples: 'Запрос по продукции'
    };
    const industrySelect = form.elements.namedItem('industry');
    if (industrySelect instanceof HTMLSelectElement) {
      values.industry = industrySelect.selectedOptions[0]?.textContent?.trim() || '';
    }
    const message = [
      'Здравствуйте, завод Muosir Plast.',
      ...Object.entries(labels)
        .filter(([key]) => String(values[key] || '').trim())
        .map(([key, label]) => `${label}: ${String(values[key]).trim()}`)
    ].join('\n');

    return { values, message };
  }

  function setupInquiryForm(form) {
    addLeadHoneypot(form);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const { values } = readForm(form);
      const attachment = form.querySelector('input[type="file"]')?.files?.[0];
      if (attachment && !validateFile(attachment, form)) return;
      const { message } = readForm(form);
      const messageWithFile = attachment
        ? `${message}\nФайл спецификации: ${attachment.name} (заявка зарегистрирована; файл можно отправить менеджеру в этом диалоге)`
        : message;
      const popup = window.open('about:blank', '_blank');
      if (popup) popup.opener = null;
      const submitButton = form.querySelector('[type="submit"]');
      if (submitButton) submitButton.disabled = true;
      setLeadFeedback(form, 'Отправляем заявку…');
      const utm = getUtmValues();
      const lead = {
        ...values,
        product: values.product || values.category || values.samples || '',
        comment: values.comment || values.message || '',
        utmSource: utm.source || '',
        utmMedium: utm.medium || '',
        utmCampaign: utm.campaign || '',
        utmContent: utm.content || '',
        utmTerm: utm.term || '',
        sourcePage: window.location.pathname
      };
      try {
        await submitLead(lead, attachment);
        openWhatsApp(messageWithFile, form, lead, popup);
      } catch (error) {
        if (popup) popup.close();
        console.error('Lead submission failed:', error);
        setLeadFeedback(form, error.message || 'Не удалось отправить заявку. Попробуйте ещё раз.', true);
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  function validateFile(file, form) {
    const input = form.querySelector('input[type="file"]');
    const fileName = form.querySelector('[data-file-name]');
    const fileError = form.querySelector('[data-file-error]');
    if (!file) return true;
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!acceptedExtensions.has(extension)) {
      if (fileError) fileError.textContent = 'Выберите PDF, Excel или Word (.pdf, .xls, .xlsx, .doc, .docx).';
      if (input) input.value = '';
      if (fileName) fileName.textContent = 'Файл не выбран';
      return false;
    }
    if (file.size > maximumAttachmentSize) {
      if (fileError) fileError.textContent = 'Размер файла не должен превышать 15 МБ.';
      if (input) input.value = '';
      if (fileName) fileName.textContent = 'Файл не выбран';
      return false;
    }
    if (fileError) fileError.textContent = '';
    if (fileName) fileName.textContent = file.name;
    return true;
  }

  function setupAttachmentInput(form) {
    const input = form.querySelector('input[type="file"]');
    const dropZone = form.querySelector('[data-file-drop]');
    const fileName = form.querySelector('[data-file-name]');
    const fileError = form.querySelector('[data-file-error]');
    if (!input || !dropZone) return;

    input.addEventListener('change', () => validateFile(input.files[0], form));
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, event => {
        event.preventDefault();
        dropZone.dataset.dragging = 'true';
      });
    });
    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, event => {
        event.preventDefault();
        delete dropZone.dataset.dragging;
      });
    });
    dropZone.addEventListener('drop', event => {
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      validateFile(file, form);
    });
  }

  function setupCatalogQuoteForm() {
    const form = document.getElementById('catalog-quote-form');
    if (form) setupInquiryForm(form);
  }

  function setupExportForm() {
    const form = document.getElementById('export-lead-form');
    if (!form) return;
    setupInquiryForm(form);
    setupAttachmentInput(form);
  }

  function setupAdditionalInquiryForms() {
    ['solution-form', 'samples-form', 'direct-contact-form'].forEach(id => {
      const form = document.getElementById(id);
      if (form) setupInquiryForm(form);
    });
  }

  function initialize() {
    setupCatalogQuoteForm();
    setupExportForm();
    setupAdditionalInquiryForms();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();

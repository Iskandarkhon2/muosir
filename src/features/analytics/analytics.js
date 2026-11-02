/**
 * analytics.js - Meta Pixel, Google Analytics 4 & UTM Tracking Engine
 * Sections 18 & 19 of the Technical Specification (ТЗ).
 * Accurately tracks B2B conversion funnels, captures ad campaign parameters,
 * and passes them into lead records and analytics providers.
 */

class AnalyticsTracker {
  constructor() {
    this.utmParams = this.extractUtm();
    this.saveUtm();
    this.initPixels();
  }

  // Extract UTM, gclid, fbclid, and Referrer parameters from URL query string
  extractUtm() {
    const params = new URLSearchParams(window.location.search);
    const utm = {
      source: params.get('utm_source') || (document.referrer.includes('instagram.com') ? 'instagram' : document.referrer.includes('facebook.com') ? 'facebook' : 'direct'),
      medium: params.get('utm_medium') || '',
      campaign: params.get('utm_campaign') || '',
      content: params.get('utm_content') || '',
      term: params.get('utm_term') || '',
      fbclid: params.get('fbclid') || '',
      gclid: params.get('gclid') || '',
      referrer: document.referrer || 'direct',
      landingPage: window.location.href,
      clientTime: new Date().toISOString()
    };
    return utm;
  }

  // Persist UTM parameters across user session
  saveUtm() {
    try {
      const stored = sessionStorage.getItem('muosir_utm_v2');
      if (!stored || (this.utmParams.source !== 'direct' && !stored.includes(this.utmParams.source))) {
        sessionStorage.setItem('muosir_utm_v2', JSON.stringify(this.utmParams));
      }
    } catch (e) {
      console.warn("Storage error for UTM:", e);
    }
  }

  getUtm() {
    try {
      const stored = sessionStorage.getItem('muosir_utm_v2');
      return stored ? JSON.parse(stored) : this.utmParams;
    } catch (e) {
      return this.utmParams;
    }
  }

  initPixels() {
    window._fbqEvents = window._fbqEvents || [];
    window._gaEvents = window._gaEvents || [];

    // Dynamically inject Meta Pixel & GA4 if IDs are stored in company settings
    setTimeout(() => {
      if (window.muosirStore) {
        const comp = window.muosirStore.getData().company;
        if (comp.metaPixelId && !window._metaPixelInjected) {
          this.injectMetaPixelScript(comp.metaPixelId);
        }
        if (comp.ga4MeasurementId && !window._ga4Injected) {
          this.injectGA4Script(comp.ga4MeasurementId);
        }
      }
    }, 500);
  }

  injectMetaPixelScript(pixelId) {
    window._metaPixelInjected = true;
    /* Meta Pixel base */
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    
    if (typeof window.fbq === 'function') {
      window.fbq('init', pixelId);
      window.fbq('track', 'PageView');
    }
  }

  injectGA4Script(measurementId) {
    window._ga4Injected = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', measurementId);
  }

  // Dispatch Meta Pixel Event
  trackMeta(eventName, data = {}) {
    console.log(`[Meta Pixel Event] ${eventName}:`, data);
    if (typeof window.fbq === 'function') {
      window.fbq('track', eventName, data);
    } else {
      window._fbqEvents.push({ eventName, data, time: Date.now() });
    }
  }

  // Dispatch GA4 Event
  trackGA4(eventName, params = {}) {
    console.log(`[GA4 Event] ${eventName}:`, params);
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    } else {
      window._gaEvents.push({ eventName, params, time: Date.now() });
    }
  }

  // ========================================================
  // The 8 Core Events required by Section 18 of ТЗ:
  // ========================================================

  // 1. Просмотр Landing Page
  trackPageView() {
    this.trackMeta('PageView');
    this.trackGA4('page_view', { page_title: document.title, page_location: window.location.href });
  }

  // 2. Просмотр продукции (ViewContent)
  trackViewProduct(product) {
    const payload = {
      content_name: product.title,
      content_category: product.categoryId,
      content_ids: [product.id],
      content_type: 'product',
      value: 100.0,
      currency: 'USD'
    };
    this.trackMeta('ViewContent', payload);
    this.trackGA4('view_item', {
      item_id: product.id,
      item_name: product.title,
      item_category: product.categoryId
    });
  }

  // 3. Нажатие «Получить предложение» (InitiateCheckout / InitiateQuote)
  trackInitiateQuote(context = 'Header CTA') {
    this.trackMeta('InitiateCheckout', { context: context });
    this.trackGA4('begin_checkout', { trigger: context });
  }

  // 4. Начало заполнения формы
  trackFormStart(formName = 'Quote Form') {
    this.trackMeta('Contact', { step: 'form_start', form: formName });
    this.trackGA4('form_start', { form_name: formName });
  }

  // 5. Отправка формы (Lead)
  trackLead(leadData) {
    const payload = {
      value: 1.0,
      currency: 'USD',
      lead_type: 'B2B Export Inquiry',
      country: leadData.country || 'Unknown',
      company: leadData.company || 'Unknown',
      product: leadData.product || 'General',
      utm_source: leadData.utmSource,
      utm_campaign: leadData.utmCampaign,
      utm_content: leadData.utmContent
    };
    this.trackMeta('Lead', payload);
    this.trackGA4('generate_lead', {
      country: leadData.country,
      company: leadData.company,
      product: leadData.product,
      utm_source: leadData.utmSource,
      utm_campaign: leadData.utmCampaign
    });
  }

  // 6. Нажатие WhatsApp (Contact)
  trackWhatsAppClick(context = 'General', productName = '') {
    const payload = {
      channel: 'WhatsApp',
      context: context,
      product: productName
    };
    this.trackMeta('Contact', payload);
    this.trackGA4('contact_whatsapp', payload);
  }

  // 7. Нажатие телефона (Contact)
  trackPhoneClick(context = 'Header Phone') {
    this.trackMeta('Contact', { channel: 'Phone', context: context });
    this.trackGA4('contact_phone', { context: context });
  }

  // 8. Скачивание каталога
  trackDownloadCatalog(docTitle = 'Export Catalog') {
    this.trackMeta('Download_Catalog', { document: docTitle });
    this.trackGA4('file_download', { file_name: docTitle });
  }
}

window.muosirAnalytics = new AnalyticsTracker();

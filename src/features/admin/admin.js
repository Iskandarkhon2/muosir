/**
 * admin.js - Management Controller for Muosir Plast Admin Panel
 * Allows editing catalog, texts, contacts, stats, certificates, marketing integrations,
 * and managing qualified B2B leads according to Sections 18, 19, 23 & 26 of the ТЗ.
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.muosirStore;
  const ADMIN_PASS = 'muosir2026';

  const authScreen = document.getElementById('admin-auth-screen');
  const dashboard = document.getElementById('admin-dashboard');
  const passInput = document.getElementById('admin-pass-input');
  const loginBtn = document.getElementById('admin-login-btn');
  const logoutBtn = document.getElementById('admin-logout-btn');

  // Check existing session
  if (sessionStorage.getItem('muosir_admin_auth') === 'true') {
    showDashboard();
  }

  // Login handler
  loginBtn.addEventListener('click', () => {
    const entered = passInput.value.trim();
    const storedPass = localStorage.getItem('muosir_admin_password') || ADMIN_PASS;
    if (entered === storedPass) {
      sessionStorage.setItem('muosir_admin_auth', 'true');
      showDashboard();
    } else {
      alert('Неверный пароль администратора!');
      passInput.focus();
    }
  });

  passInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('muosir_admin_auth');
    authScreen.classList.remove('hidden');
    dashboard.classList.add('hidden');
  });

  function showDashboard() {
    authScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    renderAllAdminSections();
  }

  // --- Tab Navigation ---
  const tabButtons = document.querySelectorAll('[data-admin-tab]');
  const tabPanes = document.querySelectorAll('.admin-tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-admin-tab');

      tabButtons.forEach(b => {
        b.classList.remove('bg-blue-600', 'text-white');
        b.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-slate-900');
      });
      btn.classList.add('bg-blue-600', 'text-white');
      btn.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-slate-900');

      tabPanes.forEach(p => p.classList.add('hidden'));
      const activePane = document.getElementById(`tab-pane-${target}`);
      if (activePane) activePane.classList.remove('hidden');
    });
  });

  // --- Render All Sections ---
  function renderAllAdminSections() {
    renderProductsTable();
    renderContentForm();
    renderContactsForm();
    renderStatsEditor();
    renderDocumentsEditor();
    renderMarketingForm();
    renderLeadsTable();
  }

  // ==========================================
  // TAB 1: PRODUCTS CATALOG (Section 23 of ТЗ)
  // ==========================================
  function renderProductsTable() {
    const data = store.getData();
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;

    tbody.innerHTML = data.products.map(p => `
      <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
        <td class="p-3">
          <img src="${p.image}" alt="${p.title}" class="w-12 h-10 object-contain rounded bg-slate-900 border border-slate-800 p-1" />
        </td>
        <td class="p-3 font-semibold text-white">
          ${p.title}
          <div class="text-xs text-slate-400">${p.titleEn || ''}</div>
        </td>
        <td class="p-3 text-xs text-cyan-400 font-mono">${p.categoryId}</td>
        <td class="p-3 text-xs text-slate-300">${p.material}</td>
        <td class="p-3 text-xs text-slate-300">${p.volume}</td>
        <td class="p-3 text-xs text-slate-400">${p.minOrder}</td>
        <td class="p-3 text-right space-x-2 whitespace-nowrap">
          <button 
            type="button" 
            onclick="window.adminController.editProduct('${p.id}')"
            class="px-2.5 py-1 text-xs rounded bg-blue-600/30 text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
          >
            Редактировать
          </button>
          <button 
            type="button" 
            onclick="window.adminController.deleteProduct('${p.id}')"
            class="px-2.5 py-1 text-xs rounded bg-red-600/30 text-red-400 hover:bg-red-600 hover:text-white transition-all"
          >
            Удалить
          </button>
        </td>
      </tr>
    `).join('');
  }

  // Product Add / Edit Modal Controller
  const productModal = document.getElementById('product-edit-modal');
  const productForm = document.getElementById('product-edit-form');

  window.adminController = {
    openAddProduct: () => {
      productForm.reset();
      document.getElementById('prod-form-id').value = '';
      document.getElementById('prod-modal-title').textContent = 'Добавить товар в каталог';
      productModal.classList.remove('hidden');
      productModal.classList.add('flex');
    },

    editProduct: (id) => {
      const p = store.getProductById(id);
      if (!p) return;

      document.getElementById('prod-form-id').value = p.id;
      document.getElementById('prod-form-title').value = p.title || '';
      document.getElementById('prod-form-title-en').value = p.titleEn || '';
      document.getElementById('prod-form-category').value = p.categoryId || 'dairy';
      document.getElementById('prod-form-volume').value = p.volume || '';
      document.getElementById('prod-form-diameter').value = p.diameter || '';
      document.getElementById('prod-form-material').value = p.material || '';
      document.getElementById('prod-form-box-qty').value = p.boxQty || '';
      document.getElementById('prod-form-min-order').value = p.minOrder || '';
      document.getElementById('prod-form-image').value = p.image || '';
      document.getElementById('prod-form-desc').value = p.desc || '';
      document.getElementById('prod-form-desc-en').value = p.descEn || '';

      document.getElementById('prod-modal-title').textContent = 'Редактировать товар';
      productModal.classList.remove('hidden');
      productModal.classList.add('flex');
    },

    deleteProduct: (id) => {
      if (confirm('Вы уверены, что хотите удалить этот товар из экспортного каталога?')) {
        store.deleteProduct(id);
        renderProductsTable();
      }
    },

    deleteLead: (id) => {
      if (confirm('Удалить эту заявку из журнала?')) {
        store.deleteLead(id);
        renderLeadsTable();
      }
    }
  };

  // Save product from modal
  productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-form-id').value;
    const payload = {
      title: document.getElementById('prod-form-title').value,
      titleEn: document.getElementById('prod-form-title-en').value,
      categoryId: document.getElementById('prod-form-category').value,
      volume: document.getElementById('prod-form-volume').value,
      diameter: document.getElementById('prod-form-diameter').value,
      material: document.getElementById('prod-form-material').value,
      boxQty: document.getElementById('prod-form-box-qty').value,
      minOrder: document.getElementById('prod-form-min-order').value,
      image: document.getElementById('prod-form-image').value || 'assets/images/product-dairy-cup.svg',
      desc: document.getElementById('prod-form-desc').value,
      descEn: document.getElementById('prod-form-desc-en').value
    };

    if (id) {
      store.updateProduct(id, payload);
    } else {
      store.addProduct(payload);
    }

    productModal.classList.add('hidden');
    productModal.classList.remove('flex');
    renderProductsTable();
  });

  document.getElementById('close-prod-modal-btn').addEventListener('click', () => {
    productModal.classList.add('hidden');
    productModal.classList.remove('flex');
  });

  // ==========================================
  // TAB 2: CONTENT & STATS
  // ==========================================
  function renderContentForm() {
    const data = store.getData();
    document.getElementById('content-tagline').value = data.company.tagline || '';
    document.getElementById('content-subtagline').value = data.company.subtagline || '';
  }

  document.getElementById('save-content-btn').addEventListener('click', () => {
    const data = store.getData();
    data.company.tagline = document.getElementById('content-tagline').value;
    data.company.subtagline = document.getElementById('content-subtagline').value;
    store.saveData(data);
    alert('Тексты оффера успешно сохранены!');
  });

  function renderStatsEditor() {
    const data = store.getData();
    const container = document.getElementById('admin-stats-editor');
    if (!container) return;

    container.innerHTML = data.stats.map((s, idx) => `
      <div class="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
        <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Метрика #${idx + 1}
        </label>
        <div class="grid grid-cols-2 gap-2">
          <input 
            type="text" 
            id="stat-num-${idx}" 
            value="${s.number}" 
            class="b2b-input px-3 py-1.5 rounded-lg text-sm text-cyan-300 font-bold" 
            placeholder="Значение (напр. 12+)"
          />
          <input 
            type="text" 
            id="stat-lbl-${idx}" 
            value="${s.label}" 
            class="b2b-input px-3 py-1.5 rounded-lg text-xs" 
            placeholder="Подпись"
          />
        </div>
      </div>
    `).join('');
  }

  document.getElementById('save-stats-btn').addEventListener('click', () => {
    const data = store.getData();
    data.stats.forEach((s, idx) => {
      const numInput = document.getElementById(`stat-num-${idx}`);
      const lblInput = document.getElementById(`stat-lbl-${idx}`);
      if (numInput && lblInput) {
        s.number = numInput.value;
        s.label = lblInput.value;
      }
    });
    store.saveData(data);
    alert('Статистика завода успешно обновлена!');
  });

  // ==========================================
  // TAB 3: CONTACTS & WHATSAPP
  // ==========================================
  function renderContactsForm() {
    const data = store.getData();
    document.getElementById('contact-phone').value = data.company.phone || '';
    document.getElementById('contact-phone-clean').value = data.company.phoneClean || '';
    document.getElementById('contact-email').value = data.company.email || '';
    document.getElementById('contact-address').value = data.company.address || '';
    document.getElementById('contact-address-en').value = data.company.addressEn || '';
  }

  document.getElementById('save-contacts-btn').addEventListener('click', () => {
    const data = store.getData();
    data.company.phone = document.getElementById('contact-phone').value;
    data.company.phoneClean = document.getElementById('contact-phone-clean').value.replace(/[^0-9]/g, '');
    data.company.email = document.getElementById('contact-email').value;
    data.company.address = document.getElementById('contact-address').value;
    data.company.addressEn = document.getElementById('contact-address-en').value;
    store.saveData(data);
    alert('Контакты и номер WhatsApp успешно сохранены!');
  });

  // ==========================================
  // TAB 4: CERTIFICATES & DOCS
  // ==========================================
  function renderDocumentsEditor() {
    const data = store.getData();
    const container = document.getElementById('admin-docs-editor');
    if (!container) return;

    container.innerHTML = data.documents.map((d, idx) => `
      <div class="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-xs font-bold text-cyan-400 uppercase tracking-wider">${d.type}</span>
          <span class="text-xs text-slate-500 font-mono">${d.number}</span>
        </div>
        <input 
          type="text" 
          id="doc-title-${idx}" 
          value="${d.title}" 
          class="w-full b2b-input px-3 py-1.5 rounded-lg text-xs" 
        />
        <input 
          type="text" 
          id="doc-file-${idx}" 
          value="${d.file}" 
          class="w-full b2b-input px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400" 
        />
      </div>
    `).join('');
  }

  document.getElementById('save-docs-btn').addEventListener('click', () => {
    const data = store.getData();
    data.documents.forEach((d, idx) => {
      const tInput = document.getElementById(`doc-title-${idx}`);
      const fInput = document.getElementById(`doc-file-${idx}`);
      if (tInput && fInput) {
        d.title = tInput.value;
        d.file = fInput.value;
      }
    });
    store.saveData(data);
    alert('Документы и сертификаты успешно обновлены!');
  });

  // ==========================================
  // TAB 5: MARKETING & INTEGRATIONS (Sections 18, 19, 26 of ТЗ)
  // ==========================================
  function renderMarketingForm() {
    const data = store.getData();
    document.getElementById('marketing-meta-pixel').value = data.company.metaPixelId || '';
    document.getElementById('marketing-ga4-id').value = data.company.ga4MeasurementId || '';
    document.getElementById('marketing-telegram-webhook').value = data.company.telegramWebhookUrl || '';
    document.getElementById('marketing-crm-webhook').value = data.company.crmWebhookUrl || '';
  }

  document.getElementById('save-marketing-btn').addEventListener('click', () => {
    const data = store.getData();
    data.company.metaPixelId = document.getElementById('marketing-meta-pixel').value.trim();
    data.company.ga4MeasurementId = document.getElementById('marketing-ga4-id').value.trim();
    data.company.telegramWebhookUrl = document.getElementById('marketing-telegram-webhook').value.trim();
    data.company.crmWebhookUrl = document.getElementById('marketing-crm-webhook').value.trim();
    store.saveData(data);
    alert('Настройки рекламы, пикселей и CRM-интеграций сохранены!');
  });

  // ==========================================
  // TAB 6: LEADS TABLE & EXPORT (Section 19 of ТЗ)
  // ==========================================
  function renderLeadsTable() {
    const leads = store.getLeads();
    const tbody = document.getElementById('admin-leads-tbody');
    const badge = document.getElementById('leads-count-badge');
    if (badge) badge.textContent = leads.length;

    if (!tbody) return;

    if (leads.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="p-8 text-center text-slate-500">
            Заявок пока не поступало. Заполните тестовую форму на сайте!
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = leads.map(l => {
      const cleanPhone = (l.phone || '').replace(/[^0-9]/g, '');
      const waMsg = encodeURIComponent(`Здравствуйте, ${l.name}! Вы оставляли заявку на заводе «Муосир пласт» (${l.product || 'упаковка'}). Готовы обсудить объемы и предоставить расчет поставки.`);
      const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waMsg}` : '#';

      return `
        <tr class="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
          <td class="p-3 text-xs text-slate-400 font-mono whitespace-nowrap">
            ${l.formattedDate || l.createdAt?.slice(0, 16)}
          </td>
          <td class="p-3 text-xs font-bold text-white">
            ${l.name}
            <div class="text-[11px] text-slate-400 font-normal">${l.company || '—'}</div>
          </td>
          <td class="p-3 text-xs text-slate-300">
            <span class="px-2 py-0.5 rounded bg-slate-800 text-blue-300 font-semibold">${l.country || '—'}</span>
          </td>
          <td class="p-3 text-xs">
            <div class="text-white font-mono font-semibold">${l.phone}</div>
            <div class="text-slate-400 text-[11px]">${l.email || '—'}</div>
          </td>
          <td class="p-3 text-xs text-slate-300 max-w-xs">
            <div class="font-semibold text-cyan-300">${l.product || 'Любая'}</div>
            <div class="text-slate-400 truncate text-[11px]">
              ${l.volume ? 'Объем: ' + l.volume + ' · ' : ''} ${l.comment || ''}
            </div>
          </td>
          <td class="p-3 text-[11px] text-slate-400 font-mono">
            <span class="text-emerald-400 font-semibold">${l.utmSource || 'direct'}</span>
            ${l.utmCampaign ? `<br><span class="text-slate-500">cmp:</span> ${l.utmCampaign}` : ''}
            ${l.utmContent ? `<br><span class="text-slate-500">ad:</span> ${l.utmContent}` : ''}
          </td>
          <td class="p-3 text-right space-x-2 whitespace-nowrap">
            ${cleanPhone ? `
              <a 
                href="${waLink}" 
                target="_blank" 
                class="px-2.5 py-1 text-xs rounded bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all inline-flex items-center gap-1 font-semibold"
                title="Написать клиенту в WhatsApp"
              >
                <span>WhatsApp</span>
              </a>
            ` : ''}
            <button 
              type="button" 
              onclick="window.adminController.deleteLead('${l.id}')"
              class="px-2 py-1 text-xs rounded bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white"
              title="Удалить заявку"
            >
              ✕
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Export Leads to CSV (Section 23 & 26 of ТЗ)
  document.getElementById('export-leads-csv-btn')?.addEventListener('click', () => {
    const leads = store.getLeads();
    if (leads.length === 0) {
      alert('Нет заявок для экспорта.');
      return;
    }

    const headers = ['Дата', 'Имя', 'Компания', 'Страна', 'Телефон', 'Email', 'Продукция', 'Объем', 'Комментарий', 'UTM_Source', 'UTM_Medium', 'UTM_Campaign', 'UTM_Content'];
    const rows = leads.map(l => [
      `"${l.formattedDate || l.createdAt}"`,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.company || '').replace(/"/g, '""')}"`,
      `"${(l.country || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.product || '').replace(/"/g, '""')}"`,
      `"${(l.volume || '').replace(/"/g, '""')}"`,
      `"${(l.comment || '').replace(/"/g, '""')}"`,
      `"${(l.utmSource || '').replace(/"/g, '""')}"`,
      `"${(l.utmMedium || '').replace(/"/g, '""')}"`,
      `"${(l.utmCampaign || '').replace(/"/g, '""')}"`,
      `"${(l.utmContent || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join("\r\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muosir-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Clear leads
  document.getElementById('clear-leads-btn')?.addEventListener('click', () => {
    if (confirm('Очистить все заявки из журнала? Действие необратимо!')) {
      store.clearLeads();
      renderLeadsTable();
    }
  });

  // Backup & Restore (JSON)
  document.getElementById('backup-json-btn')?.addEventListener('click', () => {
    store.exportToJson();
  });

  document.getElementById('restore-json-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const ok = store.importFromJson(event.target.result);
      if (ok) {
        alert('Данные успешно восстановлены!');
        renderAllAdminSections();
      } else {
        alert('Ошибка при импорте JSON!');
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('reset-defaults-btn')?.addEventListener('click', () => {
    if (confirm('Сбросить все настройки к начальным значениям из ТЗ?')) {
      store.resetData();
      renderAllAdminSections();
      alert('Данные сброшены к начальным значениям ТЗ.');
    }
  });
});

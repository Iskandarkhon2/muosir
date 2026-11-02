document.addEventListener('DOMContentLoaded', () => {
      const store = window.muosirStore;
      const i18n = window.muosirI18n;
      const products = store.getProducts('all');

      let activeCategory = 'all';
      let activeMaterial = 'all';
      let searchQuery = '';

      const grid = document.getElementById('catalog-products-grid');
      const countEl = document.getElementById('product-count');
      const noResults = document.getElementById('no-products-msg');
      const searchInput = document.getElementById('catalog-search-input');
      const resetBtn = document.getElementById('catalog-reset-filter');
      const quoteProductField = document.getElementById('quote-product-field');

      function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        })[character]);
      }

      function render() {
        const lang = i18n.getLang();
        const filtered = products.filter(p => {
          // Category filter
          if (activeCategory !== 'all' && p.categoryId !== activeCategory) return false;
          // Material filter
          if (activeMaterial !== 'all' && !p.material.toUpperCase().includes(activeMaterial)) return false;
          // Search query
          if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            const title = (p['title' + (lang === 'ru' ? '' : lang.charAt(0).toUpperCase() + lang.slice(1))] || p.title).toLowerCase();
            const desc = (p['desc' + (lang === 'ru' ? '' : lang.charAt(0).toUpperCase() + lang.slice(1))] || p.desc).toLowerCase();
            const mat = (p.material || '').toLowerCase();
            if (!title.includes(q) && !desc.includes(q) && !mat.includes(q)) return false;
          }
          return true;
        });

        countEl.textContent = filtered.length;

        if (filtered.length === 0) {
          grid.innerHTML = '';
          noResults.classList.remove('hidden');
          return;
        }

        noResults.classList.add('hidden');
        grid.innerHTML = filtered.map(p => {
          let title = p.title;
          let desc = p.desc;
          if (lang === 'en') { title = p.titleEn || title; desc = p.descEn || desc; }
          else if (lang === 'uz') { title = p.titleUz || title; desc = p.descUz || desc; }
          else if (lang === 'kk') { title = p.titleKk || title; desc = p.descKk || desc; }

          const safeTitle = escapeHtml(title);
          const safeDescription = escapeHtml(desc);
          const safeMaterial = escapeHtml(p.material);
          const safeVolume = escapeHtml(p.volume || 'Стандарт');
          const safeImage = escapeHtml(p.image);

          return `
            <div class="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between group hover:border-cyan-500/50 transition-all duration-300">
              <div>
                <div class="relative bg-slate-900/80 rounded-xl p-4 mb-4 flex items-center justify-center overflow-hidden aspect-video border border-slate-800/80">
                  <img src="${safeImage}" alt="${safeTitle}" class="max-h-36 w-auto object-contain transition-transform duration-300 group-hover:scale-105">
                  <span class="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950/80 text-cyan-400 border border-cyan-500/30">
                    ${safeMaterial.split(' ')[0]}
                  </span>
                </div>
                <div class="text-[11px] font-bold uppercase tracking-wider text-cyan-400 mb-1">${safeVolume}</div>
                <h3 class="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 mb-2">${safeTitle}</h3>
                <p class="text-xs text-slate-400 line-clamp-2 mb-4">${safeDescription}</p>
                <div class="space-y-1.5 py-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div class="flex justify-between"><span>Размеры:</span> <strong class="text-slate-200">${escapeHtml(p.diameter)}</strong></div>
                  <div class="flex justify-between"><span>В коробке:</span> <strong class="text-slate-200">${escapeHtml(p.boxQty)}</strong></div>
                  <div class="flex justify-between"><span>Мин. заказ:</span> <strong class="text-slate-200">${escapeHtml(p.minOrder)}</strong></div>
                </div>
              </div>
              <div class="mt-4 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                <a href="logo-visualizer.html?prod=${encodeURIComponent(String(p.id ?? ''))}" class="w-full py-2 px-3 rounded-lg text-xs font-bold bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-center transition-all flex items-center justify-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"/></svg>
                  <span>2D-предпросмотр логотипа</span>
                </a>
                <button type="button" data-quote-product="${safeTitle}" class="w-full py-2 px-3 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-center transition-all">
                  Запросить цену
                </button>
              </div>
            </div>
          `;
        }).join('');
        window.dispatchEvent(new CustomEvent('muosir_products_rendered'));
      }

      // Event Listeners
      grid.addEventListener('click', event => {
        const button = event.target.closest('[data-quote-product]');
        if (!button) return;
        quoteProductField.value = button.dataset.quoteProduct;
        document.getElementById('quick-quote-section').scrollIntoView({ behavior: 'smooth' });
        quoteProductField.focus();
      });

      document.querySelectorAll('#catalog-category-tabs .cat-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('#catalog-category-tabs .cat-pill').forEach(b => {
            b.classList.remove('bg-gradient-to-r', 'from-blue-600', 'to-cyan-500', 'text-white', 'shadow-lg');
            b.classList.add('bg-slate-900', 'border', 'border-slate-800', 'text-slate-400');
          });
          e.currentTarget.classList.remove('bg-slate-900', 'border', 'border-slate-800', 'text-slate-400');
          e.currentTarget.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-cyan-500', 'text-white', 'shadow-lg');
          activeCategory = e.currentTarget.getAttribute('data-cat');
          render();
        });
      });

      document.querySelectorAll('.mat-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.mat-filter').forEach(b => {
            b.className = 'mat-filter px-3 py-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 font-semibold';
          });
          e.currentTarget.className = 'mat-filter px-3 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/40';
          activeMaterial = e.currentTarget.getAttribute('data-mat');
          render();
        });
      });

      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
      });

      resetBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        activeCategory = 'all';
        activeMaterial = 'all';
        document.querySelectorAll('#catalog-category-tabs .cat-pill').forEach((b, idx) => {
          if (idx === 0) {
            b.className = 'cat-pill px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg whitespace-nowrap';
          } else {
            b.className = 'cat-pill px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850 whitespace-nowrap';
          }
        });
        document.querySelectorAll('.mat-filter').forEach((b, idx) => {
          if (idx === 0) {
            b.className = 'mat-filter px-3 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/40';
          } else {
            b.className = 'mat-filter px-3 py-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800 font-semibold';
          }
        });
        render();
      });

      window.addEventListener('muosir_lang_changed', render);

      // Quote Form
      const quoteForm = document.getElementById('catalog-quote-form');
      if (quoteForm) {
        quoteForm.addEventListener('submit', (e) => {
          e.preventDefault();
          alert('Спасибо за заявку! Экспорт-менеджер Муосир пласт свяжется с вами в течение рабочего дня.');
          quoteForm.reset();
        });
      }

      render();
    });

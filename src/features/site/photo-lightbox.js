(() => {
  function initialize() {
    const buttons = [...document.querySelectorAll('[data-lightbox-src]')];
    if (!buttons.length) return;

    const dialog = document.createElement('dialog');
    dialog.className = 'photo-lightbox';
    dialog.innerHTML = `
      <div class="photo-lightbox__header">
        <button type="button" class="photo-lightbox__close" aria-label="Закрыть изображение">×</button>
      </div>
      <img alt="">
      <p class="photo-lightbox__caption"></p>
    `;
    document.body.append(dialog);
    const image = dialog.querySelector('img');
    const caption = dialog.querySelector('.photo-lightbox__caption');

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        image.src = button.dataset.lightboxSrc;
        image.alt = button.dataset.lightboxAlt || '';
        caption.textContent = button.dataset.lightboxAlt || button.textContent.trim();
        dialog.showModal();
      });
    });
    dialog.querySelector('.photo-lightbox__close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
      image.removeAttribute('src');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();

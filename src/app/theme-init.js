(() => {
  const root = document.documentElement;
  let preference = null;

  try {
    const stored = localStorage.getItem('muosir_theme');
    if (stored === 'dark' || stored === 'light') preference = stored;
  } catch (error) {
    console.warn('Theme preference could not be read:', error);
  }

  const theme = preference || 'light';
  root.dataset.theme = theme;
  root.classList.toggle('theme-light', theme === 'light');
})();

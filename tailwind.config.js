module.exports = {
  content: {
    relative: true,
    files: ['./*.html', './src/**/*.js']
  },
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace']
      }
    }
  }
};

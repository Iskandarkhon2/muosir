'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'dist');
const PUBLIC_FILES = [
  'about.html',
  'admin-login.html',
  'admin.html',
  'catalog.html',
  'contacts.html',
  'export.html',
  'index.html',
  'logo-visualizer.html',
  'news.html',
  'production.html',
  'quality.html',
  'robots.txt',
  'sitemap.xml',
  'solutions.html'
];
const PUBLIC_DIRECTORIES = ['assets', 'media', 'src'];

async function build() {
  await fs.rm(OUTPUT, { recursive: true, force: true });
  await fs.mkdir(OUTPUT, { recursive: true });

  for (const file of PUBLIC_FILES) {
    await fs.copyFile(path.join(ROOT, file), path.join(OUTPUT, file));
  }

  const rootEntries = await fs.readdir(ROOT, { withFileTypes: true });
  const rootDirectories = new Set(
    rootEntries.filter(entry => entry.isDirectory()).map(entry => entry.name)
  );

  for (const directory of PUBLIC_DIRECTORIES) {
    if (!rootDirectories.has(directory)) continue;

    await fs.cp(path.join(ROOT, directory), path.join(OUTPUT, directory), {
      recursive: true,
      filter: sourcePath => {
        const segments = path.relative(ROOT, sourcePath).split(path.sep);
        return !segments.includes('serverless') && !segments.includes('vendor');
      }
    });
  }
}

build().catch(error => {
  console.error('Vercel static build failed:', error);
  process.exitCode = 1;
});

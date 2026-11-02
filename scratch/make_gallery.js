const fs = require('fs');
const path = require('path');

const photoDir = path.join(__dirname, '../media/photo/PNG');
const assetsDir = path.join(__dirname, '../assets/images');

const pngFiles = fs.existsSync(photoDir) ? fs.readdirSync(photoDir) : [];
const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];

let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Product Images Catalog</title>
<style>
  body { background: #0f172a; color: #f8fafc; font-family: sans-serif; padding: 24px; }
  h1 { font-size: 20px; margin-bottom: 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-bottom: 40px; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 12px; text-align: center; }
  .card img { max-width: 100%; height: 160px; object-fit: contain; background: #243248; border-radius: 8px; }
  .title { font-size: 13px; font-weight: 600; margin-top: 8px; color: #38bdf8; word-break: break-all; }
  .size { font-size: 11px; color: #94a3b8; }
</style>
</head>
<body>
  <h1>media/photo/PNG/ (${pngFiles.length} items)</h1>
  <div class="grid">
`;

pngFiles.forEach(f => {
  const stat = fs.statSync(path.join(photoDir, f));
  html += `
    <div class="card">
      <img src="/media/photo/PNG/${f}" alt="${f}" loading="lazy">
      <div class="title">${f}</div>
      <div class="size">${(stat.size / 1024 / 1024).toFixed(2)} MB</div>
    </div>
  `;
});

html += `
  </div>
  <h1>assets/images/ (${assetFiles.length} items)</h1>
  <div class="grid">
`;

assetFiles.forEach(f => {
  const stat = fs.statSync(path.join(assetsDir, f));
  html += `
    <div class="card">
      <img src="/assets/images/${f}" alt="${f}" loading="lazy">
      <div class="title">${f}</div>
      <div class="size">${(stat.size / 1024).toFixed(1)} KB</div>
    </div>
  `;
});

html += `
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'gallery.html'), html);
console.log('Gallery created successfully at scratch/gallery.html');

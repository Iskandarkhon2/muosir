'use strict';

const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'lead-attachments');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);
const SESSION_COOKIE = 'muosir_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const LEAD_RATE_LIMIT = { limit: 5, windowMs: 60 * 1000 };
const LOGIN_RATE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };
const MAX_REQUEST_BYTES = 21 * 1024 * 1024;
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const MAX_LEADS = 50000;

const STATIC_ROOT_FILES = new Set([
  'about.html',
  'admin.html',
  'catalog.html',
  'contacts.html',
  'export.html',
  'index.html',
  'logo-visualizer.html',
  'news.html',
  'production.html',
  'quality.html',
  'solutions.html',
  'admin-login.html',
  'robots.txt',
  'sitemap.xml'
]);

const MIME_TYPES = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8'
};

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = parsePasswordHash(process.env.ADMIN_PASSWORD_HASH);
const sessions = new Map();
const rateLimits = new Map();
let leadsWriteQueue = Promise.resolve();

if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH) {
  console.error('Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH before starting the server.');
  process.exit(1);
}

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error('PORT must be an integer between 1 and 65535.');
  process.exit(1);
}

function parsePasswordHash(value) {
  if (!value) return null;
  const match = /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/i.exec(value);
  if (!match) return null;
  return {
    salt: Buffer.from(match[1], 'hex'),
    hash: Buffer.from(match[2], 'hex')
  };
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length
    && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getClientAddress(request) {
  return request.socket.remoteAddress || 'unknown';
}

function consumeRateLimit(request, key, policy) {
  const now = Date.now();
  const address = getClientAddress(request);
  const bucketKey = `${key}:${address}`;
  const bucket = rateLimits.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    rateLimits.set(bucketKey, { count: 1, resetAt: now + policy.windowMs });
    return true;
  }
  if (bucket.count >= policy.limit) return false;
  bucket.count += 1;
  return true;
}

function pruneExpiringState() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(token);
  }
  for (const [key, bucket] of rateLimits) {
    if (bucket.resetAt <= now) rateLimits.delete(key);
  }
}

setInterval(pruneExpiringState, 60 * 1000).unref();

function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    ...headers
  });
  response.end(JSON.stringify(payload));
}

function sendError(response, status, message) {
  sendJson(response, status, { error: message });
}

function setSecurityHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

function parseCookies(request) {
  const cookies = new Map();
  for (const part of (request.headers.cookie || '').split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    cookies.set(part.slice(0, separator).trim(), part.slice(separator + 1).trim());
  }
  return cookies;
}

function getSession(request) {
  const token = parseCookies(request).get(SESSION_COOKIE);
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return { token, ...session };
}

function setSessionCookie(response, request, token) {
  const secure = request.socket.encrypted || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_MS / 1000}${secure}`
  );
}

function clearSessionCookie(response, request) {
  const secure = request.socket.encrypted || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`
  );
}

function isSameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

function requireSameOrigin(request, response) {
  if (isSameOrigin(request)) return true;
  sendError(response, 403, 'Cross-origin requests are not allowed.');
  return false;
}

function requireAdmin(request, response) {
  const session = getSession(request);
  if (session) return session;
  sendError(response, 401, 'Administrator authentication is required.');
  return null;
}

function readRequestBody(request, maximumBytes) {
  return new Promise((resolve, reject) => {
    const declaredLength = Number(request.headers['content-length'] || 0);
    if (declaredLength > maximumBytes) {
      reject(Object.assign(new Error('Request body is too large.'), { status: 413 }));
      request.resume();
      return;
    }

    const chunks = [];
    let receivedBytes = 0;
    request.on('data', chunk => {
      receivedBytes += chunk.length;
      if (receivedBytes > maximumBytes) {
        reject(Object.assign(new Error('Request body is too large.'), { status: 413 }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

async function readJsonBody(request, maximumBytes = MAX_REQUEST_BYTES) {
  const contentType = request.headers['content-type'] || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw Object.assign(new Error('Content-Type must be application/json.'), { status: 415 });
  }
  const rawBody = await readRequestBody(request, maximumBytes);
  try {
    const value = JSON.parse(rawBody);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError('JSON body must be an object.');
    }
    return value;
  } catch {
    throw Object.assign(new Error('Request body must contain a valid JSON object.'), { status: 400 });
  }
}

function cleanText(value, maximumLength = 1000) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') {
    throw Object.assign(new Error('Form fields must be text.'), { status: 400 });
  }
  return value.trim().slice(0, maximumLength);
}

function validateLead(input) {
  const lead = {
    name: cleanText(input.name, 120),
    company: cleanText(input.company, 160),
    country: cleanText(input.country, 120),
    phone: cleanText(input.phone, 60),
    email: cleanText(input.email, 254),
    product: cleanText(input.product || input.industry || input.samples, 300),
    volume: cleanText(input.volume, 160),
    comment: cleanText(input.comment || input.message, 3000),
    industry: cleanText(input.industry, 160),
    sourcePage: cleanText(input.sourcePage, 300),
    utmSource: cleanText(input.utmSource || input.source, 160),
    utmMedium: cleanText(input.utmMedium || input.medium, 160),
    utmCampaign: cleanText(input.utmCampaign || input.campaign, 200),
    utmContent: cleanText(input.utmContent || input.content, 200),
    utmTerm: cleanText(input.utmTerm || input.term, 200),
    gclid: cleanText(input.gclid, 200),
    fbclid: cleanText(input.fbclid, 200),
    referrer: cleanText(input.referrer, 500)
  };

  if (!lead.name || !lead.phone) {
    throw Object.assign(new Error('Name and phone are required.'), { status: 400 });
  }
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    throw Object.assign(new Error('Enter a valid email address.'), { status: 400 });
  }
  return lead;
}

function decodeAttachment(input) {
  if (!input) return null;
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Attachment metadata is invalid.'), { status: 400 });
  }

  const name = cleanText(input.name, 180);
  const extension = path.extname(name).toLowerCase();
  const allowedExtensions = new Set(['.pdf', '.xls', '.xlsx', '.doc', '.docx', '.jpg', '.jpeg', '.png']);
  const contentBase64 = input.contentBase64;
  if (!name || !allowedExtensions.has(extension) || typeof contentBase64 !== 'string') {
    throw Object.assign(new Error('Unsupported attachment format.'), { status: 400 });
  }
  if (contentBase64.length > Math.ceil(MAX_ATTACHMENT_BYTES * 4 / 3) + 8) {
    throw Object.assign(new Error('Attachment must be 15 MB or smaller.'), { status: 413 });
  }
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(contentBase64)) {
    throw Object.assign(new Error('Attachment encoding is invalid.'), { status: 400 });
  }

  const bytes = Buffer.from(contentBase64, 'base64');
  if (!bytes.length || bytes.length > MAX_ATTACHMENT_BYTES) {
    throw Object.assign(new Error('Attachment must be between 1 byte and 15 MB.'), { status: 413 });
  }
  if (bytes.toString('base64') !== contentBase64) {
    throw Object.assign(new Error('Attachment encoding is invalid.'), { status: 400 });
  }

  return {
    name,
    extension,
    mimeType: cleanText(input.type, 120) || 'application/octet-stream',
    size: bytes.length,
    bytes
  };
}

async function readLeads() {
  try {
    const content = await fs.promises.readFile(LEADS_FILE, 'utf8');
    const leads = JSON.parse(content);
    if (!Array.isArray(leads)) throw new TypeError('Lead store must contain an array.');
    return leads;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function atomicWriteJson(filePath, value) {
  const temporaryPath = `${filePath}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.promises.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    await fs.promises.rename(temporaryPath, filePath);
  } catch (error) {
    try {
      await fs.promises.rm(temporaryPath, { force: true });
    } catch (cleanupError) {
      console.error('Unable to remove temporary lead file:', cleanupError);
    }
    throw error;
  }
}

function updateLeads(mutator) {
  const transaction = leadsWriteQueue.then(async () => {
    const leads = await readLeads();
    const result = await mutator(leads);
    await atomicWriteJson(LEADS_FILE, leads);
    return result;
  });
  leadsWriteQueue = transaction.then(() => undefined, () => undefined);
  return transaction;
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`;
}

function serializeLeadsCsv(leads) {
  const headers = [
    'Date', 'Name', 'Company', 'Country', 'Phone', 'Email', 'Product', 'Volume',
    'Comment', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Content', 'UTM Term',
    'Source Page', 'Attachment'
  ];
  const rows = leads.map(lead => [
    lead.formattedDate, lead.name, lead.company, lead.country, lead.phone, lead.email,
    lead.product, lead.volume, lead.comment, lead.utmSource, lead.utmMedium,
    lead.utmCampaign, lead.utmContent, lead.utmTerm, lead.sourcePage,
    lead.attachment?.name || ''
  ].map(value => {
    const safeValue = /^[\s]*[=+\-@]/.test(String(value ?? '')) ? `'${value}` : value;
    return csvCell(safeValue);
  }).join(';'));
  return `\uFEFF${[headers.join(';'), ...rows].join('\r\n')}`;
}

function safePublicPath(requestPath) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch {
    return null;
  }
  if (decodedPath.includes('\0') || decodedPath.includes('\\')) return null;

  const normalizedPath = path.posix.normalize(decodedPath);
  if (normalizedPath.startsWith('/../') || normalizedPath === '/..') return null;
  const relativePath = normalizedPath.replace(/^\/+/, '');
  const firstSegment = relativePath.split('/')[0];

  if (firstSegment === 'data' || firstSegment === 'scratch' || firstSegment === '.git' || firstSegment === 'node_modules') {
    return null;
  }
  if (relativePath.startsWith('src/shared/vendor/')) return null;
  if (firstSegment === 'src' || firstSegment === 'assets' || firstSegment === 'media') {
    return path.resolve(ROOT, relativePath);
  }
  if (STATIC_ROOT_FILES.has(relativePath)) return path.resolve(ROOT, relativePath);
  return null;
}

async function serveStatic(request, response, pathname) {
  let requestedPath = pathname === '/' ? '/index.html' : pathname;
  if (requestedPath === '/admin.html') {
    if (!getSession(request)) {
      response.writeHead(303, { Location: '/admin-login.html', 'Cache-Control': 'no-store' });
      response.end();
      return;
    }
  }
  if (requestedPath === '/admin-login.html' && getSession(request)) {
    response.writeHead(303, { Location: '/admin.html', 'Cache-Control': 'no-store' });
    response.end();
    return;
  }

  const filePath = safePublicPath(requestedPath);
  if (!filePath || !filePath.startsWith(`${ROOT}${path.sep}`)) {
    response.writeHead(404, { 'Cache-Control': 'no-store' });
    response.end('Not Found');
    return;
  }

  let fileInfo;
  try {
    fileInfo = await fs.promises.stat(filePath);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      response.writeHead(404, { 'Cache-Control': 'no-store' });
      response.end('Not Found');
      return;
    }
    throw error;
  }
  if (!fileInfo.isFile()) {
    response.writeHead(404, { 'Cache-Control': 'no-store' });
    response.end('Not Found');
    return;
  }

  const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  const cacheControl = filePath.endsWith('admin.html')
    ? 'no-store'
    : filePath.endsWith('.html')
      ? 'no-cache'
      : path.extname(filePath).toLowerCase() === '.js'
        ? 'no-cache'
      : 'public, max-age=3600';
  response.writeHead(200, {
    'Cache-Control': cacheControl,
    'Content-Length': fileInfo.size,
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff'
  });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  const stream = fs.createReadStream(filePath);
  stream.on('error', error => {
    console.error('Static file stream failed:', error.message);
    if (!response.headersSent) response.writeHead(500);
    response.end();
  });
  stream.pipe(response);
}

async function handleApi(request, response, pathname) {
  if (request.method === 'POST' && pathname === '/api/leads') {
    if (!consumeRateLimit(request, 'lead', LEAD_RATE_LIMIT)) {
      sendError(response, 429, 'Too many requests. Please try again later.');
      return;
    }
    if (!requireSameOrigin(request, response)) return;
    const input = await readJsonBody(request);
    if (cleanText(input.website, 200)) {
      sendJson(response, 200, { ok: true, spam: true });
      return;
    }

    const lead = validateLead(input);
    if (input.attachment && input.customizerPreview) {
      throw Object.assign(new Error('Submit one attachment per inquiry.'), { status: 400 });
    }
    const isCustomizerPreview = Boolean(input.customizerPreview);
    const attachment = decodeAttachment(isCustomizerPreview ? input.customizerPreview : input.attachment);
    if (isCustomizerPreview) {
      const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      if (attachment.extension !== '.png'
        || attachment.mimeType !== 'image/png'
        || !attachment.bytes.subarray(0, pngSignature.length).equals(pngSignature)) {
        throw Object.assign(new Error('Customizer preview must be a valid PNG image.'), { status: 400 });
      }
    }
    await fs.promises.mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
    if (attachment) await fs.promises.mkdir(UPLOADS_DIR, { recursive: true, mode: 0o700 });
    const id = crypto.randomUUID();
    let attachmentRecord = null;
    let storedAttachmentPath = null;

    if (attachment) {
      const storedName = isCustomizerPreview
        ? `preview-${Date.now()}-${id.slice(0, 8)}.png`
        : `${id}${attachment.extension}`;
      storedAttachmentPath = path.join(UPLOADS_DIR, storedName);
      await fs.promises.writeFile(storedAttachmentPath, attachment.bytes, { flag: 'wx', mode: 0o600 });
      attachmentRecord = {
        name: attachment.name,
        storedName,
        mimeType: attachment.mimeType,
        size: attachment.size,
        ...(isCustomizerPreview ? { kind: 'customizer-preview' } : {})
      };
    }

    const record = {
      id,
      createdAt: new Date().toISOString(),
      formattedDate: new Date().toLocaleString('ru-RU'),
      ...lead,
      ...(attachmentRecord ? { attachment: attachmentRecord } : {})
    };

    try {
      await updateLeads(leads => {
        if (leads.length >= MAX_LEADS) {
          throw Object.assign(new Error('Lead storage has reached its configured limit.'), { status: 503 });
        }
        leads.unshift(record);
      });
    } catch (error) {
      if (storedAttachmentPath) await fs.promises.rm(storedAttachmentPath, { force: true });
      throw error;
    }

    sendJson(response, 201, { ok: true, id: record.id });
    return;
  }

  if (request.method === 'POST' && pathname === '/api/admin/login') {
    if (!consumeRateLimit(request, 'admin-login', LOGIN_RATE_LIMIT)) {
      sendError(response, 429, 'Too many login attempts. Please try again later.');
      return;
    }
    if (!requireSameOrigin(request, response)) return;
    const input = await readJsonBody(request, 8 * 1024);
    const username = cleanText(input.username, 120);
    const password = typeof input.password === 'string' ? input.password : '';
    const passwordHash = crypto.scryptSync(password, ADMIN_PASSWORD_HASH.salt, 64);
    const valid = safeEqual(username, ADMIN_USERNAME)
      && crypto.timingSafeEqual(passwordHash, ADMIN_PASSWORD_HASH.hash);
    passwordHash.fill(0);
    if (!valid) {
      sendError(response, 401, 'Invalid username or password.');
      return;
    }

    const token = crypto.randomBytes(32).toString('base64url');
    sessions.set(token, { createdAt: Date.now(), expiresAt: Date.now() + SESSION_TTL_MS });
    setSessionCookie(response, request, token);
    sendJson(response, 200, { ok: true, expiresIn: SESSION_TTL_MS / 1000 });
    return;
  }

  if (request.method === 'GET' && pathname === '/api/admin/session') {
    const session = getSession(request);
    if (!session) {
      sendError(response, 401, 'Administrator authentication is required.');
      return;
    }
    sendJson(response, 200, { ok: true, expiresAt: new Date(session.expiresAt).toISOString() });
    return;
  }

  if (request.method === 'POST' && pathname === '/api/admin/logout') {
    if (!requireSameOrigin(request, response)) return;
    const session = getSession(request);
    if (session) sessions.delete(session.token);
    clearSessionCookie(response, request);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === 'GET' && pathname === '/api/admin/leads') {
    if (!requireAdmin(request, response)) return;
    const leads = await readLeads();
    sendJson(response, 200, { leads });
    return;
  }

  if (request.method === 'GET' && pathname === '/api/admin/export-csv') {
    if (!requireAdmin(request, response)) return;
    const csv = serializeLeadsCsv(await readLeads());
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="muosir-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Content-Type': 'text/csv; charset=utf-8',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(csv);
    return;
  }

  if (request.method === 'DELETE' && pathname === '/api/admin/leads') {
    if (!requireAdmin(request, response)) return;
    if (!requireSameOrigin(request, response)) return;
    const removedLeads = await updateLeads(leads => leads.splice(0, leads.length));
    await Promise.all(removedLeads.map(lead => lead.attachment?.storedName
      ? fs.promises.rm(path.join(UPLOADS_DIR, path.basename(lead.attachment.storedName)), { force: true })
      : Promise.resolve()));
    sendJson(response, 200, { ok: true, deleted: removedLeads.length });
    return;
  }

  const leadMatch = /^\/api\/admin\/leads\/([0-9a-f-]{36})$/i.exec(pathname);
  if (request.method === 'DELETE' && leadMatch) {
    if (!requireAdmin(request, response)) return;
    if (!requireSameOrigin(request, response)) return;
    const removed = await updateLeads(leads => {
      const index = leads.findIndex(lead => lead.id === leadMatch[1]);
      return index < 0 ? null : leads.splice(index, 1)[0];
    });
    if (!removed) {
      sendError(response, 404, 'Lead not found.');
      return;
    }
    if (removed.attachment?.storedName) {
      await fs.promises.rm(
        path.join(UPLOADS_DIR, path.basename(removed.attachment.storedName)),
        { force: true }
      );
    }
    sendJson(response, 200, { ok: true });
    return;
  }

  const attachmentMatch = /^\/api\/admin\/leads\/([0-9a-f-]{36})\/attachment$/i.exec(pathname);
  if (request.method === 'GET' && attachmentMatch) {
    if (!requireAdmin(request, response)) return;
    const leads = await readLeads();
    const lead = leads.find(item => item.id === attachmentMatch[1]);
    if (!lead?.attachment?.storedName) {
      sendError(response, 404, 'Attachment not found.');
      return;
    }
    const fileName = path.basename(lead.attachment.storedName);
    const filePath = path.join(UPLOADS_DIR, fileName);
    const stat = await fs.promises.stat(filePath).catch(error => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
    if (!stat?.isFile()) {
      sendError(response, 404, 'Attachment not found.');
      return;
    }
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(lead.attachment.name)}`,
      'Content-Length': stat.size,
      'Content-Type': 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(filePath).pipe(response);
    return;
  }

  sendError(response, 404, 'API endpoint not found.');
}

const server = http.createServer(async (request, response) => {
  setSecurityHeaders(response);
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      await handleApi(request, response, url.pathname);
      return;
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD', 'Cache-Control': 'no-store' });
      response.end('Method Not Allowed');
      return;
    }
    await serveStatic(request, response, url.pathname);
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    if (status >= 500) console.error('Request failed:', error);
    if (!response.headersSent) sendError(response, status, status >= 500 ? 'The request could not be completed.' : error.message);
    else response.destroy();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Muosir Plast site listening at http://${HOST}:${PORT}`);
  console.log(`Admin login: http://${HOST}:${PORT}/admin-login.html`);
});

server.on('clientError', (_error, socket) => {
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(error => {
      if (error) {
        console.error('Server shutdown failed:', error);
        process.exitCode = 1;
      }
    });
  });
}

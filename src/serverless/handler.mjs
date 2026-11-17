import { neon } from '@neondatabase/serverless';
import { del, get, head } from '@vercel/blob';
import { handleUpload } from '@vercel/blob/client';
import crypto from 'node:crypto';

const SESSION_COOKIE = 'muosir_admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_REQUEST_BYTES = 128 * 1024;
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const MAX_LEADS = 50000;
const LEAD_RATE_LIMIT = { limit: 5, windowMs: 60 * 1000 };
const LOGIN_RATE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };
const ATTACHMENT_TYPES = {
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  pdf: 'application/pdf',
  png: 'image/png',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

let sqlClient;
let schemaPromise;

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new HttpError(503, 'The database is not configured.');
  }
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

async function ensureSchema() {
  if (!schemaPromise) {
    const sql = getSql();
    schemaPromise = sql.transaction([
      sql`
        CREATE TABLE IF NOT EXISTS muosir_leads (
          id UUID PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL,
          payload JSONB NOT NULL
        )
      `,
      sql`
        CREATE INDEX IF NOT EXISTS muosir_leads_created_at_idx
        ON muosir_leads (created_at DESC)
      `,
      sql`
        CREATE TABLE IF NOT EXISTS muosir_rate_limits (
          bucket_key TEXT PRIMARY KEY,
          window_started_at TIMESTAMPTZ NOT NULL,
          request_count INTEGER NOT NULL
        )
      `,
      sql`
        CREATE TABLE IF NOT EXISTS muosir_admin_sessions (
          token_hash TEXT PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL
        )
      `,
      sql`
        CREATE INDEX IF NOT EXISTS muosir_admin_sessions_expires_at_idx
        ON muosir_admin_sessions (expires_at)
      `
    ]).catch(error => {
      schemaPromise = undefined;
      throw error;
    });
  }
  await schemaPromise;
}

function jsonResponse(status, value, headers = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...headers
    }
  });
}

function errorResponse(status, message) {
  return jsonResponse(status, { error: message });
}

function addSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
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

function parseCookies(request) {
  const cookies = new Map();
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    cookies.set(part.slice(0, separator).trim(), part.slice(separator + 1).trim());
  }
  return cookies;
}

function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function requireSameOrigin(request) {
  if (!isSameOrigin(request)) {
    throw new HttpError(403, 'Cross-origin requests are not allowed.');
  }
}

function getClientAddress(request) {
  const realAddress = request.headers.get('x-real-ip');
  if (realAddress) return realAddress;
  const forwardedAddresses = request.headers.get('x-forwarded-for') || '';
  return forwardedAddresses.split(',').pop().trim() || 'unknown';
}

async function consumeRateLimit(request, key, policy) {
  await ensureSchema();
  const addressHash = crypto.createHash('sha256').update(getClientAddress(request)).digest('hex');
  const bucketKey = `${key}:${addressHash}`;
  const sql = getSql();
  const rows = await sql`
    INSERT INTO muosir_rate_limits (bucket_key, window_started_at, request_count)
    VALUES (${bucketKey}, NOW(), 1)
    ON CONFLICT (bucket_key) DO UPDATE SET
      request_count = CASE
        WHEN muosir_rate_limits.window_started_at <= NOW() - (${policy.windowMs} * INTERVAL '1 millisecond')
        THEN 1
        ELSE muosir_rate_limits.request_count + 1
      END,
      window_started_at = CASE
        WHEN muosir_rate_limits.window_started_at <= NOW() - (${policy.windowMs} * INTERVAL '1 millisecond')
        THEN NOW()
        ELSE muosir_rate_limits.window_started_at
      END
    RETURNING request_count
  `;
  if (Math.random() < 0.01) {
    await sql`DELETE FROM muosir_rate_limits WHERE window_started_at < NOW() - INTERVAL '1 day'`;
  }
  return Number(rows[0]?.request_count) <= policy.limit;
}

async function readJsonBody(request, maximumBytes = MAX_REQUEST_BYTES) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'Content-Type must be application/json.');
  }
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > maximumBytes) {
    throw new HttpError(413, 'Request body is too large.');
  }
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody) > maximumBytes) {
    throw new HttpError(413, 'Request body is too large.');
  }
  try {
    const value = JSON.parse(rawBody);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError('Expected an object.');
    }
    return value;
  } catch {
    throw new HttpError(400, 'Request body must contain a valid JSON object.');
  }
}

function cleanText(value, maximumLength = 1000) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') {
    throw new HttpError(400, 'Form fields must be text.');
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
    throw new HttpError(400, 'Name and phone are required.');
  }
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    throw new HttpError(400, 'Enter a valid email address.');
  }
  return lead;
}

function getAttachmentExtension(name) {
  return path.extname(name).toLowerCase().slice(1);
}

function validateBlobPath(pathname, extension) {
  const uuidPattern = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  return new RegExp(`^lead-attachments/${uuidPattern}\\.${extension}$`, 'i').test(pathname);
}

async function validateAttachment(input, field) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'Attachment metadata is invalid.');
  }
  const name = cleanText(input.name, 180);
  const extension = getAttachmentExtension(name);
  const contentType = ATTACHMENT_TYPES[extension];
  const pathname = cleanText(input.pathname, 200);
  if (!name || !contentType || input.type !== contentType || !validateBlobPath(pathname, extension)) {
    throw new HttpError(400, 'Unsupported attachment format.');
  }
  if (field === 'customizerPreview' && (extension !== 'png' || contentType !== 'image/png')) {
    throw new HttpError(400, 'Customizer preview must be a PNG image.');
  }
  if (field === 'attachment' && ['jpg', 'jpeg', 'png'].includes(extension)) {
    throw new HttpError(400, 'Unsupported attachment format.');
  }

  let metadata;
  try {
    metadata = await head(pathname, { access: 'private' });
  } catch (error) {
    if (error?.name === 'BlobNotFoundError') {
      throw new HttpError(400, 'Uploaded attachment was not found.');
    }
    throw error;
  }
  if (metadata.size < 1 || metadata.size > MAX_ATTACHMENT_BYTES) {
    throw new HttpError(413, 'Attachment must be between 1 byte and 15 MB.');
  }
  if (metadata.contentType !== contentType) {
    throw new HttpError(400, 'Attachment content type does not match its file extension.');
  }

  return {
    name,
    storedName: pathname,
    mimeType: contentType,
    size: metadata.size,
    ...(field === 'customizerPreview' ? { kind: 'customizer-preview' } : {})
  };
}

async function getSession(request) {
  const token = parseCookies(request).get(SESSION_COOKIE);
  if (!token || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
  await ensureSchema();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const rows = await getSql()`
    SELECT expires_at
    FROM muosir_admin_sessions
    WHERE token_hash = ${tokenHash} AND expires_at > NOW()
    LIMIT 1
  `;
  return rows[0] ? { tokenHash, expiresAt: new Date(rows[0].expires_at) } : null;
}

function sessionCookie(token, maxAge = SESSION_TTL_MS / 1000) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
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

async function readLeads() {
  await ensureSchema();
  const rows = await getSql()`
    SELECT payload
    FROM muosir_leads
    ORDER BY created_at DESC
    LIMIT ${MAX_LEADS}
  `;
  return rows.map(row => row.payload);
}

async function saveLead(record) {
  await ensureSchema();
  const sql = getSql();
  const countRows = await sql`SELECT COUNT(*)::INTEGER AS count FROM muosir_leads`;
  if (Number(countRows[0]?.count) >= MAX_LEADS) {
    throw new HttpError(503, 'Lead storage has reached its configured limit.');
  }
  await sql`
    INSERT INTO muosir_leads (id, created_at, payload)
    VALUES (${record.id}::uuid, ${record.createdAt}::timestamptz, ${JSON.stringify(record)}::jsonb)
  `;
}

async function deleteLeadRecord(id) {
  await ensureSchema();
  const rows = await getSql()`
    SELECT payload FROM muosir_leads WHERE id = ${id}::uuid LIMIT 1
  `;
  if (!rows[0]) return null;
  await getSql()`DELETE FROM muosir_leads WHERE id = ${id}::uuid`;
  return rows[0].payload;
}

async function requireAdmin(request) {
  const session = await getSession(request);
  if (!session) throw new HttpError(401, 'Administrator authentication is required.');
  return session;
}

async function handleLeadSubmission(request) {
  if (request.method !== 'POST') {
    return errorResponse(405, 'Method Not Allowed');
  }
  if (!await consumeRateLimit(request, 'lead', LEAD_RATE_LIMIT)) {
    return errorResponse(429, 'Too many requests. Please try again later.');
  }
  requireSameOrigin(request);
  const input = await readJsonBody(request);
  if (cleanText(input.website, 200)) {
    return jsonResponse(200, { ok: true, spam: true });
  }
  if (input.attachment && input.customizerPreview) {
    throw new HttpError(400, 'Submit one attachment per inquiry.');
  }

  const lead = validateLead(input);
  const attachmentField = input.customizerPreview ? 'customizerPreview' : 'attachment';
  const attachmentInput = input[attachmentField];
  const attachment = attachmentInput
    ? await validateAttachment(attachmentInput, attachmentField)
    : null;
  const createdAt = new Date();
  const id = crypto.randomUUID();
  const record = {
    id,
    createdAt: createdAt.toISOString(),
    formattedDate: createdAt.toLocaleString('ru-RU'),
    ...lead,
    ...(attachment ? { attachment } : {})
  };
  await saveLead(record);
  return jsonResponse(201, { ok: true, id });
}

async function handleBlobUpload(request) {
  if (request.method !== 'POST') {
    return errorResponse(405, 'Method Not Allowed');
  }
  const body = await readJsonBody(request, 32 * 1024);
  const result = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async pathname => {
      requireSameOrigin(request);
      if (!await consumeRateLimit(request, 'upload', LEAD_RATE_LIMIT)) {
        throw new HttpError(429, 'Too many upload attempts. Please try again later.');
      }
      const match = /^lead-attachments\/[0-9a-f-]{36}\.([a-z0-9]+)$/i.exec(pathname);
      const extension = match?.[1]?.toLowerCase();
      const contentType = ATTACHMENT_TYPES[extension];
      if (!contentType || !validateBlobPath(pathname, extension)) {
        throw new HttpError(400, 'Unsupported attachment format.');
      }
      return {
        allowedContentTypes: [contentType],
        maximumSizeInBytes: MAX_ATTACHMENT_BYTES,
        addRandomSuffix: false,
        allowOverwrite: false,
        validUntil: Date.now() + 10 * 60 * 1000
      };
    }
  });
  return jsonResponse(200, result);
}

async function handleAdminLogin(request) {
  if (request.method !== 'POST') return errorResponse(405, 'Method Not Allowed');
  if (!await consumeRateLimit(request, 'admin-login', LOGIN_RATE_LIMIT)) {
    return errorResponse(429, 'Too many login attempts. Please try again later.');
  }
  requireSameOrigin(request);
  const input = await readJsonBody(request, 8 * 1024);
  const passwordConfiguration = parsePasswordHash(process.env.ADMIN_PASSWORD_HASH);
  if (!process.env.ADMIN_USERNAME || !passwordConfiguration) {
    throw new HttpError(503, 'Administrator login is not configured.');
  }
  const username = cleanText(input.username, 120);
  const password = typeof input.password === 'string' ? input.password : '';
  const passwordHash = crypto.scryptSync(password, passwordConfiguration.salt, 64);
  const valid = safeEqual(username, process.env.ADMIN_USERNAME)
    && crypto.timingSafeEqual(passwordHash, passwordConfiguration.hash);
  passwordHash.fill(0);
  if (!valid) return errorResponse(401, 'Invalid username or password.');

  await ensureSchema();
  await getSql()`DELETE FROM muosir_admin_sessions WHERE expires_at <= NOW()`;
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await getSql()`
    INSERT INTO muosir_admin_sessions (token_hash, created_at, expires_at)
    VALUES (${tokenHash}, NOW(), ${expiresAt.toISOString()}::timestamptz)
  `;
  return jsonResponse(200, { ok: true, expiresIn: SESSION_TTL_MS / 1000 }, {
    'Set-Cookie': sessionCookie(token)
  });
}

async function handleAdminSession(request) {
  if (request.method !== 'GET') return errorResponse(405, 'Method Not Allowed');
  const session = await requireAdmin(request);
  return jsonResponse(200, { ok: true, expiresAt: session.expiresAt.toISOString() });
}

async function handleAdminLogout(request) {
  if (request.method !== 'POST') return errorResponse(405, 'Method Not Allowed');
  requireSameOrigin(request);
  const session = await getSession(request);
  if (session) {
    await getSql()`DELETE FROM muosir_admin_sessions WHERE token_hash = ${session.tokenHash}`;
  }
  return jsonResponse(200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
}

async function handleAdminLeads(request) {
  if (request.method === 'GET') {
    await requireAdmin(request);
    return jsonResponse(200, { leads: await readLeads() });
  }
  if (request.method === 'DELETE') {
    await requireAdmin(request);
    requireSameOrigin(request);
    const leads = await readLeads();
    await getSql()`DELETE FROM muosir_leads`;
    const blobPaths = leads
      .map(lead => lead.attachment?.storedName)
      .filter(Boolean);
    if (blobPaths.length) {
      try {
        await del(blobPaths, { access: 'private' });
      } catch (error) {
        console.error('Lead attachments were not fully removed from Blob storage:', error);
        throw new HttpError(503, 'Leads were deleted, but some attachments could not be removed.');
      }
    }
    return jsonResponse(200, { ok: true, deleted: leads.length });
  }
  return errorResponse(405, 'Method Not Allowed');
}

async function handleDeleteLead(request, id) {
  if (request.method !== 'DELETE') return errorResponse(405, 'Method Not Allowed');
  await requireAdmin(request);
  requireSameOrigin(request);
  if (!/^[0-9a-f-]{36}$/i.test(id || '')) return errorResponse(404, 'Lead not found.');
  const lead = await deleteLeadRecord(id);
  if (!lead) return errorResponse(404, 'Lead not found.');
  if (lead.attachment?.storedName) {
    try {
      await del(lead.attachment.storedName, { access: 'private' });
    } catch (error) {
      console.error(`Attachment cleanup failed for lead ${id}:`, error);
      throw new HttpError(503, 'The lead was deleted, but its attachment could not be removed.');
    }
  }
  return jsonResponse(200, { ok: true });
}

async function handleAdminExport(request) {
  if (request.method !== 'GET') return errorResponse(405, 'Method Not Allowed');
  await requireAdmin(request);
  const csv = serializeLeadsCsv(await readLeads());
  return new Response(csv, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename="muosir-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Content-Type': 'text/csv; charset=utf-8',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

async function handleAttachmentDownload(request, id) {
  if (request.method !== 'GET') return errorResponse(405, 'Method Not Allowed');
  await requireAdmin(request);
  if (!/^[0-9a-f-]{36}$/i.test(id || '')) return errorResponse(404, 'Attachment not found.');
  await ensureSchema();
  const rows = await getSql()`
    SELECT payload FROM muosir_leads WHERE id = ${id}::uuid LIMIT 1
  `;
  const attachment = rows[0]?.payload?.attachment;
  if (!attachment?.storedName) return errorResponse(404, 'Attachment not found.');

  const blob = await get(attachment.storedName, { access: 'private' });
  if (!blob || blob.statusCode !== 200) return errorResponse(404, 'Attachment not found.');
  return new Response(blob.stream, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
      'Content-Length': String(blob.blob.size),
      'Content-Type': 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

const routes = {
  'admin-login': handleAdminLogin,
  'admin-session': handleAdminSession,
  'admin-logout': handleAdminLogout,
  'admin-leads': handleAdminLeads,
  'admin-export-csv': handleAdminExport,
  'blob-upload': handleBlobUpload,
  leads: handleLeadSubmission
};

export async function handleRequest(request) {
  const url = new URL(request.url);
  const route = url.searchParams.get('route');
  let response;
  try {
    if (route === 'admin-delete-lead') {
      response = await handleDeleteLead(request, url.searchParams.get('id'));
    } else if (route === 'admin-lead-attachment') {
      response = await handleAttachmentDownload(request, url.searchParams.get('id'));
    } else {
      const handler = routes[route];
      response = handler
        ? await handler(request)
        : errorResponse(404, 'API endpoint not found.');
    }
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    if (status >= 500) console.error('Serverless request failed:', error);
    response = errorResponse(
      status,
      error instanceof HttpError ? error.message : 'The request could not be completed.'
    );
  }
  return addSecurityHeaders(response);
}

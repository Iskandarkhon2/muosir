import assert from 'node:assert/strict';
import test from 'node:test';
import { handleRequest } from '../src/serverless/handler.mjs';

test('unknown serverless routes return JSON 404 responses', async () => {
  const response = await handleRequest(new Request('https://example.test/api/index?route=missing'));

  assert.equal(response.status, 404);
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.deepEqual(await response.json(), { error: 'API endpoint not found.' });
});

test('lead API rejects unsupported methods without requiring cloud storage', async () => {
  const response = await handleRequest(new Request('https://example.test/api/index?route=leads'));

  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: 'Method Not Allowed' });
});

test('admin session is unavailable without a valid session cookie', async () => {
  const response = await handleRequest(new Request('https://example.test/api/index?route=admin-session'));

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    error: 'Administrator authentication is required.'
  });
});

test('lead API reports missing database configuration explicitly', async () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    const response = await handleRequest(new Request('https://example.test/api/index?route=leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://example.test'
      },
      body: JSON.stringify({ name: 'Test', phone: '123' })
    }));

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'The database is not configured.' });
  } finally {
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
  }
});

'use strict';

const crypto = require('crypto');

const password = process.env.ADMIN_PASSWORD_PLAIN || '';
if (!password) {
  console.error('ADMIN_PASSWORD_PLAIN cannot be empty.');
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, 64);
process.stdout.write(`scrypt$${salt.toString('hex')}$${hash.toString('hex')}`);

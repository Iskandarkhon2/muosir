'use strict';

const crypto = require('crypto');

if (!process.stdin.isTTY || !process.stdin.setRawMode) {
  console.error('Run this command in an interactive terminal so the password can be entered securely.');
  process.exit(1);
}

const input = process.stdin;
const output = process.stdout;
let password = '';

process.stderr.write('Administrator password (minimum 14 characters): ');
input.setRawMode(true);
input.setEncoding('utf8');
input.resume();

function finish() {
  input.setRawMode(false);
  input.pause();
}

input.on('data', character => {
  if (character === '\u0003') {
    finish();
    process.stderr.write('\nCancelled.\n');
    process.exit(130);
  }
  if (character === '\r' || character === '\n') {
    finish();
    process.stderr.write('\n');
    if (password.length < 14) {
      process.stderr.write('Password must contain at least 14 characters.\n');
      password = '';
      process.exitCode = 1;
      return;
    }

    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(password, salt, 64);
    output.write(`scrypt$${salt.toString('hex')}$${hash.toString('hex')}\n`);
    password = '';
    return;
  }
  if (character === '\u007f' || character === '\b') {
    if (password.length) {
      password = password.slice(0, -1);
      process.stderr.write('\b \b');
    }
    return;
  }
  if (character >= ' ' && character !== '\u007f') {
    password += character;
    process.stderr.write('*');
  }
});

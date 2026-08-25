#!/usr/bin/env node
// Rebuilds china/index.html: inlines the viagem app into one HTML document,
// encrypts it with AES-256-GCM (key = PBKDF2-SHA256 of the password) and wraps
// it in an unlock page that decrypts in the browser.
//
//   node _build/rebuild.js <source-dir> <password>
//   node _build/rebuild.js ~/Downloads/china/viagem 'a-tua-senha'
//
// The plaintext sources deliberately live OUTSIDE this repo.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [srcDir, password] = process.argv.slice(2);
if (!srcDir || !password) {
  console.error('usage: node rebuild.js <source-dir> <password>');
  process.exit(1);
}

const ITERATIONS = 310000;
const read = (f) => fs.readFileSync(path.join(srcDir, f), 'utf8');

// --- 1. one self-contained document ------------------------------------------
let doc = read('index.html');
const css = read('styles.css');
const data = read('data.js');
const app = read('app.js');

const inline = (pattern, replacement, what) => {
  if (!pattern.test(doc)) throw new Error(`could not find ${what} in index.html`);
  doc = doc.replace(pattern, () => replacement);
};

inline(/<link\s+rel="stylesheet"\s+href="styles\.css">/,
  `<style>\n${css}\n</style>`, 'the styles.css link');
inline(/<script\s+src="data\.js"><\/script>/,
  `<script>\n${data}\n<\/script>`, 'the data.js script tag');
inline(/<script\s+src="app\.js"><\/script>/,
  `<script>\n${app}\n<\/script>`, 'the app.js script tag');

// --- 2. encrypt ---------------------------------------------------------------
const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([cipher.update(doc, 'utf8'), cipher.final(), cipher.getAuthTag()]);

const payload = {
  v: 1,
  kdf: 'PBKDF2-SHA256',
  iter: ITERATIONS,
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  ct: ct.toString('base64'),
};

// --- 3. unlock page ----------------------------------------------------------
const shell = fs.readFileSync(path.join(__dirname, 'unlock.template.html'), 'utf8');
const out = shell.replace('__PAYLOAD__', () => JSON.stringify(payload));
fs.writeFileSync(path.join(__dirname, '..', 'index.html'), out);

const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log(`plaintext  ${kb(Buffer.byteLength(doc))}`);
console.log(`encrypted  ${kb(ct.length)}  (AES-256-GCM, PBKDF2 ${ITERATIONS} iter)`);
console.log(`written    ${path.join(__dirname, '..', 'index.html')}  ${kb(Buffer.byteLength(out))}`);

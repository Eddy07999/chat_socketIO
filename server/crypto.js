const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const ENCODING = 'hex';

function getKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('ENCRYPTION_KEY env variable is required (64 hex chars = 32 bytes)');
  }
  return Buffer.from(raw, 'hex');
}

function encrypt(plaintext) {
  if (!plaintext) return plaintext;

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(String(plaintext), 'utf8', ENCODING);
  encrypted += cipher.final(ENCODING);

  const tag = cipher.getAuthTag();

  // iv:tag:ciphertext
  return [iv.toString(ENCODING), tag.toString(ENCODING), encrypted].join(':');
}

function decrypt(ciphertext) {
  if (!ciphertext) return ciphertext;

  const key = getKey();
  const [ivHex, tagHex, encrypted] = ciphertext.split(':');

  const iv = Buffer.from(ivHex, ENCODING);
  const tag = Buffer.from(tagHex, ENCODING);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, ENCODING, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = { encrypt, decrypt };

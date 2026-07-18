import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Encrypts workspace BYOK provider keys (OpenAI/Anthropic secrets) before
 * they touch the database. AES-256-GCM: ciphertext, IV, and auth tag are
 * stored as three separate columns (see ApiKey model) so a partial read
 * never reconstructs a usable key on its own.
 *
 * ENCRYPTION_KEY must be a base64-encoded 32-byte value:
 *   openssl rand -base64 32
 *
 * Rotating ENCRYPTION_KEY makes every previously-saved key undecryptable —
 * workspaces would need to re-enter their provider keys. There's no
 * built-in re-encryption migration here; for a real rotation you'd decrypt
 * with the old key and re-encrypt with the new one in a one-off script
 * before swapping the env var.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV is the GCM-recommended size

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32` and add it to .env"
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must decode to exactly 32 bytes, got ${key.length}. Generate one with: openssl rand -base64 32`
    );
  }
  return key;
}

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
}

export function encryptSecret(plaintext: string): EncryptedPayload {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptSecret(payload: EncryptedPayload): string {
  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/** Last 4 chars for display only, e.g. "sk-...ab12". Never derive the full key from this. */
export function lastFour(secret: string): string {
  return secret.slice(-4);
}

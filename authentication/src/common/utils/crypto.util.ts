import * as crypto from 'crypto';

/**
 * Bộ mã hóa đối xứng AES-256-GCM dùng chung cho các secrets cần persist (TOTP secret, OAuth token...).
 *
 * - Khóa đối xứng được dẫn xuất từ một secret cấu hình (JWT_SECRET / MFA_ENCRYPTION_KEY) bằng SHA-256.
 * - Định dạng output: iv(12) | authTag(16) | ciphertext.
 * - GCM cung cấp xác thực chống giả mạo (authenticated encryption).
 */
export class AesGcmCipher {
  private readonly key: Buffer;

  constructor(secret: string) {
    if (!secret) {
      throw new Error('AesGcmCipher yêu cầu một secret dẫn xuất khóa không rỗng');
    }
    this.key = crypto.createHash('sha256').update(secret).digest(); // 32 bytes
  }

  encrypt(plainText: string): Buffer {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]);
  }

  decrypt(payload: Buffer): string {
    const iv = payload.subarray(0, 12);
    const authTag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }
}

/**
 * Băm SHA-256 hex (dùng cho recovery code, so sánh an toàn).
 */
export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * So sánh chuỗi hash an toàn theo thời gian (chống timing attack).
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

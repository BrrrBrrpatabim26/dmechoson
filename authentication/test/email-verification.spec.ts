import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerificationService } from '../src/modules/verification/verification.service.js';
import { NumericOtpStrategy } from '../src/modules/verification/strategies/numeric-otp.strategy.js';
import { MagicLinkStrategy } from '../src/modules/verification/strategies/magic-link.strategy.js';
import { OtpExpiredException } from '../src/common/exceptions/auth.exceptions.js';

interface TokenRecord {
  id: string;
  target: string;
  purpose: string;
  tokenType: string;
  tokenHash: string;
  userId: string | null;
  consumedAt: Date | null;
  expiresAt: Date;
}

describe('Kiểm thử Email Verification (Xác minh địa chỉ email)', () => {
  let store: TokenRecord[];
  let tokenRepo: Record<string, ReturnType<typeof vi.fn>>;
  let mailSender: { sendMail: ReturnType<typeof vi.fn> };
  let magicLinkStrategy: MagicLinkStrategy;
  let service: VerificationService;

  const rawToken = 'unit-test-email-verification-token-abcdef';

  beforeEach(() => {
    store = [];
    tokenRepo = {
      create: vi.fn(async (t: Omit<TokenRecord, 'id' | 'consumedAt'>) => {
        store.push({ id: `vt-${store.length + 1}`, consumedAt: null, ...t });
      }),
      revokeAllForTarget: vi.fn(async (target: string, purpose: string) => {
        store
          .filter((t) => t.target === target && t.purpose === purpose && !t.consumedAt)
          .forEach((t) => (t.consumedAt = new Date()));
      }),
      findByTokenHash: vi.fn(async (hash: string) =>
        store.find((t) => t.tokenHash === hash && !t.consumedAt && t.expiresAt > new Date()) ?? null,
      ),
      consume: vi.fn(async (id: string) => {
        const rec = store.find((t) => t.id === id);
        if (rec) rec.consumedAt = new Date();
      }),
    };

    mailSender = { sendMail: vi.fn().mockResolvedValue({ success: true }) };
    const numericOtpStrategy = new NumericOtpStrategy();
    magicLinkStrategy = new MagicLinkStrategy();

    service = new VerificationService(
      tokenRepo as never,
      mailSender as never,
      numericOtpStrategy,
      magicLinkStrategy,
    );
  });

  it('sendVerificationEmail: lưu token purpose=verify_email (SHA-256) và gửi mail', async () => {
    vi.spyOn(magicLinkStrategy, 'generate').mockReturnValue({
      rawToken,
      tokenHash: magicLinkStrategy.hashToken(rawToken),
      expiresAt: new Date(Date.now() + 86400000),
    });

    const result = await service.sendVerificationEmail(
      'User@Example.com',
      'user-123',
      'http://localhost:3000',
    );

    expect(result.target).toBe('user@example.com');
    expect(result.expiresInSeconds).toBe(86400);
    expect(store).toHaveLength(1);
    expect(store[0].purpose).toBe('verify_email');
    expect(store[0].userId).toBe('user-123');
    // Không bao giờ lưu token thô
    expect(store[0].tokenHash).not.toContain(rawToken);
    expect(mailSender.sendMail).toHaveBeenCalledTimes(1);
  });

  it('verifyEmailToken: token hợp lệ -> trả về email và đánh dấu token đã dùng (chống replay)', async () => {
    const hash = magicLinkStrategy.hashToken(rawToken);
    store.push({
      id: 'vt-1',
      target: 'user@example.com',
      purpose: 'verify_email',
      tokenType: 'magic_link',
      tokenHash: hash,
      userId: 'user-123',
      consumedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
    });

    const result = await service.verifyEmailToken(rawToken);

    expect(result.valid).toBe(true);
    expect(result.email).toBe('user@example.com');
    expect(tokenRepo.consume).toHaveBeenCalledWith('vt-1');

    // Dùng lại lần 2 phải thất bại
    await expect(service.verifyEmailToken(rawToken)).rejects.toThrow(OtpExpiredException);
  });

  it('verifyEmailToken: token không tồn tại -> ném OtpExpiredException', async () => {
    await expect(service.verifyEmailToken('nonexistent-token')).rejects.toThrow(OtpExpiredException);
  });
});

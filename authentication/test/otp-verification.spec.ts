import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConsoleMailSenderStrategy } from '../src/modules/notification/strategies/console-mail.strategy.js';
import { SmtpMailSenderStrategy } from '../src/modules/notification/strategies/smtp-mail.strategy.js';
import { MailSenderService } from '../src/modules/notification/mail-sender.service.js';
import { NumericOtpStrategy } from '../src/modules/verification/strategies/numeric-otp.strategy.js';
import { MagicLinkStrategy } from '../src/modules/verification/strategies/magic-link.strategy.js';
import { VerificationService } from '../src/modules/verification/verification.service.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import {
  AuthMethodDisabledException,
  IdentityAlreadyLinkedException,
  OtpExpiredException,
  OtpInvalidException,
  OtpMaxAttemptsExceededException,
} from '../src/common/exceptions/auth.exceptions.js';

describe('Kiểm thử Phân hệ Xác thực Đa hình & Đa Phương thức (Polymorphic Mail, OTP, Magic Link & Account Linking)', () => {
  describe('1. Kiểm thử Đa hình Mail Sender (Console Strategy vs SMTP Strategy)', () => {
    it('ConsoleMailSenderStrategy: Ghi log console thành công, trả về messageId hợp lệ', async () => {
      const strategy = new ConsoleMailSenderStrategy();
      const result = await strategy.sendMail({
        to: 'user@example.com',
        subject: 'Mã xác thực OTP',
        text: 'Mã của bạn là 123456',
      });

      expect(strategy.name).toBe('console');
      expect(result.success).toBe(true);
      expect(result.messageId).toContain('console-msg-');
    });

    it('MailSenderService: Tự động chọn Console Strategy theo cấu hình mail.strategy = "console"', async () => {
      const mockConfigService = {
        get: vi.fn((key: string) => {
          if (key === 'mail.strategy') return 'console';
          if (key === 'mail.from') return 'noreply@agent-cloud.io';
          return null;
        }),
      };

      const consoleStrategy = new ConsoleMailSenderStrategy();
      const smtpStrategy = new SmtpMailSenderStrategy(mockConfigService as any);

      const mailService = new MailSenderService(
        mockConfigService as any,
        consoleStrategy,
        smtpStrategy,
      );

      expect(mailService.name).toBe('console');

      const result = await mailService.sendMail({
        to: 'test@agent-cloud.io',
        subject: 'Test Dynamic Mail',
        text: 'Nội dung test',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('2. Kiểm thử Đa hình Sinh Mã OTP & Token (Numeric OTP vs Magic Link)', () => {
    const numericOtp = new NumericOtpStrategy();
    const magicLink = new MagicLinkStrategy();

    it('NumericOtpStrategy: Sinh mã đúng 6 chữ số, băm SHA-256 an toàn và đối soát chính xác', () => {
      const { rawToken, tokenHash, expiresAt } = numericOtp.generate(5);

      expect(rawToken).toMatch(/^\d{6}$/);
      expect(tokenHash).toHaveLength(64); // SHA-256 hex 64 ký tự
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Đúng mã -> verify true
      expect(numericOtp.verify(rawToken, tokenHash)).toBe(true);

      // Sai mã -> verify false
      expect(numericOtp.verify('000000', tokenHash)).toBe(false);
      expect(numericOtp.verify('999999', tokenHash)).toBe(false);
    });

    it('MagicLinkStrategy: Sinh token 32 bytes (Base64URL), băm SHA-256 và đối soát URL an toàn', () => {
      const { rawToken, tokenHash, expiresAt } = magicLink.generate(15);

      expect(rawToken.length).toBeGreaterThan(40);
      expect(tokenHash).toHaveLength(64);
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Đối soát token
      expect(magicLink.verify(rawToken, tokenHash)).toBe(true);
      expect(magicLink.verify('fake-token-abc', tokenHash)).toBe(false);
    });
  });

  describe('3. Kiểm thử Nghiệp vụ VerificationService (Vòng đời OTP & Magic Link)', () => {
    let mockTokenRepo: any;
    let mockMailSender: any;
    let numericStrategy: NumericOtpStrategy;
    let magicLinkStrategy: MagicLinkStrategy;
    let verificationService: VerificationService;

    beforeEach(() => {
      mockTokenRepo = {
        revokeAllForTarget: vi.fn().mockResolvedValue(undefined),
        create: vi.fn().mockResolvedValue({ id: 'token-uuid' }),
        findActiveByTarget: vi.fn(),
        findByTokenHash: vi.fn(),
        incrementAttempts: vi.fn().mockResolvedValue(1),
        consume: vi.fn().mockResolvedValue(undefined),
      };

      mockMailSender = {
        sendMail: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-1' }),
      };

      numericStrategy = new NumericOtpStrategy();
      magicLinkStrategy = new MagicLinkStrategy();

      verificationService = new VerificationService(
        mockTokenRepo,
        mockMailSender,
        numericStrategy,
        magicLinkStrategy,
      );
    });

    it('sendOtp: Hủy các token cũ, lưu token băm vào repo và gửi email chứa mã OTP', async () => {
      const result = await verificationService.sendOtp('user@agent-cloud.io', 'email', 'login');

      expect(mockTokenRepo.revokeAllForTarget).toHaveBeenCalledWith('user@agent-cloud.io', 'login');
      expect(mockTokenRepo.create).toHaveBeenCalled();
      expect(mockMailSender.sendMail).toHaveBeenCalled();
      expect(result.expiresInSeconds).toBe(300);
      expect(result.target).toBe('user@agent-cloud.io');
    });

    it('verifyOtp: Thành công -> đánh dấu consume để chống Replay Attack', async () => {
      const target = 'user@agent-cloud.io';
      const otp = '849201';
      const tokenHash = numericStrategy.hashToken(otp);

      mockTokenRepo.findActiveByTarget.mockResolvedValue({
        id: 'tok-1',
        target,
        tokenHash,
        attempts: 0,
        maxAttempts: 5,
        userId: 'user-uuid-1',
      });

      const verifyResult = await verificationService.verifyOtp(target, otp, 'login');

      expect(verifyResult.valid).toBe(true);
      expect(mockTokenRepo.consume).toHaveBeenCalledWith('tok-1');
    });

    it('verifyOtp: Sai OTP -> Tăng attempts và ném OtpInvalidException kèm số lần còn lại', async () => {
      const target = 'user@agent-cloud.io';
      const tokenHash = numericStrategy.hashToken('849201');

      mockTokenRepo.findActiveByTarget.mockResolvedValue({
        id: 'tok-1',
        target,
        tokenHash,
        attempts: 1,
        maxAttempts: 5,
      });
      mockTokenRepo.incrementAttempts.mockResolvedValue(2);

      await expect(
        verificationService.verifyOtp(target, '000000', 'login'),
      ).rejects.toThrow(OtpInvalidException);

      expect(mockTokenRepo.incrementAttempts).toHaveBeenCalledWith('tok-1');
    });

    it('verifyOtp: Sai quá 5 lần -> Hủy token và ném OtpMaxAttemptsExceededException', async () => {
      const target = 'user@agent-cloud.io';
      const tokenHash = numericStrategy.hashToken('849201');

      mockTokenRepo.findActiveByTarget.mockResolvedValue({
        id: 'tok-1',
        target,
        tokenHash,
        attempts: 4,
        maxAttempts: 5,
      });
      mockTokenRepo.incrementAttempts.mockResolvedValue(5);

      await expect(
        verificationService.verifyOtp(target, '000000', 'login'),
      ).rejects.toThrow(OtpMaxAttemptsExceededException);

      expect(mockTokenRepo.consume).toHaveBeenCalledWith('tok-1');
    });

    it('verifyOtp: Không tìm thấy hoặc OTP hết hạn -> Ném OtpExpiredException', async () => {
      mockTokenRepo.findActiveByTarget.mockResolvedValue(null);

      await expect(
        verificationService.verifyOtp('expired@agent-cloud.io', '123456', 'login'),
      ).rejects.toThrow(OtpExpiredException);
    });

    it('verifyMagicLink: Token hợp lệ -> xác thực thành công và đánh dấu đã sử dụng', async () => {
      const rawToken = 'a'.repeat(64);
      const tokenHash = magicLinkStrategy.hashToken(rawToken);

      mockTokenRepo.findByTokenHash.mockResolvedValue({
        id: 'magic-tok-1',
        target: 'magic@agent-cloud.io',
        userId: 'user-uuid-magic',
      });

      const result = await verificationService.verifyMagicLink(rawToken);

      expect(mockTokenRepo.findByTokenHash).toHaveBeenCalledWith(tokenHash);
      expect(result.valid).toBe(true);
      expect(result.email).toBe('magic@agent-cloud.io');
      expect(mockTokenRepo.consume).toHaveBeenCalledWith('magic-tok-1');
    });
  });

  describe('4. Kiểm thử Bật/Tắt Linh hoạt Phương thức Xác thực (Configurable Auth Methods)', () => {
    it('Chỉ bật [password]: Cố gắng dùng OTP sẽ bị chặn bởi AuthMethodDisabledException', async () => {
      const mockConfigService = {
        get: vi.fn((key: string) => {
          if (key === 'auth.enabledMethods') return ['password'];
          return null;
        }),
      };

      const authService = new AuthService(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        mockConfigService as any,
      );

      expect(authService.getEnabledMethods()).toEqual(['password']);

      // Gửi OTP sẽ bị từ chối
      await expect(
        authService.sendOtp({ target: 'user@test.com', channel: 'email', purpose: 'login' }),
      ).rejects.toThrow(AuthMethodDisabledException);
    });

    it('Chỉ bật [email_otp, magic_link]: Đăng nhập bằng mật khẩu sẽ bị chặn bởi AuthMethodDisabledException', async () => {
      const mockConfigService = {
        get: vi.fn((key: string) => {
          if (key === 'auth.enabledMethods') return ['email_otp', 'magic_link'];
          return null;
        }),
      };

      const authService = new AuthService(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        mockConfigService as any,
      );

      await expect(
        authService.signIn({ email: 'user@test.com', password: 'Password123' }),
      ).rejects.toThrow(AuthMethodDisabledException);

      await expect(
        authService.signUp({ email: 'user@test.com', password: 'Password123' }),
      ).rejects.toThrow(AuthMethodDisabledException);
    });
  });

  describe('5. Kiểm thử Hợp nhất Danh tính vào 1 Tài khoản (Account Linking / Unified Identity)', () => {
    it('Liên kết thành công Provider OAuth (Google) vào User ID hiện tại', async () => {
      const userId = 'user-unified-123';

      const mockUserRepo = {
        findById: vi.fn().mockResolvedValue({ id: userId, userName: 'John Doe' }),
      };

      const mockProviderRepo = {
        findOrCreate: vi.fn().mockResolvedValue({ id: 'provider-google-id', code: 'google' }),
      };

      const mockIdentityRepo = {
        findByProviderAndSubject: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'identity-google-uuid', userId }),
      };

      const mockAuditRepo = {
        record: vi.fn().mockResolvedValue(undefined),
      };

      const mockConfigService = {
        get: vi.fn((key: string) => {
          if (key === 'auth.enabledMethods') return ['password', 'google', 'github'];
          return null;
        }),
      };

      const authService = new AuthService(
        mockUserRepo as any,
        {} as any,
        mockProviderRepo as any,
        mockIdentityRepo as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        mockAuditRepo as any,
        {} as any,
        {} as any,
        {} as any,
        mockConfigService as any,
      );

      const result = await authService.linkIdentity(userId, {
        provider: 'google',
        providerUserId: 'google-sub-109823482734918237',
        email: 'john.doe@gmail.com',
        profile: { name: 'John Doe' },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('google');
      expect(mockIdentityRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          providerId: 'provider-google-id',
          providerUserId: 'google-sub-109823482734918237',
        }),
      );
      expect(mockAuditRepo.record).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'auth.identity.linked',
          userId,
        }),
      );
    });

    it('Chống xâm chiếm tài khoản: Ngăn chặn liên kết nếu Provider Identity đã thuộc về User khác', async () => {
      const currentUserId = 'user-current-111';
      const anotherUserId = 'user-another-999';

      const mockUserRepo = {
        findById: vi.fn().mockResolvedValue({ id: currentUserId }),
      };

      const mockProviderRepo = {
        findOrCreate: vi.fn().mockResolvedValue({ id: 'provider-github-id', code: 'github' }),
      };

      // Đã có identity này gắn với anotherUserId
      const mockIdentityRepo = {
        findByProviderAndSubject: vi.fn().mockResolvedValue({
          id: 'identity-existing-id',
          userId: anotherUserId,
        }),
      };

      const mockConfigService = {
        get: vi.fn((key: string) => {
          if (key === 'auth.enabledMethods') return ['password', 'github'];
          return null;
        }),
      };

      const authService = new AuthService(
        mockUserRepo as any,
        {} as any,
        mockProviderRepo as any,
        mockIdentityRepo as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        mockConfigService as any,
      );

      await expect(
        authService.linkIdentity(currentUserId, {
          provider: 'github',
          providerUserId: 'github-id-54321',
        }),
      ).rejects.toThrow(IdentityAlreadyLinkedException);
    });
  });
});

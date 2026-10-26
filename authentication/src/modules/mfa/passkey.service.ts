import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/server';
import { v7 as uuidv7 } from 'uuid';
import { AuthMethodDisabledException } from '../../common/exceptions/auth.exceptions.js';
import type { ClientContext, IAuthService } from '../../core/interfaces/auth-service.interface.js';
import type {
  IAuthProviderRepository,
  IIdentityRepository,
  IUserEmailRepository,
  IUserRepository,
} from '../../core/interfaces/repositories.interface.js';
import type { IPasskeyCredentialRepository } from '../../core/interfaces/passkey-repository.interface.js';
import type { IRbacService } from '../../core/interfaces/rbac.interface.js';
import type { KeyValueStore } from '../../core/interfaces/cache.interface.js';
import { INJECTION_TOKENS } from '../../core/tokens/injection.tokens.js';
import type { AuthResponseDto } from '../auth/dto/auth-response.dto.js';
import { AuthService } from '../auth/auth.service.js';

const CHALLENGE_KEY_PREFIX = 'webauthn:challenge:';
const CHALLENGE_TTL_SECONDS = 5 * 60;
const PASSKEY_PROVIDER = 'passkey';

/**
 * Dịch vụ Passkey (WebAuthn / FIDO2) dùng @simplewebauthn/server.
 *
 * - Registration: người dùng đã đăng nhập thêm passkey (khóa công khai lưu DB, private key không bao giờ rời thiết bị).
 * - Authentication: public, discover-by-email, soatch assertion và cấp cặp token JWT.
 * - Challenge luu qua KeyValueStore (in-memory hoac Redis khi ON_REDIS) co TTL -> an toan khi scale ngang.
 */
@Injectable()
export class PasskeyService {
  private readonly logger = new Logger(PasskeyService.name);

  private readonly rpName: string;
  private readonly rpId: string;
  private readonly origin: string;

  constructor(
    @Inject(INJECTION_TOKENS.PASSKEY_CREDENTIAL_REPOSITORY)
    private readonly passkeyRepo: IPasskeyCredentialRepository,

    @Inject(INJECTION_TOKENS.AUTH_PROVIDER_REPOSITORY)
    private readonly providerRepo: IAuthProviderRepository,

    @Inject(INJECTION_TOKENS.IDENTITY_REPOSITORY)
    private readonly identityRepo: IIdentityRepository,

    @Inject(INJECTION_TOKENS.USER_REPOSITORY)
    private readonly userRepo: IUserRepository,

    @Inject(INJECTION_TOKENS.USER_EMAIL_REPOSITORY)
    private readonly emailRepo: IUserEmailRepository,

    @Inject(INJECTION_TOKENS.RBAC_SERVICE)
    private readonly rbacService: IRbacService,

    @Inject(INJECTION_TOKENS.AUTH_SERVICE)
    private readonly authServiceInterface: IAuthService,

    @Inject(INJECTION_TOKENS.CACHE_STORE)
    private readonly cache: KeyValueStore,

    private readonly configService: ConfigService,
  ) {
    this.rpName = this.configService.get<string>('webauthn.rpName', 'AgentCloud');
    // rpId/origin lay tu cau hinh (env WEBAUTHN_RP_ID/WEBAUTHN_ORIGIN); khong hardcode localhost.
    this.rpId = this.configService.get<string>('webauthn.rpId') ?? '';
    this.origin = this.configService.get<string>('webauthn.origin') ?? '';
  }

  private assertPasskeyEnabled(): void {
    const enabled = this.configService.get<string[]>('auth.enabledMethods', []);
    if (!enabled.includes('*') && !enabled.includes(PASSKEY_PROVIDER)) {
      throw new AuthMethodDisabledException(PASSKEY_PROVIDER);
    }
  }

  /**
   * Kiểm tra passkey có khả dụng không (không ném lỗi) - phục vụ endpoint capabilities.
   */
  async isPasskeySupported(): Promise<boolean> {
    try {
      this.assertPasskeyEnabled();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * B1 (Registration): Tạo WebAuthn creation options cho user đang đăng nhập.
   */
  async startRegistration(userId: string, userName: string, deviceName?: string): Promise<Record<string, unknown>> {
    this.assertPasskeyEnabled();

    const existing = await this.passkeyRepo.findByUserId(userId);
    const user = await this.userRepo.findById(userId);

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpId,
      userName,
      userDisplayName: user?.userName || userName,
      attestationType: 'none',
      excludeCredentials: existing.map((c) => ({
        id: c.credentialId.toString('base64url'),
        type: 'public-key' as const,
        transports: (c.transports || []) as string[],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    await this.storeChallenge(options.challenge);
    this.logger.log(`Tạo passkey registration options cho user [${userId}] (device: ${deviceName || 'unknown'})`);

    return { ...options, challengeId: options.challenge };
  }

  /**
   * B2 (Registration): Xác thực attestation response, lưu credential + MFA factor type=passkey.
   */
  async completeRegistration(
    userId: string,
    challengeId: string,
    response: RegistrationResponseJSON,
    deviceName?: string,
  ): Promise<{ success: boolean; credentialId: string; message: string }> {
    this.assertPasskeyEnabled();

    const expectedChallenge = await this.consumeChallenge(challengeId);
    const result = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpId,
    });

    if (!result.verified || !result.registrationInfo) {
      throw new BadRequestException('Không thể xác minh passkey registration response');
    }

    const { credential, aaguid, credentialBackedUp } = result.registrationInfo;

    // Passkey cần identity để gắn credential (mỗi user một identity 'passkey')
    const provider = await this.providerRepo.findOrCreate(
      PASSKEY_PROVIDER,
      'webauthn',
      'Passkey (WebAuthn) Authentication Provider',
    );
    let identity = await this.identityRepo.findByProviderAndSubject(provider.id, userId);
    if (!identity) {
      identity = await this.identityRepo.create({
        id: uuidv7(),
        userId,
        providerId: provider.id,
        providerUserId: userId,
        email: null,
        emailVerified: false,
        lastLoginAt: new Date(),
      });
    }

    await this.passkeyRepo.create({
      id: uuidv7(),
      identityId: identity.id,
      userId,
      credentialId: Buffer.from(credential.id, 'base64url'),
      publicKey: Buffer.from(credential.publicKey),
      signCount: String(credential.counter ?? 0),
      transports: response.response.transports || null,
      aaguid: aaguid || null,
      backedUp: credentialBackedUp ?? null,
      deviceName: deviceName || null,
      lastUsedAt: new Date(),
    });

    this.logger.log(`User [${userId}] đã đăng ký passkey mới [${credential.id.slice(0, 12)}...]`);
    return {
      success: true,
      credentialId: credential.id,
      message: 'Đăng ký passkey thành công',
    };
  }

  /**
   * B1 (Authentication): Public - tạo assertion options theo email tài khoản.
   */
  async startAuthentication(email: string): Promise<Record<string, unknown>> {
    this.assertPasskeyEnabled();

    const normalizedEmail = email.trim().toLowerCase();
    const emailRecord = await this.emailRepo.findByEmail(normalizedEmail);
    if (!emailRecord?.user) {
      // Chống user enumeration: trả về options "rỗng" với allowCredentials trống
      const options = await generateAuthenticationOptions({
        rpID: this.rpId,
        userVerification: 'preferred',
      });
      await this.storeChallenge(options.challenge);
      return { ...options, challengeId: options.challenge };
    }

    const credentials = await this.passkeyRepo.findByUserId(emailRecord.user.id);
    const options = await generateAuthenticationOptions({
      rpID: this.rpId,
      allowCredentials: credentials.map((c) => ({
        id: c.credentialId.toString('base64url'),
        type: 'public-key' as const,
        transports: (c.transports || []) as string[],
      })),
      userVerification: 'preferred',
    });

    await this.storeChallenge(options.challenge);
    return { ...options, challengeId: options.challenge };
  }

  /**
   * B2 (Authentication): Xác minh assertion, cập nhật signCount, cấp cặp token JWT.
   */
  async completeAuthentication(
    challengeId: string,
    response: AuthenticationResponseJSON,
    context?: ClientContext,
  ): Promise<AuthResponseDto> {
    this.assertPasskeyEnabled();

    const expectedChallenge = await this.consumeChallenge(challengeId);
    const credentialIdBuf = Buffer.from(response.rawId, 'base64url');
    const stored = await this.passkeyRepo.findByCredentialId(credentialIdBuf);
    if (!stored) {
      throw new NotFoundException('Passkey credential không tồn tại trong hệ thống');
    }

    const result = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpId,
      credential: {
        id: stored.credentialId.toString('base64url'),
        publicKey: new Uint8Array(stored.publicKey),
        counter: Number(stored.signCount || 0),
        transports: stored.transports || [],
      },
    });

    if (!result.verified) {
      throw new BadRequestException('Không thể xác minh passkey assertion');
    }

    const user = await this.userRepo.findById(stored.userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng tương ứng');
    }
    if (user.status !== 'active') {
      throw new AuthMethodDisabledException('passkey');
    }

    const identities = await this.identityRepo.findByUserId(stored.userId);
    const identity = identities.find((i) => i.id === stored.identityId);
    if (!identity) {
      throw new NotFoundException('Không tìm thấy identity của passkey');
    }

    await this.passkeyRepo.updateSignCount(stored.id, String(result.authenticationInfo.newCounter), new Date());
    await this.userRepo.updateLastLogin(user.id);
    await this.identityRepo.updateLastLogin(identity.id);

    const accessControl = await this.rbacService.getUserAccess(user.id);
    const primaryEmail = user.emails?.find((e) => e.isPrimary)?.email;
    const emailForToken = primaryEmail || (await this.resolveFallbackEmail(user.id));

    const auth = this.authServiceInterface as unknown as AuthService;
    return auth.issueSessionAndTokens(
      user,
      identity,
      emailForToken,
      context,
      'auth.passkey.signin.success',
      accessControl,
    );
  }

  private async resolveFallbackEmail(userId: string): Promise<string> {
    const emails = await this.emailRepo.findByUserId(userId);
    return emails[0]?.email || `${userId}@passkey.agentcloud.local`;
  }

  private async storeChallenge(challenge: string): Promise<void> {
    await this.cache.set(`${CHALLENGE_KEY_PREFIX}${challenge}`, challenge, CHALLENGE_TTL_SECONDS);
  }

  private async consumeChallenge(challengeId: string): Promise<string> {
    const key = `${CHALLENGE_KEY_PREFIX}${challengeId}`;
    const challenge = await this.cache.get(key);
    await this.cache.del(key);

    if (!challenge) {
      throw new BadRequestException('Challenge WebAuthn không hợp lệ hoặc đã hết hạn. Vui lòng bắt đầu lại.');
    }
    return challenge;
  }
}

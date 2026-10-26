import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AesGcmCipher } from '../common/utils/crypto.util.js';
import type { IOAuthTokenRepository, OAuthTokenInput } from '../core/interfaces/oauth-token.interface.js';
import { OAuthToken } from '../entities/oauth-token.entity.js';

@Injectable()
export class OAuthTokenRepository implements IOAuthTokenRepository {
  private readonly cipher: AesGcmCipher;

  constructor(
    @InjectRepository(OAuthToken)
    private readonly repo: Repository<OAuthToken>,
    configService: ConfigService,
  ) {
    // Uu tien khoa chuyen dung MFA_ENCRYPTION_KEY; fallback la JWT_SECRET (bat buoc, da validate).
    // Khong dung hang so yeu (AGENTS 1.2 #3/#4). Ma hoa OAuth token = AES-256-GCM.
    const secret =
      configService.get<string>('mfa.encryptionKey') ||
      configService.getOrThrow<string>('jwt.secret');
    this.cipher = new AesGcmCipher(secret);
  }

  async upsert(input: OAuthTokenInput): Promise<OAuthToken> {
    const encryptedAccess = this.cipher.encrypt(input.accessToken);
    const encryptedRefresh = input.refreshToken ? this.cipher.encrypt(input.refreshToken) : null;

    const existing = await this.repo.findOne({ where: { identityId: input.identityId } });

    if (existing) {
      existing.accessTokenEnc = encryptedAccess;
      existing.refreshTokenEnc = encryptedRefresh;
      existing.scopes = input.scopes || [];
      existing.expiresAt = input.expiresAt ?? null;
      return this.repo.save(existing);
    }

    const created = this.repo.create({
      identityId: input.identityId,
      accessTokenEnc: encryptedAccess,
      refreshTokenEnc: encryptedRefresh,
      scopes: input.scopes || [],
      expiresAt: input.expiresAt ?? null,
    });
    return this.repo.save(created);
  }
}

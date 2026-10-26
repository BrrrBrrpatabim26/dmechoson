import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import type { IRefreshTokenRepository } from '../core/interfaces/repositories.interface.js';
import { RefreshToken } from '../entities/refresh-token.entity.js';

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
  ) {}

  async create(token: Partial<RefreshToken>): Promise<RefreshToken> {
    const newToken = this.repo.create({
      id: token.id || uuidv7(),
      sessionId: token.sessionId!,
      parentId: token.parentId ?? null,
      tokenHash: token.tokenHash!,
      expiresAt: token.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      usedAt: null,
      revokedAt: null,
      ...token,
    });
    return this.repo.save(newToken);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.repo.findOne({ where: { tokenHash } });
  }

  async markAsUsed(id: string): Promise<void> {
    await this.repo.update(id, { usedAt: new Date() });
  }

  async revoke(id: string): Promise<void> {
    await this.repo.update(id, { revokedAt: new Date() });
  }

  async revokeSessionChain(sessionId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('session_id = :sessionId', { sessionId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }
}

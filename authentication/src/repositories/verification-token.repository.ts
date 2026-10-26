import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import type { IVerificationTokenRepository } from '../core/interfaces/verification-token.interface.js';
import { VerificationToken } from '../entities/verification-token.entity.js';

@Injectable()
export class VerificationTokenRepository implements IVerificationTokenRepository {
  constructor(
    @InjectRepository(VerificationToken)
    private readonly repo: Repository<VerificationToken>,
  ) {}

  async create(token: Partial<VerificationToken>): Promise<VerificationToken> {
    const newToken = this.repo.create({
      id: token.id || uuidv7(),
      userId: token.userId ?? null,
      purpose: token.purpose || 'signin',
      channel: token.channel || 'email',
      target: token.target!,
      tokenType: token.tokenType || 'otp',
      tokenHash: token.tokenHash!,
      attempts: 0,
      maxAttempts: token.maxAttempts || 5,
      expiresAt: token.expiresAt || new Date(Date.now() + 5 * 60 * 1000),
      consumedAt: null,
      ip: token.ip ?? null,
    });
    return this.repo.save(newToken);
  }

  async findActiveByTarget(
    target: string,
    purpose: string,
    tokenType: string,
  ): Promise<VerificationToken | null> {
    return this.repo.findOne({
      where: {
        target,
        purpose,
        tokenType,
        consumedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<VerificationToken | null> {
    return this.repo.findOne({
      where: {
        tokenHash,
        consumedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async incrementAttempts(id: string): Promise<number> {
    await this.repo
      .createQueryBuilder()
      .update(VerificationToken)
      .set({ attempts: () => 'attempts + 1' })
      .where('id = :id', { id })
      .execute();

    const record = await this.repo.findOne({ where: { id }, select: { attempts: true } });
    return record?.attempts || 0;
  }

  async consume(id: string): Promise<void> {
    await this.repo.update(id, { consumedAt: new Date() });
  }

  async revokeAllForTarget(target: string, purpose: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(VerificationToken)
      .set({ consumedAt: new Date() })
      .where('target = :target', { target })
      .andWhere('purpose = :purpose', { purpose })
      .andWhere('consumed_at IS NULL')
      .execute();
  }
}

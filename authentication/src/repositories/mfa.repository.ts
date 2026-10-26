import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import type { IMfaFactorRepository, IMfaRecoveryCodeRepository } from '../core/interfaces/mfa-repository.interface.js';
import { MfaFactor } from '../entities/mfa-factor.entity.js';
import { MfaRecoveryCode } from '../entities/mfa-recovery-code.entity.js';

@Injectable()
export class MfaFactorRepository implements IMfaFactorRepository {
  constructor(
    @InjectRepository(MfaFactor)
    private readonly repo: Repository<MfaFactor>,
  ) {}

  async create(factor: Partial<MfaFactor>): Promise<MfaFactor> {
    const entity = this.repo.create({
      id: factor.id || uuidv7(),
      userId: factor.userId!,
      type: factor.type!,
      label: factor.label ?? null,
      secretEnc: factor.secretEnc ?? null,
      userPhoneId: factor.userPhoneId ?? null,
      userEmailId: factor.userEmailId ?? null,
      passkeyCredentialId: factor.passkeyCredentialId ?? null,
      isEnabled: factor.isEnabled ?? false,
      verifiedAt: factor.verifiedAt ?? null,
      lastUsedAt: factor.lastUsedAt ?? null,
    });
    return this.repo.save(entity);
  }

  async findTotpByUserId(userId: string): Promise<MfaFactor | null> {
    return this.repo.findOne({ where: { userId, type: 'totp' } });
  }

  async findEnabledFactorsByUserId(userId: string): Promise<MfaFactor[]> {
    return this.repo.find({ where: { userId, isEnabled: true } });
  }

  async findById(id: string): Promise<MfaFactor | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(factor: Partial<MfaFactor> & { id: string }): Promise<void> {
    const { id, ...partial } = factor;
    await this.repo.update(id, partial);
  }

  async disable(id: string): Promise<void> {
    await this.repo.update(id, { isEnabled: false });
  }
}

@Injectable()
export class MfaRecoveryCodeRepository implements IMfaRecoveryCodeRepository {
  constructor(
    @InjectRepository(MfaRecoveryCode)
    private readonly repo: Repository<MfaRecoveryCode>,
  ) {}

  async deleteAllForUser(userId: string): Promise<void> {
    await this.repo.delete({ userId });
  }

  async createMany(codes: Partial<MfaRecoveryCode>[]): Promise<void> {
    const entities = codes.map((c) =>
      this.repo.create({
        id: c.id || uuidv7(),
        userId: c.userId!,
        codeHash: c.codeHash!,
        usedAt: c.usedAt ?? null,
      }),
    );
    await this.repo.save(entities);
  }

  async findUnusedByUserId(userId: string): Promise<MfaRecoveryCode[]> {
    return this.repo.find({ where: { userId, usedAt: IsNull() } });
  }

  async markUsed(id: string): Promise<void> {
    await this.repo.update(id, { usedAt: new Date() });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IPasswordCredentialRepository } from '../core/interfaces/repositories.interface.js';
import { PasswordCredential } from '../entities/password-credential.entity.js';

@Injectable()
export class PasswordCredentialRepository implements IPasswordCredentialRepository {
  constructor(
    @InjectRepository(PasswordCredential)
    private readonly repo: Repository<PasswordCredential>,
  ) {}

  async findByIdentityId(identityId: string): Promise<PasswordCredential | null> {
    return this.repo.findOne({ where: { identityId } });
  }

  async create(credential: Partial<PasswordCredential>): Promise<PasswordCredential> {
    const newCred = this.repo.create({
      identityId: credential.identityId,
      passwordHash: credential.passwordHash,
      hashAlgorithm: credential.hashAlgorithm || 'argon2id',
      passwordChangedAt: new Date(),
      mustChange: credential.mustChange ?? false,
      failedAttempts: 0,
      lockedUntil: null,
      ...credential,
    });
    return this.repo.save(newCred);
  }

  async updatePassword(
    identityId: string,
    passwordHash: string,
    hashAlgorithm: string,
  ): Promise<void> {
    await this.repo.update(identityId, {
      passwordHash,
      hashAlgorithm,
      passwordChangedAt: new Date(),
      failedAttempts: 0,
      lockedUntil: null,
      mustChange: false,
    });
  }

  async recordFailedAttempt(
    identityId: string,
    maxAttempts: number = 5,
    lockDurationMinutes: number = 15,
  ): Promise<{ failedAttempts: number; isLocked: boolean; lockedUntil: Date | null }> {
    // Toi uu A3: tang failed_attempts atomic phia DB (failed_attempts + 1) -> chong
    // lost-update khi nhieu request sai dong thoi; doc lai gia tri chinh xac sau UPDATE.
    await this.repo
      .createQueryBuilder()
      .update(PasswordCredential)
      .set({ failedAttempts: () => 'failed_attempts + 1' })
      .where('identity_id = :identityId', { identityId })
      .execute();

    const cred = await this.findByIdentityId(identityId);
    if (!cred) {
      return { failedAttempts: 0, isLocked: false, lockedUntil: null };
    }
    const failedAttempts = cred.failedAttempts;

    if (failedAttempts >= maxAttempts) {
      const lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
      await this.repo.update({ identityId }, { lockedUntil });
      return { failedAttempts, isLocked: true, lockedUntil };
    }

    return { failedAttempts, isLocked: false, lockedUntil: null };
  }

  async resetFailedAttempts(identityId: string): Promise<void> {
    await this.repo.update(identityId, {
      failedAttempts: 0,
      lockedUntil: null,
    });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import type { IIdentityRepository } from '../core/interfaces/repositories.interface.js';
import { UserIdentity } from '../entities/identity.entity.js';

@Injectable()
export class IdentityRepository implements IIdentityRepository {
  constructor(
    @InjectRepository(UserIdentity)
    private readonly repo: Repository<UserIdentity>,
  ) {}

  async findByProviderAndSubject(
    providerId: string,
    providerUserId: string,
  ): Promise<UserIdentity | null> {
    return this.repo.findOne({
      where: { providerId, providerUserId },
      relations: {
        user: true,
        provider: true,
        passwordCredential: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<UserIdentity[]> {
    return this.repo.find({
      where: { userId },
      relations: {
        provider: true,
        passwordCredential: true,
      },
    });
  }

  async create(identity: Partial<UserIdentity>): Promise<UserIdentity> {
    const newIdentity = this.repo.create({
      id: identity.id || uuidv7(),
      userId: identity.userId,
      providerId: identity.providerId,
      providerUserId: identity.providerUserId,
      email: identity.email ?? null,
      emailVerified: identity.emailVerified ?? false,
      profile: identity.profile ?? {},
      ...identity,
    });
    return this.repo.save(newIdentity);
  }

  async updateLastLogin(id: string, date: Date = new Date()): Promise<void> {
    await this.repo.update(id, { lastLoginAt: date });
  }
}

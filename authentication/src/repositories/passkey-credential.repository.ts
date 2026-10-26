import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import type { IPasskeyCredentialRepository } from '../core/interfaces/passkey-repository.interface.js';
import { PasskeyCredential } from '../entities/passkey-credential.entity.js';

@Injectable()
export class PasskeyCredentialRepository implements IPasskeyCredentialRepository {
  constructor(
    @InjectRepository(PasskeyCredential)
    private readonly repo: Repository<PasskeyCredential>,
  ) {}

  async create(credential: Partial<PasskeyCredential>): Promise<PasskeyCredential> {
    const entity = this.repo.create({
      id: credential.id || uuidv7(),
      identityId: credential.identityId!,
      userId: credential.userId!,
      credentialId: credential.credentialId!,
      publicKey: credential.publicKey!,
      signCount: credential.signCount ?? '0',
      transports: credential.transports ?? null,
      aaguid: credential.aaguid ?? null,
      backedUp: credential.backedUp ?? null,
      deviceName: credential.deviceName ?? null,
      lastUsedAt: credential.lastUsedAt ?? null,
    });
    return this.repo.save(entity);
  }

  async findByCredentialId(credentialId: Buffer): Promise<PasskeyCredential | null> {
    return this.repo.findOne({ where: { credentialId } });
  }

  async findByUserId(userId: string): Promise<PasskeyCredential[]> {
    return this.repo.find({ where: { userId } });
  }

  async updateSignCount(id: string, signCount: string, lastUsedAt: Date): Promise<void> {
    await this.repo.update(id, { signCount, lastUsedAt });
  }
}

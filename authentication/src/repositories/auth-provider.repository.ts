import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import type { IAuthProviderRepository } from '../core/interfaces/repositories.interface.js';
import { AuthProvider } from '../entities/auth-provider.entity.js';

@Injectable()
export class AuthProviderRepository implements IAuthProviderRepository {
  constructor(
    @InjectRepository(AuthProvider)
    private readonly repo: Repository<AuthProvider>,
  ) {}

  async findByCode(code: string): Promise<AuthProvider | null> {
    return this.repo.findOne({ where: { code } });
  }

  async findOrCreate(code: string, kind: string, displayName: string): Promise<AuthProvider> {
    const existing = await this.findByCode(code);
    if (existing) {
      return existing;
    }

    const provider = this.repo.create({
      id: uuidv7(),
      code,
      kind,
      displayName,
      isEnabled: true,
      config: {},
    });

    return this.repo.save(provider);
  }
}

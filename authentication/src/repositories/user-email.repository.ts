import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import type { IUserEmailRepository } from '../core/interfaces/repositories.interface.js';
import { UserEmail } from '../entities/user-email.entity.js';

@Injectable()
export class UserEmailRepository implements IUserEmailRepository {
  constructor(
    @InjectRepository(UserEmail)
    private readonly repo: Repository<UserEmail>,
  ) {}

  async findByEmail(email: string): Promise<UserEmail | null> {
    const normalized = email.trim().toLowerCase();
    return this.repo.findOne({
      where: { email: normalized },
      relations: { user: true },
    });
  }

  async findByUserId(userId: string): Promise<UserEmail[]> {
    return this.repo.find({
      where: { userId },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  async create(userEmail: Partial<UserEmail>): Promise<UserEmail> {
    const newEmail = this.repo.create({
      id: userEmail.id || uuidv7(),
      email: userEmail.email!.trim().toLowerCase(),
      userId: userEmail.userId,
      isPrimary: userEmail.isPrimary ?? true,
      verifiedAt: userEmail.verifiedAt ?? null,
      ...userEmail,
    });
    return this.repo.save(newEmail);
  }

  async markAsVerified(id: string): Promise<void> {
    await this.repo.update(id, { verifiedAt: new Date() });
  }
}

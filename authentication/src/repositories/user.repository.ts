import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import type { IUserRepository, UserUpdateInput } from '../core/interfaces/repositories.interface.js';
import { UserEntity } from '../entities/user.entity.js';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<UserEntity | null> {
    // Toi uu A4: chi load emails (du dung cho moi luong: refreshToken/OAuth/passkey/doc primary email).
    // Bo over-fetch phoneNumbers (khong noi doc user.phoneNumbers trong src).
    return this.repo.findOne({
      where: { id },
      relations: {
        emails: true,
      },
    });
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.repo.findOne({
      where: { username: username.trim().toLowerCase() },
      relations: { emails: true },
    });
  }

  async create(user: Partial<UserEntity>): Promise<UserEntity> {
    const newUser = this.repo.create({
      id: user.id || uuidv7(),
      userName: user.userName || user.username || 'User',
      username: user.username ?? null,
      avatarUrl: user.avatarUrl ?? null,
      locale: user.locale || 'vi',
      timezone: user.timezone || 'Asia/Ho_Chi_Minh',
      status: user.status || 'active',
      ...user,
    });
    return this.repo.save(newUser);
  }

  async update(id: string, partial: UserUpdateInput): Promise<void> {
    await this.repo.update(id, partial as any);
  }

  async updateLastLogin(id: string, date: Date = new Date()): Promise<void> {
    await this.repo.update(id, { lastLoginAt: date });
  }
}

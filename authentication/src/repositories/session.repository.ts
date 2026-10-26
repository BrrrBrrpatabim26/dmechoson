import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import type { ISessionRepository } from '../core/interfaces/repositories.interface.js';
import { Session } from '../entities/session.entity.js';

@Injectable()
export class SessionRepository implements ISessionRepository {
  constructor(
    @InjectRepository(Session)
    private readonly repo: Repository<Session>,
  ) {}

  async create(session: Partial<Session>): Promise<Session> {
    const newSession = this.repo.create({
      id: session.id || uuidv7(),
      userId: session.userId!,
      identityId: session.identityId ?? null,
      deviceId: session.deviceId ?? null,
      activeOrgId: session.activeOrgId ?? null,
      mfaVerifiedAt: session.mfaVerifiedAt ?? null,
      ip: session.ip ?? null,
      userAgent: session.userAgent ?? null,
      expiresAt: session.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastSeenAt: new Date(),
      revokedAt: null,
      ...session,
    });
    return this.repo.save(newSession);
  }

  async findById(id: string): Promise<Session | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findActiveById(id: string): Promise<Session | null> {
    return this.repo.findOne({
      where: {
        id,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async findActiveSessionsByUserId(userId: string): Promise<Session[]> {
    return this.repo.find({
      where: {
        userId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: {
        lastSeenAt: 'DESC',
      },
    });
  }

  async updateLastSeen(id: string): Promise<void> {
    await this.repo.update(id, { lastSeenAt: new Date() });
  }

  async revoke(id: string): Promise<void> {
    await this.repo.update(id, { revokedAt: new Date() });
  }

  async revokeAllForUser(userId: string, exceptSessionId?: string): Promise<void> {
    const query = this.repo
      .createQueryBuilder()
      .update(Session)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL');

    if (exceptSessionId) {
      query.andWhere('id != :exceptSessionId', { exceptSessionId });
    }

    await query.execute();
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import type {
  AuditLogQueryOptions,
  ILoginAuditLogRepository,
} from '../core/interfaces/repositories.interface.js';
import { LoginAuditLog } from '../entities/login-audit-log.entity.js';

@Injectable()
export class LoginAuditLogRepository implements ILoginAuditLogRepository {
  constructor(
    @InjectRepository(LoginAuditLog)
    private readonly repo: Repository<LoginAuditLog>,
  ) {}

  async record(log: Partial<LoginAuditLog>): Promise<LoginAuditLog> {
    const entry = this.repo.create({
      id: log.id || uuidv7(),
      userId: log.userId ?? null,
      identityId: log.identityId ?? null,
      providerId: log.providerId ?? null,
      eventType: log.eventType || 'auth.unknown',
      success: log.success ?? false,
      ip: log.ip ?? null,
      userAgent: log.userAgent ?? null,
      metadata: log.metadata ?? {},
    });
    return this.repo.save(entry);
  }

  async findByUserId(
    userId: string,
    options?: AuditLogQueryOptions,
  ): Promise<{ items: LoginAuditLog[]; total: number }> {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 10));
    const skip = (page - 1) * limit;

    const query = this.repo.createQueryBuilder('log').where('log.user_id = :userId', { userId });

    if (options?.status === 'SUCCESS') {
      query.andWhere('log.success = :success', { success: true });
    } else if (options?.status === 'FAILED') {
      query.andWhere('log.success = :success', { success: false });
    }

    const sortField = options?.sortBy === 'createdAt' ? 'log.created_at' : 'log.created_at';
    const sortOrder = options?.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    query.orderBy(sortField, sortOrder);

    query.skip(skip).take(limit);

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }
}


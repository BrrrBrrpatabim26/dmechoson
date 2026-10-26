import { Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';
import type { KeyValueStore } from '../../core/interfaces/cache.interface.js';

/**
 * KeyValueStore backed by Redis (kích hoạt khi ON_REDIS=true).
 * Dùng cho RBAC cache & WebAuthn challenge -> chia sẻ trạng thái giữa nhiều instance.
 */
@Injectable()
export class RedisKeyValueStore implements KeyValueStore {
  constructor(private readonly client: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}

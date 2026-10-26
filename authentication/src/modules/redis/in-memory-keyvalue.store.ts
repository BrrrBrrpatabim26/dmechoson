import { Injectable } from '@nestjs/common';
import type { KeyValueStore } from '../../core/interfaces/cache.interface.js';

interface Entry {
  value: string;
  expiresAt: number;
}

/**
 * KeyValueStore in-memory (mặc định khi ON_REDIS=false).
 * Chỉ phù hợp chạy 1 instance; khi scale ngang hãy bật Redis.
 */
@Injectable()
export class InMemoryKeyValueStore implements KeyValueStore {
  private readonly map = new Map<string, Entry>();

  async get(key: string): Promise<string | null> {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.map.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0;
    this.map.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.map.delete(key);
  }
}

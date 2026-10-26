/**
 * Hợp đồng Key-Value Store có TTL, dùng chung cho RBAC cache và WebAuthn challenge.
 *
 * Có 2 implementation được chọn tự động theo cờ ON_REDIS:
 *  - InMemoryKeyValueStore: Map + expiry (mặc định, chỉ hợp 1 instance).
 *  - RedisKeyValueStore: ioredis (chia sẻ giữa nhiều instance -> scale ngang).
 */
export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

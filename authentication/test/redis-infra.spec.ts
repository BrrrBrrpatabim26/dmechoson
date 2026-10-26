import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { InMemoryKeyValueStore } from '../src/modules/redis/in-memory-keyvalue.store.js';
import { RedisKeyValueStore } from '../src/modules/redis/redis-keyvalue.store.js';
import { RedisThrottlerStorage } from '../src/modules/redis/redis-throttler.storage.js';
import { isRedisEnabled, resolveRedisOptions } from '../src/modules/redis/redis.module.js';

/** Fake Redis client: kkv (get/set/del) + sorted-set pipeline (multi) cho sliding-window. */
function fakeRedis() {
  const store = new Map<string, { value: string; expireAt: number }>();
  const zsets = new Map<string, Array<{ member: string; score: number }>>();
  return {
    store,
    get: vi.fn(async (k: string) => {
      const e = store.get(k);
      if (!e) return null;
      if (e.expireAt && e.expireAt < Date.now()) {
        store.delete(k);
        return null;
      }
      return e.value;
    }),
    set: vi.fn(async (k: string, v: string, ...args: unknown[]) => {
      const idx = args.indexOf('EX');
      const idxPx = args.indexOf('PX');
      let expireAt = 0;
      if (idx >= 0) expireAt = Date.now() + Number(args[idx + 1]) * 1000;
      else if (idxPx >= 0) expireAt = Date.now() + Number(args[idxPx + 1]);
      store.set(k, { value: v, expireAt });
      return 'OK';
    }),
    del: vi.fn(async (k: string) => store.delete(k) as unknown as number),
    pttl: vi.fn(async (k: string) => {
      const e = store.get(k);
      if (!e || !e.expireAt) return -2;
      return Math.max(0, e.expireAt - Date.now());
    }),
    multi() {
      const queue: Array<() => unknown> = [];
      const api = {
        zremrangebyscore(k: string, min: number, max: number) {
          queue.push(() => {
            const arr = zsets.get(k) ?? [];
            const kept = arr.filter((x) => !(x.score >= min && x.score <= max));
            const removed = arr.length - kept.length;
            zsets.set(k, kept);
            return removed;
          });
          return api;
        },
        zadd(k: string, score: number, member: string) {
          queue.push(() => {
            const arr = zsets.get(k) ?? [];
            if (!arr.some((x) => x.member === member)) arr.push({ member, score });
            zsets.set(k, arr);
            return 1;
          });
          return api;
        },
        zcard(k: string) {
          queue.push(() => (zsets.get(k) ?? []).length);
          return api;
        },
        pexpire(_k: string, _ms: number) {
          queue.push(() => 1);
          return api;
        },
        pttl(k: string) {
          queue.push(() => (zsets.has(k) ? 60000 : -2));
          return api;
        },
        async exec(): Promise<[unknown, unknown][]> {
          return queue.map((fn) => [null, fn()] as [unknown, unknown]);
        },
      };
      return api;
    },
  };
}

describe('Redis infra - KeyValueStore', () => {
  it('InMemoryKeyValueStore: set/get/del + hit duoc lay ve', async () => {
    const s = new InMemoryKeyValueStore();
    await s.set('a', '1', 60);
    expect(await s.get('a')).toBe('1');
    await s.del('a');
    expect(await s.get('a')).toBeNull();
  });

  it('InMemoryKeyValueStore: het han TTL -> get tra ve null', async () => {
    vi.useFakeTimers();
    try {
      const s = new InMemoryKeyValueStore();
      await s.set('b', '2', 1); // 1 giay
      expect(await s.get('b')).toBe('2');
      vi.advanceTimersByTime(1500);
      expect(await s.get('b')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('RedisKeyValueStore: goi GET/SET(EX)/DEL len client', async () => {
    const client = fakeRedis();
    const s = new RedisKeyValueStore(client as never);
    await s.set('k', 'v', 30);
    expect((client.set as unknown as ReturnType<typeof vi.fn>).mock.calls[0][2]).toBe('EX');
    expect((client.set as unknown as ReturnType<typeof vi.fn>).mock.calls[0][3]).toBe(30);
    expect(await s.get('k')).toBe('v');
    await s.del('k');
    expect(await s.get('k')).toBeNull();
  });
});

describe('Redis infra - RedisThrottlerStorage (sliding-window)', () => {
  let client: ReturnType<typeof fakeRedis>;
  let storage: RedisThrottlerStorage;
  beforeEach(() => {
    client = fakeRedis();
    storage = new RedisThrottlerStorage(client as never);
  });

  it('duoi limit -> khong chan; vuot limit -> isBlocked=true', async () => {
    const ttl = 60000;
    const limit = 3;
    let r = await storage.increment('ip1', ttl, limit, 0, 'default');
    expect(r.totalHits).toBe(1);
    expect(r.isBlocked).toBe(false);
    for (let i = 0; i < 3; i += 1) {
      r = await storage.increment('ip1', ttl, limit, 0, 'default');
    }
    // tong cong 4 lan > limit=3 -> blocked
    expect(r.totalHits).toBe(4);
    expect(r.isBlocked).toBe(true);
    expect(r.timeToBlockExpire).toBeGreaterThan(0);
  });

  it('sliding window: sau khi qua ttl, hit cu bi loai -> dem reset', async () => {
    vi.useFakeTimers();
    try {
      const ttl = 60000;
      await storage.increment('ip2', ttl, 3, 0, 'default');
      await storage.increment('ip2', ttl, 3, 0, 'default');
      let r = await storage.increment('ip2', ttl, 3, 0, 'default');
      expect(r.totalHits).toBe(3);
      // Vuot qua window -> 3 hit cu nam ngoai window, bi ZREMRANGEBYSCORE xoa
      vi.advanceTimersByTime(ttl + 1000);
      r = await storage.increment('ip2', ttl, 3, 0, 'default');
      expect(r.totalHits).toBe(1);
      expect(r.isBlocked).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('Redis infra - resolve config (env > yaml)', () => {
  const saved = { ...process.env };
  beforeEach(() => {
    for (const k of ['ON_REDIS', 'REDIS_URL', 'REDIS_HOST', 'REDIS_PORT', 'REDIS_DB', 'REDIS_PASSWORD']) {
      delete process.env[k];
    }
  });
  afterAll(() => {
    process.env = { ...saved };
  });

  const cfg = (map: Record<string, unknown>) => ({ get: (k: string, d?: unknown) => map[k] ?? d }) as never;

  it('ON_REDIS env = true -> enabled; = false -> tat (bat chan yaml)', () => {
    process.env.ON_REDIS = 'true';
    expect(isRedisEnabled(cfg({ 'redis.enabled': false }))).toBe(true);
    process.env.ON_REDIS = 'false';
    expect(isRedisEnabled(cfg({ 'redis.enabled': true }))).toBe(false);
  });

  it('khong co env -> doc tu yaml redis.enabled', () => {
    expect(isRedisEnabled(cfg({ 'redis.enabled': true }))).toBe(true);
    expect(isRedisEnabled(cfg({ 'redis.enabled': false }))).toBe(false);
  });

  it('REDIS_URL co uu tien; nguoc lai ghep tu HOST/PORT/DB', () => {
    process.env.REDIS_URL = 'redis://h:1234/5';
    expect(resolveRedisOptions(cfg({}))).toBe('redis://h:1234/5');
    delete process.env.REDIS_URL;
    process.env.REDIS_HOST = 'myhost';
    process.env.REDIS_PORT = '6380';
    process.env.REDIS_DB = '2';
    const opts = resolveRedisOptions(cfg({})) as { host: string; port: number; db: number };
    expect(opts).toMatchObject({ host: 'myhost', port: 6380, db: 2 });
  });
});

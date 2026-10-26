import { Global, Inject, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { INJECTION_TOKENS } from '../../core/tokens/injection.tokens.js';
import type { KeyValueStore } from '../../core/interfaces/cache.interface.js';
import { InMemoryKeyValueStore } from './in-memory-keyvalue.store.js';
import { RedisKeyValueStore } from './redis-keyvalue.store.js';

/** Cờ bật Redis: env ON_REDIS uu tien hon `redis.enabled` trong config.yaml. */
export function isRedisEnabled(config: ConfigService): boolean {
  const env = process.env.ON_REDIS;
  if (env !== undefined && env !== '') {
    return env.toLowerCase() === 'true';
  }
  const fromYaml = config.get<unknown>('redis.enabled');
  return fromYaml === true || fromYaml === 'true';
}

/** Thông số kết nối Redis: env (REDIS_URL/HOST/PORT/...) uu tien hon yaml. */
export function resolveRedisOptions(
  config: ConfigService,
): string | { host: string; port: number; db: number; password?: string } {
  const url = process.env.REDIS_URL || config.get<string>('redis.url');
  if (url) {
    return url;
  }
  const host = process.env.REDIS_HOST || config.get<string>('redis.host') || 'localhost';
  const port = Number(process.env.REDIS_PORT || config.get<number>('redis.port') || 6379);
  const dbRaw = process.env.REDIS_DB ?? (config.get<number>('redis.db') ?? 0);
  const db = Number(dbRaw);
  const password = process.env.REDIS_PASSWORD || config.get<string>('redis.password') || undefined;
  return { host, port, db: Number.isNaN(db) ? 0 : db, password };
}

/**
 * dong ket noi Redis toan cuc; disconnect khung app shutdown.
 * REDIS_CLIENT = null khi ON_REDIS=false (khong mo ket noi).
 */
@Injectable()
class RedisConnectionLifecycle implements OnApplicationShutdown {
  constructor(@Inject(INJECTION_TOKENS.REDIS_CLIENT) private readonly client: Redis | null) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }
}

@Global()
@Module({
  providers: [
    {
      provide: INJECTION_TOKENS.REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis | null => {
        if (!isRedisEnabled(config)) {
          return null;
        }
        const options = resolveRedisOptions(config);
        const client = typeof options === 'string' ? new Redis(options) : new Redis(options);
        client.on('error', (err: Error) => {
          // Log ngu gia khong crash; ioredis tu reconnect.
          // eslint-disable-next-line no-console
          console.error(`[Redis] ket noi loi: ${err.message}`);
        });
        return client;
      },
    },
    {
      provide: INJECTION_TOKENS.CACHE_STORE,
      inject: [INJECTION_TOKENS.REDIS_CLIENT],
      useFactory: (client: Redis | null): KeyValueStore =>
        client ? new RedisKeyValueStore(client) : new InMemoryKeyValueStore(),
    },
    RedisConnectionLifecycle,
  ],
  exports: [INJECTION_TOKENS.REDIS_CLIENT, INJECTION_TOKENS.CACHE_STORE],
})
export class RedisModule {}

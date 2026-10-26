import { Injectable } from '@nestjs/common';
import type { Redis } from 'ioredis';

/** Bản ghi trả về cho ThrottlerGuard (đúng shape `ThrottlerStorageRecord` của @nestjs/throttler v6). */
interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * ThrottlerStorage dua tren Redis (kich hoat khi ON_REDIS=true) - cai dat hop dong
 * `ThrottlerStorage` cua @nestjs/throttler v6 bang **sliding window** (Redis sorted set),
 * chinh xac hon fixed-window (khong nhay vung bien doi nan tang toc dot ngot dau/sau window)
 * va nhat quan giua nhieu instance.
 *
 * Moi lan goi: ZREMRANGEBYSCORE loai hit ngoai window -> ZADD hit hien tai -> ZCARD dem.
 * Pipeline (MULTI) gop lenh thanh 1 vong round-trip. Guard chi doc
 * { totalHits, timeToExpire, isBlocked, timeToBlockExpire } va nem khi isBlocked = true.
 */
@Injectable()
export class RedisThrottlerStorage {
  private seq = 0;

  constructor(private readonly client: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const zkey = `throttle:${throttlerName}:${key}:sw`;
    const blockKey = `throttle:${throttlerName}:${key}:block`;
    const now = Date.now();
    const windowStart = now - ttl;

    // Member phai duy nhat moi hit (khong bi gop khi trung timestamp).
    this.seq = (this.seq + 1) % 1_000_000_000;
    const member = `${now}:${this.seq}:${Math.random().toString(36).slice(2, 10)}`;

    const replies = (await this.client
      .multi()
      .zremrangebyscore(zkey, 0, windowStart)
      .zadd(zkey, now, member)
      .zcard(zkey)
      .pexpire(zkey, ttl)
      .pttl(zkey)
      .exec()) as [unknown, unknown][] | null;

    const totalHits = Number(replies?.[2]?.[1] ?? 1);
    const pttlRaw = Number(replies?.[4]?.[1] ?? ttl);
    const timeToExpire = Math.ceil((pttlRaw > 0 ? pttlRaw : ttl) / 1000);

    let isBlocked: boolean;
    let timeToBlockExpire = 0;

    if (blockDuration > 0) {
      if (totalHits > limit) {
        await this.client.set(blockKey, '1', 'PX', blockDuration, 'NX');
      }
      const blockPttl = await this.client.pttl(blockKey);
      isBlocked = blockPttl > 0;
      timeToBlockExpire = isBlocked ? Math.ceil(blockPttl / 1000) : 0;
    } else {
      isBlocked = totalHits > limit;
      timeToBlockExpire = timeToExpire;
    }

    return { totalHits, timeToExpire, isBlocked, timeToBlockExpire };
  }
}

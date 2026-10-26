import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Argon2PasswordHasher } from '../src/modules/hashing/argon2-hasher.service.js';
import { BcryptPasswordHasher } from '../src/modules/hashing/bcrypt-hasher.service.js';
import { JwtTokenService } from '../src/modules/token/jwt-token.service.js';
import { PaginatedResult } from '../src/common/responses/paginated-response.dto.js';
import { AuditLogResponseDto } from '../src/modules/auth/dto/audit-log-response.dto.js';

describe('Kiểm thử Hiệu năng Hệ thống (Performance & Latency Benchmark)', () => {
  let configService: ConfigService;
  let jwtTokenService: JwtTokenService;
  let argon2Hasher: Argon2PasswordHasher;
  let bcryptHasher: BcryptPasswordHasher;

  beforeEach(() => {
    configService = new ConfigService({
      jwt: {
        secret: 'super-long-benchmark-jwt-secret-key-32bytes-min',
        expiresIn: '15m',
        refreshExpiresDays: 7,
      },
      hash: {
        defaultAlgorithm: 'argon2id',
        argon2MemoryCost: 19456,
        argon2TimeCost: 2,
        argon2Parallelism: 1,
        bcryptRounds: 10,
      },
    });

    jwtTokenService = new JwtTokenService(new JwtService(), configService);
    argon2Hasher = new Argon2PasswordHasher(configService);
    bcryptHasher = new BcryptPasswordHasher(configService);
  });

  it('Benchmark: Đo lường độ trễ (Latency) và Thông lượng (Throughput) Ký & Xác thực JWT', async () => {
    const payload = {
      sub: '0192e47b-891a-7b3b-9e4a-9b19e2300000',
      email: 'benchmark@agentcloud.io',
      userName: 'Benchmark User',
      roles: ['USER', 'MANAGER'],
      permissions: ['user:profile:read', 'user:profile:update', 'auth:session:revoke'],
    };
    const sessionId = '0192e47b-891a-7b3b-9e4a-9b19e2300001';

    const iterations = 200;

    // 1. Benchmark Ký Token (Signing)
    const signStart = performance.now();
    const tokensList: string[] = [];
    for (let i = 0; i < iterations; i++) {
      const pair = await jwtTokenService.generateTokenPair(payload, sessionId);
      tokensList.push(pair.accessToken);
    }
    const signDuration = performance.now() - signStart;
    const signAvgLatency = signDuration / iterations;
    const signThroughput = Math.round((iterations / signDuration) * 1000);

    // 2. Benchmark Xác thực Token (Verification)
    const verifyStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await jwtTokenService.verifyAccessToken(tokensList[i]);
    }
    const verifyDuration = performance.now() - verifyStart;
    const verifyAvgLatency = verifyDuration / iterations;
    const verifyThroughput = Math.round((iterations / verifyDuration) * 1000);

    // Assertions kiểm tra ngưỡng chấp nhận hiệu năng
    expect(signAvgLatency).toBeLessThan(5); // Ký token phải < 5ms
    expect(verifyAvgLatency).toBeLessThan(3); // Verify token phải < 3ms
    expect(signThroughput).toBeGreaterThan(200); // Tối thiểu > 200 req/s trên single thread
    expect(verifyThroughput).toBeGreaterThan(300); // Tối thiểu > 300 req/s

    console.log('\n--- KẾT QUẢ BENCHMARK JWT TOKEN ---');
    console.log(`Số lần thử nghiệm: ${iterations} lần`);
    console.log(`- Ký JWT (Signing): Avg Latency: ${signAvgLatency.toFixed(3)} ms | Throughput: ${signThroughput} ops/sec`);
    console.log(`- Xác thực JWT (Verify): Avg Latency: ${verifyAvgLatency.toFixed(3)} ms | Throughput: ${verifyThroughput} ops/sec`);
    console.log('-------------------------------------\n');
  });

  it('Benchmark: So sánh độ trễ tính toán Hash giữa Argon2id và Bcrypt', async () => {
    const password = 'BenchmarkPassword@2026';
    const cycles = 5;

    // 1. Argon2id
    const argonLatencies: number[] = [];
    for (let i = 0; i < cycles; i++) {
      const start = performance.now();
      const h = await argon2Hasher.hash(password);
      await argon2Hasher.verify(password, h);
      argonLatencies.push(performance.now() - start);
    }

    // 2. Bcrypt
    const bcryptLatencies: number[] = [];
    for (let i = 0; i < cycles; i++) {
      const start = performance.now();
      const h = await bcryptHasher.hash(password);
      await bcryptHasher.verify(password, h);
      bcryptLatencies.push(performance.now() - start);
    }

    const argonAvg = argonLatencies.reduce((a, b) => a + b, 0) / cycles;
    const bcryptAvg = bcryptLatencies.reduce((a, b) => a + b, 0) / cycles;

    // Cả 2 thuật toán băm phòng vệ brute-force đều có chủ ý kiểm soát độ trễ trong khoảng 20ms - 200ms
    expect(argonAvg).toBeGreaterThan(10);
    expect(argonAvg).toBeLessThan(300);
    expect(bcryptAvg).toBeGreaterThan(20);
    expect(bcryptAvg).toBeLessThan(300);

    console.log('\n--- KẾT QUẢ BENCHMARK BĂM MẬT KHẨU (HASH & VERIFY) ---');
    console.log(`Số chu kỳ đo: ${cycles} chu kỳ (hash + verify)`);
    console.log(`- Argon2id: Avg Latency = ${argonAvg.toFixed(2)} ms (Kháng GPU/ASIC vượt trội, an toàn chuẩn OWASP)`);
    console.log(`- Bcrypt:   Avg Latency = ${bcryptAvg.toFixed(2)} ms (Tương thích rộng rãi)`);
    console.log('-----------------------------------------------------\n');
  });

  it('Benchmark: Hiệu năng đóng gói và phân trang dữ liệu (Query Response Serialization)', () => {
    const rawItems: AuditLogResponseDto[] = Array.from({ length: 50 }, (_, i) => ({
      id: `0192e47b-891a-7b3b-9e4a-${i.toString().padStart(12, '0')}`,
      userId: '0192e47b-891a-7b3b-9e4a-9b19e2300000',
      eventType: i % 2 === 0 ? 'auth.signin.success' : 'auth.signin.failed',
      success: i % 2 === 0,
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      metadata: { attempt: i, testId: 'perf-query-1' },
      createdAt: new Date(),
    }));

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const paginated = new PaginatedResult<AuditLogResponseDto>(rawItems, 250, 1, 50);
      expect(paginated.totalPages).toBe(5);
    }
    const duration = performance.now() - start;
    const avgLatency = duration / 1000;

    expect(avgLatency).toBeLessThan(0.1); // < 0.1ms per serialization

    console.log('\n--- KẾT QUẢ BENCHMARK QUERY SERIALIZATION ---');
    console.log(`1000 lượt đóng gói 50 items/page: Avg Latency = ${(avgLatency * 1000).toFixed(2)} microseconds`);
    console.log('---------------------------------------------\n');
  });
});

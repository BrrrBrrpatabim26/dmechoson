import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import request from 'supertest';
import * as net from 'net';
import { INJECTION_TOKENS } from '../../src/core/tokens/injection.tokens.js';
import { configureApp } from '../../src/app-config.js';

/**
 * Harness E2E dùng chung cho toàn bộ suite `*.e2e-spec.ts`.
 *
 * Triết lý: HTTP + routing + validation + guard + service + repository + PostgreSQL đều THẬT.
 * CHỈ mock 2 boundary không thể gọi thật trong test tự động:
 *   (1) Mail sender -> fake để bắt được OTP/token raw (DB chỉ lưu SHA-256).
 *   (2) Crypto WebAuthn & round-trip OAuth -> được stub ở từng spec (vi.mock / patch passport).
 */

// ---- Env E2E (chỉ set nếu chưa có, để cho phép override bằng env thật/CI) ----------
const E2E_ENV: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '3001',
  APP_NAME: 'Authentication Service E2E',
  CLIENT_URL: 'http://localhost:3000',
  DB_TYPE: 'postgres',
  DB_HOST: '127.0.0.1',
  DB_PORT: '5432',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'your_password',
  DB_DATABASE: 'authentication_e2e',
  DB_SYNCHRONIZE: 'true',
  DB_LOGGING: 'false',
  DB_SSL: 'false',
  JWT_SECRET: 'e2e-super-secret-jwt-key-for-auth-service-min-32-chars',
  JWT_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_DAYS: '7',
  HASH_DEFAULT_ALGORITHM: 'argon2id',
  HASH_ARGON2_MEMORY_COST: '8192',
  HASH_ARGON2_TIME_COST: '1',
  HASH_ARGON2_PARALLELISM: '1',
  AUTH_ENABLED_METHODS: '*',
  AUTH_EMAIL_VERIFICATION_ENABLED: 'false',
  AUTH_RBAC_CACHE_TTL_MS: '0',
  MAIL_STRATEGY: 'console',
  MFA_ISSUER: 'AgentCloud E2E',
  MFA_RECOVERY_CODE_COUNT: '8',
  MFA_ENCRYPTION_KEY: 'e2e-strong-encryption-secret-key-32bytes-min',
  WEBAUTHN_RP_ID: 'localhost',
  WEBAUTHN_RP_NAME: 'AgentCloud E2E',
  WEBAUTHN_ORIGIN: 'http://localhost:3001',
  // Relax rate limiting để test không bị 429.
  THROTTLE_TTL: '1000',
  THROTTLE_LIMIT: '1000000',
  SWAGGER_ENABLED: 'false',
};

for (const [key, value] of Object.entries(E2E_ENV)) {
  if (process.env[key] === undefined || process.env[key] === '') {
    process.env[key] = value;
  }
}

// ---- Probe DB (quyết định skip toàn bộ suite khi không có Postgres) ----------------
async function probeDatabase(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
    });
    socket.setTimeout(3000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

export const DB_AVAILABLE = await probeDatabase();

// ---- Mail capture (override provider INJECTION_TOKENS.MAIL_SENDER) -----------------
interface SentMail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class MailCapture {
  readonly name = 'e2e-capture';
  sent: SentMail[] = [];

  async sendMail(options: SentMail): Promise<{ success: boolean; messageId: string }> {
    this.sent.push(options);
    return { success: true, messageId: `e2e-${this.sent.length}` };
  }

  reset(): void {
    this.sent = [];
  }

  private last(): SentMail {
    const mail = this.sent[this.sent.length - 1];
    if (!mail) throw new Error('MailCapture: chưa có email nào được gửi');
    return mail;
  }

  /** Mã OTP 6 số gần nhất (lấy từ subject hoặc body). */
  lastOtp(): string {
    const mail = this.last();
    const match = `${mail.subject} ${mail.text} ${mail.html ?? ''}`.match(/\b(\d{6})\b/);
    if (!match) throw new Error('MailCapture: không tìm thấy OTP 6 số trong email');
    return match[1];
  }

  /** Token 40+ ký tự (base64url) trong `...token=<value>` ở magic link / verify email. */
  lastToken(): string {
    const mail = this.last();
    const match = `${mail.text} ${mail.html ?? ''}`.match(/token=([A-Za-z0-9_-]{20,})/);
    if (!match) throw new Error('MailCapture: không tìm thấy token trong email');
    return match[1];
  }
}

export const mailCapture = new MailCapture();

/**
 * Storage throttler trung tính: `increment` luôn trả total=1 (không bao giờ vượt
 * limit) nên ThrottlerGuard không chặn. Guard được tạo qua `useClass` nên không
 * thể override trực tiếp; trung hòa storage là cách deterministic.
 * Rate limiting vẫn được kiểm chứng riêng bằng unit test.
 */
class NoopThrottlerStorage {
  async increment(): Promise<{ total: number; firstRequestAt: Date; lastRequestAt: Date }> {
    const now = new Date();
    return { total: 1, firstRequestAt: now, lastRequestAt: now };
  }
}

// ---- Tạo app E2E -------------------------------------------------------------------
export interface E2EContext {
  app: INestApplication;
  db: DataSource;
  server: ReturnType<INestApplication['getHttpServer']>;
  http: () => request.Agent;
}

/**
 * Khởi tạo Nest app THẬT (dynamic import AppModule SAU khi env đã set) và override
 * mail sender bằng MailCapture. Trả về handle để gọi supertest + truy cập DataSource.
 *
 * @param mutate tùy chọn: cho phép spec override thêm provider/guard
 *   (vd: OAuth guard để tiêm req.user mô phỏng callback từ provider).
 */
export async function createE2EApp(
  mutate?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
): Promise<E2EContext> {
  const { AppModule } = await import('../../src/app.module.js');

  let builder: TestingModuleBuilder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(INJECTION_TOKENS.MAIL_SENDER)
    .useValue(mailCapture)
    .overrideProvider(ThrottlerStorage)
    .useValue(new NoopThrottlerStorage());

  if (mutate) {
    builder = mutate(builder);
  }

  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication();
  const configService = app.get(ConfigService);
  configureApp(app, configService);
  await app.init();

  const db = app.get(DataSource);
  return {
    app,
    db,
    server: app.getHttpServer(),
    http: () => request(app.getHttpServer()),
  };
}

const ALL_TABLES = [
  'users',
  'identities',
  'user_emails',
  'user_phones',
  'auth_providers',
  'organizations',
  'sessions',
  'devices',
  'memberships',
  'membership_roles',
  'roles',
  'role_permissions',
  'permissions',
  'password_credentials',
  'oauth_tokens',
  'passkey_credentials',
  'mfa_factors',
  'mfa_recovery_codes',
  'verification_tokens',
  'refresh_tokens',
  'login_audit_logs',
];

/** Xóa sạch dữ liệu + reset sequence trước mỗi test để cách ly tuyệt đối. */
export async function resetDb(db: DataSource): Promise<void> {
  mailCapture.reset();
  await db.query(`TRUNCATE ${ALL_TABLES.join(', ')} RESTART IDENTITY CASCADE;`);
}

/** Đếm số dòng một bảng (assert trạng thái DB). */
export async function countRows(db: DataSource, table: string): Promise<number> {
  const res = await db.query(`SELECT COUNT(*)::int AS count FROM ${table};`);
  return Number(res[0]?.count ?? 0);
}

/** Truy vấn một dòng theo điều kiện đơn giản (hỗ trợ assert). */
export async function queryOne<T = Record<string, unknown>>(
  db: DataSource,
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const res = await db.query(sql, params);
  return (res[0] as T) ?? null;
}

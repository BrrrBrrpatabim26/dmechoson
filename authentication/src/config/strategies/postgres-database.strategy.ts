import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BaseDatabaseConfigStrategy } from '../../core/abstracts/base-database-strategy.abstract.js';

@Injectable()
export class PostgresDatabaseConfigStrategy extends BaseDatabaseConfigStrategy {
  constructor() {
    super('postgres');
  }

  protected buildSpecificOptions(configService: ConfigService): TypeOrmModuleOptions {
    const isSsl = configService.get<boolean>('database.ssl', false);
    const synchronize =
      process.env.DB_SYNCHRONIZE !== undefined
        ? process.env.DB_SYNCHRONIZE === 'true'
        : configService.get<boolean>('database.synchronize', false);
    const runMigrations =
      process.env.DB_RUN_MIGRATIONS !== undefined
        ? process.env.DB_RUN_MIGRATIONS === 'true'
        : configService.get<boolean>('database.runMigrations', false);
    const poolMax = configService.get<number>('database.poolMax', 20);
    const poolMin = configService.get<number>('database.poolMin', 2);
    const poolIdleMs = configService.get<number>('database.poolIdleMs', 30000);
    const connectTimeoutMs = Number(process.env.DB_POOL_CONNECT_TIMEOUT_MS ?? 10000);
    // Mặc định XÁC THỰC cert TLS (an toàn). Chỉ tắt khi DB_SSL_REJECT_UNAUTHORIZED=false (self-signed dev).
    const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

    return {
      type: 'postgres',
      host: process.env.DB_HOST || configService.get<string>('database.host', 'localhost'),
      port: process.env.DB_PORT
        ? parseInt(process.env.DB_PORT, 10)
        : configService.get<number>('database.port', 5432),
      username:
        process.env.DB_USERNAME || configService.get<string>('database.username', 'postgres'),
      password:
        process.env.DB_PASSWORD !== undefined
          ? process.env.DB_PASSWORD
          : configService.get<string>('database.password', ''),
      database:
        process.env.DB_DATABASE || configService.get<string>('database.database', 'authentication'),
      entities: this.getEntities(),
      migrations: this.getMigrations(),
      migrationsRun: runMigrations,
      synchronize,
      logging:
        process.env.DB_LOGGING !== undefined
          ? process.env.DB_LOGGING === 'true'
          : configService.get<boolean>('database.logging', false),
      ssl: isSsl ? { rejectUnauthorized } : false,
      extra: {
        // Connection pool (pg) tu env: DB_POOL_MAX / MIN / IDLE_MS.
        max: poolMax,
        min: poolMin,
        idleTimeoutMillis: poolIdleMs,
        // Timeout mo ket noi (AGENTS 1.2 #10: moi giao tiếp ngoài phải có timeout).
        connectionTimeoutMillis: connectTimeoutMs,
      },
    };
  }
}

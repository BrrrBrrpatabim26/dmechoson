import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BaseDatabaseConfigStrategy } from '../../core/abstracts/base-database-strategy.abstract.js';

@Injectable()
export class MysqlDatabaseConfigStrategy extends BaseDatabaseConfigStrategy {
  constructor() {
    super('mysql');
  }

  protected buildSpecificOptions(configService: ConfigService): TypeOrmModuleOptions {
    const synchronize =
      process.env.DB_SYNCHRONIZE !== undefined
        ? process.env.DB_SYNCHRONIZE === 'true'
        : configService.get<boolean>('database.synchronize', false);
    const runMigrations =
      process.env.DB_RUN_MIGRATIONS !== undefined
        ? process.env.DB_RUN_MIGRATIONS === 'true'
        : configService.get<boolean>('database.runMigrations', false);
    const poolMax = configService.get<number>('database.poolMax', 20);
    const isSsl = configService.get<boolean>('database.ssl', false);
    const connectTimeoutMs = Number(process.env.DB_POOL_CONNECT_TIMEOUT_MS ?? 10000);
    // Mặc định xác thực cert TLS; chi tắt khi DB_SSL_REJECT_UNAUTHORIZED=false.
    const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

    return {
      type: 'mysql',
      host: process.env.DB_HOST || configService.get<string>('database.host', 'localhost'),
      port: process.env.DB_PORT
        ? parseInt(process.env.DB_PORT, 10)
        : configService.get<number>('database.port', 3306),
      username:
        process.env.DB_USERNAME || configService.get<string>('database.username', 'root'),
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
      charset: 'utf8mb4_unicode_ci',
      ssl: isSsl ? { rejectUnauthorized } : undefined,
      connectTimeout: connectTimeoutMs,
      extra: {
        // mysql2 chi dung connectionLimit (khong co min/idle roi).
        connectionLimit: poolMax,
        queueLimit: 0,
        waitForConnections: true,
      },
    };
  }
}

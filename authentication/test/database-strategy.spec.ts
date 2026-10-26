import { describe, it, expect } from 'vitest';
import { ConfigService } from '@nestjs/config';
import {
  DatabaseConfigFactory,
  PostgresDatabaseConfigStrategy,
  MysqlDatabaseConfigStrategy,
} from '../src/config/database.config.js';
import type { IDatabaseConfigStrategy } from '../src/core/interfaces/database-strategy.interface.js';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

describe('Database Strategy Pattern (Cấu hình Cơ sở dữ liệu Đa hình)', () => {
  const postgresStrategy = new PostgresDatabaseConfigStrategy();
  const mysqlStrategy = new MysqlDatabaseConfigStrategy();
  const factory = new DatabaseConfigFactory(postgresStrategy, mysqlStrategy);

  it('Tạo cấu hình kết nối chuẩn cho PostgreSQL khi DB_TYPE=postgres', () => {
    const configService = new ConfigService({
      database: {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'secret_password',
        database: 'auth_db',
        synchronize: true,
        logging: false,
        ssl: false,
      },
    });

    const options = factory.createTypeOrmOptions(configService) as any;

    expect(options.type).toBe('postgres');
    expect(options.port).toBe(5432);
    expect(options.database).toBe('auth_db');
    expect(options.entities).toBeDefined();
    expect(options.entities.length).toBe(21);
    expect(options.extra?.max).toBe(20);
  });

  it('Tạo cấu hình kết nối chuẩn cho MySQL khi DB_TYPE=mysql', () => {
    const configService = new ConfigService({
      database: {
        type: 'mysql',
        host: '127.0.0.1',
        port: 3306,
        username: 'root',
        password: 'root_password',
        database: 'mysql_auth',
        synchronize: false,
        logging: false,
      },
    });

    const options = factory.createTypeOrmOptions(configService) as any;

    expect(options.type).toBe('mysql');
    expect(options.port).toBe(3306);
    expect(options.database).toBe('mysql_auth');
    expect(options.charset).toBe('utf8mb4_unicode_ci');
    expect(options.entities.length).toBe(21);
  });

  it('Ném lỗi rõ ràng nếu DB_TYPE không được hỗ trợ', () => {
    const configService = new ConfigService({
      database: {
        type: 'oracle',
        host: 'localhost',
        database: 'test',
        username: 'user',
      },
    });

    expect(() => factory.createTypeOrmOptions(configService)).toThrow(
      /Loại cơ sở dữ liệu \[oracle\] không được hỗ trợ/,
    );
  });

  it('Cho phép đăng ký thêm Strategy mới (Open/Closed Principle) mà không sửa mã nguồn gốc', () => {
    class MockSqliteStrategy implements IDatabaseConfigStrategy {
      readonly supportedType = 'sqlite';
      buildOptions(): TypeOrmModuleOptions {
        return {
          type: 'sqlite',
          database: ':memory:',
        } as any;
      }
      validate(): void {}
    }

    factory.registerStrategy(new MockSqliteStrategy());

    const configService = new ConfigService({
      database: {
        type: 'sqlite',
      },
    });

    const options = factory.createTypeOrmOptions(configService) as any;
    expect(options.type).toBe('sqlite');
    expect(options.database).toBe(':memory:');
  });
});

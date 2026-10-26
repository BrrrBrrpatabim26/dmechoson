import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { IDatabaseConfigStrategy } from '../core/interfaces/database-strategy.interface.js';
import { PostgresDatabaseConfigStrategy } from './strategies/postgres-database.strategy.js';
import { MysqlDatabaseConfigStrategy } from './strategies/mysql-database.strategy.js';

/**
 * Factory điều phối chiến lược cấu hình cơ sở dữ liệu đa hình (Polymorphic Database Strategy Factory).
 *
 * Cho phép chuyển đổi linh hoạt giữa PostgreSQL và MySQL qua biến môi trường DB_TYPE,
 * và dễ dàng mở rộng sang các hệ quản trị CSDL khác mà không làm sửa đổi logic kết nối gốc.
 */
@Injectable()
export class DatabaseConfigFactory {
  private readonly logger = new Logger(DatabaseConfigFactory.name);
  private readonly strategies = new Map<string, IDatabaseConfigStrategy>();

  constructor(
    private readonly postgresStrategy: PostgresDatabaseConfigStrategy,
    private readonly mysqlStrategy: MysqlDatabaseConfigStrategy,
  ) {
    this.registerStrategy(this.postgresStrategy);
    this.registerStrategy(this.mysqlStrategy);
  }

  /**
   * Đăng ký một chiến lược cấu hình cơ sở dữ liệu mới.
   */
  registerStrategy(strategy: IDatabaseConfigStrategy): void {
    this.strategies.set(strategy.supportedType.toLowerCase(), strategy);
    this.logger.debug(`Đã đăng ký Database Strategy: [${strategy.supportedType}]`);
  }

  /**
   * Sinh cấu hình TypeOrmModuleOptions dựa theo DB_TYPE từ cấu hình hệ thống.
   */
  createTypeOrmOptions(configService: ConfigService): TypeOrmModuleOptions {
    const rawType = configService.get<string>('database.type', 'postgres').toLowerCase();
    const strategy = this.strategies.get(rawType);

    if (!strategy) {
      const supported = Array.from(this.strategies.keys()).join(', ');
      throw new Error(
        `Loại cơ sở dữ liệu [${rawType}] không được hỗ trợ. Các loại được hỗ trợ hiện tại: [${supported}]`,
      );
    }

    return strategy.buildOptions(configService);
  }
}

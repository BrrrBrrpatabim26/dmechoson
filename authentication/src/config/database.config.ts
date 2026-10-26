import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DatabaseConfigFactory } from './database-config.factory.js';
import { PostgresDatabaseConfigStrategy } from './strategies/postgres-database.strategy.js';
import { MysqlDatabaseConfigStrategy } from './strategies/mysql-database.strategy.js';

// Khởi tạo factory singleton với các chiến lược sẵn có
const dbFactory = new DatabaseConfigFactory(
  new PostgresDatabaseConfigStrategy(),
  new MysqlDatabaseConfigStrategy(),
);

/**
 * Sinh cấu hình kết nối TypeORM đa hình thông qua DatabaseConfigFactory.
 *
 * Tự động chọn chiến lược phù hợp theo biến môi trường DB_TYPE (postgres, mysql...).
 *
 * @param configService Instance của ConfigService
 * @returns Cấu hình TypeOrmModuleOptions
 */
export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  return dbFactory.createTypeOrmOptions(configService);
};

export { DatabaseConfigFactory, PostgresDatabaseConfigStrategy, MysqlDatabaseConfigStrategy };
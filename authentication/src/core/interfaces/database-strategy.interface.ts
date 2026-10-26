import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Interface cho chiến lược cấu hình cơ sở dữ liệu (Database Configuration Strategy).
 *
 * Cho phép cắm thêm (pluggable) hoặc thay thế bất kỳ hệ quản trị cơ sở dữ liệu nào
 * (PostgreSQL, MySQL, MariaDB, SQLite, Oracle...) theo nguyên lý Open/Closed Principle (SOLID).
 */
export interface IDatabaseConfigStrategy {
  /**
   * Tên loại database được hỗ trợ (ví dụ: 'postgres', 'mysql').
   */
  readonly supportedType: string;

  /**
   * Xây dựng đối tượng cấu hình kết nối TypeORM chuyên biệt cho từng loại database.
   *
   * @param configService Instance của ConfigService để đọc biến môi trường
   * @returns Cấu hình TypeOrmModuleOptions
   */
  buildOptions(configService: ConfigService): TypeOrmModuleOptions;

  /**
   * Kiểm tra tính hợp lệ của các tham số cấu hình cần thiết trước khi kết nối.
   *
   * @param configService Instance của ConfigService
   */
  validate(configService: ConfigService): void;
}

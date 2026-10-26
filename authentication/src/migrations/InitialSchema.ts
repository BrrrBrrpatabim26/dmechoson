import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration "khai sinh" schema đầy đủ từ entity metadata đã đăng ký với TypeORM.
 *
 * Lý do tồn tại: production chạy `DB_SYNCHRONIZE=false` (AGENTS 1.2 #11) nhưng trước đây
 * repo chỉ có duy nhất migration index — DB mới toanh sẽ không có bảng nào.
 *
 * - `up`: chỉ build schema khi DB còn trống (kiểm tra cột mốc bảng `users`).
 *   cố Ý KHÔNG chạy schema-diff trên DB đã có dữ liệu để không đụng column/bảng lạ.
 *   Dùng SchemaBuilder của driver nên đa hình PostgreSQL / MySQL, không nhúng SQL thô.
 * - `down`: xóa toàn bộ bảng thuộc entity (rollback DB trắng; không dùng cho prod có dữ liệu).
 *
 * Idempotent: DB lịch sử (tạo từ synchronize=true) được đánh dấu applied mà không đổi gì.
 */
export class InitialSchema1729000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const usersExist = await queryRunner.hasTable('users');
    if (usersExist) {
      // DB đã có schema (từ synchronize trước đây): không tạo gì, chỉ đánh dấu applied.
      return;
    }
    // DB trống: dựng toàn bộ bảng + index + FK từ metadata entity đang đăng ký.
    await queryRunner.connection.driver.createSchemaBuilder().build();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableNames = queryRunner.connection.entityMetadatas.map((meta) => meta.tableName);
    const driverType = queryRunner.connection.options.type;

    if (driverType === 'postgres') {
      // 1 lệnh, danh sách đầy đủ + CASCADE: không cần sắp xếp phụ thuộc.
      const quoted = tableNames.map((name) => `"${name}"`).join(', ');
      await queryRunner.query(`DROP TABLE IF EXISTS ${quoted} CASCADE`);
    } else {
      // MySQL: tắt kiểm tra FK trong phiên hiện tại rồi xóa từng bảng.
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
      for (const name of tableNames) {
        await queryRunner.query(`DROP TABLE IF EXISTS \`${name}\``);
      }
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
    }
  }
}

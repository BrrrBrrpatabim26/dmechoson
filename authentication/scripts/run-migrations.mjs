#!/usr/bin/env node
/**
 * run-migrations.mjs — Job migration MỘT LẦN cho môi trường `DB_SYNCHRONIZE=false`.
 *
 * Chạy độc lập với web process (đúng chuẩn AGENTS 4.3: migration không tự chạy khi
 * mọi instance khởi động). Dùng trong pipeline deploy TRƯỚC khi bật phiên bản mới.
 *
 * Chạy:  npm run migrate            (đọc .env như app, DB_DATABASE trong .env)
 *         DB_DATABASE=other npm run migrate   (override bằng env thật)
 *
 * Thoát code != 0 nếu kết nối/migration thất bại.
 */
import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

loadEnv();

const { PostgresDatabaseConfigStrategy } = await import('../dist/config/strategies/postgres-database.strategy.js');
const { MysqlDatabaseConfigStrategy } = await import('../dist/config/strategies/mysql-database.strategy.js');

const type = (process.env.DB_TYPE || 'postgres').toLowerCase();
const strategy = type === 'mysql' ? new MysqlDatabaseConfigStrategy() : new PostgresDatabaseConfigStrategy();

if (!process.env.DB_HOST || !process.env.DB_USERNAME || !process.env.DB_DATABASE) {
  console.error('[migrate] Thiếu cấu hình bắt buộc: DB_HOST / DB_USERNAME / DB_DATABASE (biến nào thiếu in tên biến đó).');
  process.exit(1);
}

const dataSource = new DataSource({
  type,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : type === 'mysql' ? 3306 : 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_DATABASE,
  entities: strategy.getEntities(),
  migrations: strategy.getMigrations(),
  synchronize: false, // chữ quyết: job này KHÔNG bao giờ synchronize
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : false,
});

try {
  await dataSource.initialize();
  const executed = await dataSource.runMigrations();
  if (executed.length === 0) {
    console.log(`[migrate] Không có migration mới. DB "${process.env.DB_DATABASE}" đã ở phiên bản hiện hành.`);
  } else {
    for (const m of executed) console.log(`[migrate] Đã áp dụng: ${m.constructor.name}`);
  }
} catch (err) {
  console.error(`[migrate] THẤT BẠI: ${err.message}`);
  process.exitCode = 1;
} finally {
  if (dataSource.isInitialized) await dataSource.destroy();
}

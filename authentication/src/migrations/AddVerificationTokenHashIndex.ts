import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

const INDEX_NAME = 'ix_verif_token_hash';
const TABLE = 'verification_tokens';

/**
 * Migration: them index cho duong doc nong `verification_tokens.token_hash`.
 *
 * Ho tro `findByTokenHash` (refresh / OTP / magic-link / email-verification verify) khi chay
 * che do `DB_SYNCHRONIZE=false` (production). Idempotent + portable: kiem tra qua getTable()
 * (khong dung hasIndex) nen chay ca PostgreSQL luon MySQL.
 */
export class AddVerificationTokenHashIndex1730000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE);
    const exists = table?.indices.some((idx) => idx.name === INDEX_NAME) ?? false;
    if (!exists) {
      await queryRunner.createIndex(
        TABLE,
        new TableIndex({ name: INDEX_NAME, columnNames: ['token_hash'] }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE);
    const idx = table?.indices.find((i) => i.name === INDEX_NAME);
    if (idx) {
      await queryRunner.dropIndex(TABLE, idx);
    }
  }
}

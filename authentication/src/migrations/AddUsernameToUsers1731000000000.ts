import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

const TABLE = 'users';
const COLUMN = 'username';
const INDEX = 'ux_users_username';

export class AddUsernameToUsers1731000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE);
    if (!table) return;

    if (!table.findColumnByName(COLUMN)) {
      await queryRunner.addColumn(
        TABLE,
        new TableColumn({
          name: COLUMN,
          type: 'varchar',
          length: '100',
          isNullable: true,
        }),
      );
    }

    const refreshed = await queryRunner.getTable(TABLE);
    const hasIndex = refreshed?.indices.some((index) => index.name === INDEX) ?? false;
    if (!hasIndex) {
      await queryRunner.createIndex(
        TABLE,
        new TableIndex({ name: INDEX, columnNames: [COLUMN], isUnique: true }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE);
    const index = table?.indices.find((item) => item.name === INDEX);
    if (index) await queryRunner.dropIndex(TABLE, index);
    if (table?.findColumnByName(COLUMN)) await queryRunner.dropColumn(TABLE, COLUMN);
  }
}

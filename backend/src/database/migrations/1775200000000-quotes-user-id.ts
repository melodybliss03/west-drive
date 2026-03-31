import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuotesUserId1775200000000 implements MigrationInterface {
  name = 'QuotesUserId1775200000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "user_id" uuid NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quotes" DROP COLUMN IF EXISTS "user_id"`);
  }
}

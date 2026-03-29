import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReviewSourceColumn1775000000000 implements MigrationInterface {
  name = 'ReviewSourceColumn1775000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "source" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN IF EXISTS "source"`);
  }
}

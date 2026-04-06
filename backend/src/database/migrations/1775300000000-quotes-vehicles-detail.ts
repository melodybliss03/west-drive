import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuotesVehiclesDetail1775300000000 implements MigrationInterface {
  name = 'QuotesVehiclesDetail1775300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quotes" ADD COLUMN IF NOT EXISTS "requested_vehicles_detail" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quotes" DROP COLUMN IF EXISTS "requested_vehicles_detail"`,
    );
  }
}

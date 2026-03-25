import { MigrationInterface, QueryRunner } from 'typeorm';

export class VehicleBackofficeFields1773987000000 implements MigrationInterface {
  name = 'VehicleBackofficeFields1773987000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN "is_hybride" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN "price_per_hour" numeric(10,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN "deposit_amount" numeric(10,2)` ,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN "description" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN "plate_number" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN "additional_fees_labels" jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN "maintenance_required" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "maintenance_required"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "additional_fees_labels"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "plate_number"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "deposit_amount"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "price_per_hour"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "is_hybride"`);
  }
}

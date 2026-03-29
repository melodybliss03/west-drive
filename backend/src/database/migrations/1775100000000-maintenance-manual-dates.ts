import { MigrationInterface, QueryRunner } from 'typeorm';

export class MaintenanceManualDates1775100000000 implements MigrationInterface {
  name = 'MaintenanceManualDates1775100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "last_maintenance_at" TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "next_maintenance_at" TIMESTAMPTZ`,
    );
    // Drop the no-longer-used `days` key from the JSONB column (best-effort, non-destructive).
    // Existing rows keep `mileage` if it was set; the `days` key is simply ignored going forward.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "next_maintenance_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "last_maintenance_at"`,
    );
  }
}

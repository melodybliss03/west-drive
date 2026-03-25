import { MigrationInterface, QueryRunner } from 'typeorm';

export class FleetVehicleMileage1773985000000 implements MigrationInterface {
  name = 'FleetVehicleMileage1773985000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN "mileage" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "mileage"`);
  }
}

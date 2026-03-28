import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkReviewsToRentals1774700000000 implements MigrationInterface {
  name = 'LinkReviewsToRentals1774700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "user_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "vehicle_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reservation_id" uuid`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_reviews_reservation_id_unique" ON "reviews" ("reservation_id") WHERE "reservation_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reviews_vehicle_id" ON "reviews" ("vehicle_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reviews_user_id" ON "reviews" ("user_id")`,
    );

    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_vehicle" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_reservation" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "FK_reviews_reservation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "FK_reviews_vehicle"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "FK_reviews_user"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_reviews_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_reviews_vehicle_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_reviews_reservation_id_unique"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP COLUMN IF EXISTS "reservation_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP COLUMN IF EXISTS "vehicle_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP COLUMN IF EXISTS "user_id"`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationsAndSoftDeleteReservations1773981000000
  implements MigrationInterface
{
  name = 'NotificationsAndSoftDeleteReservations1773981000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "type" character varying NOT NULL,
        "title" character varying NOT NULL,
        "message" text NOT NULL,
        "recipient_user_id" uuid,
        "recipient_role" character varying,
        "is_read" boolean NOT NULL DEFAULT false,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "read_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_recipient_user_id" ON "notifications" ("recipient_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_recipient_role" ON "notifications" ("recipient_role")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_is_read" ON "notifications" ("is_read")`,
    );

    await queryRunner.query(
      `ALTER TABLE "reservations" ADD COLUMN "archived_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reservations_archived_at" ON "reservations" ("archived_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_reservations_archived_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservations" DROP COLUMN "archived_at"`,
    );

    await queryRunner.query(
      `DROP INDEX "public"."IDX_notifications_is_read"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notifications_recipient_role"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notifications_recipient_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}

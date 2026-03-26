import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuotesLifecycleAndEvents1773995000000 implements MigrationInterface {
  name = 'QuotesLifecycleAndEvents1773995000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."quotes_status_enum" ADD VALUE IF NOT EXISTS 'EN_ANALYSE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."quotes_status_enum" ADD VALUE IF NOT EXISTS 'PROPOSITION_ENVOYEE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."quotes_status_enum" ADD VALUE IF NOT EXISTS 'EN_NEGOCIATION'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."quotes_status_enum" ADD VALUE IF NOT EXISTS 'CONVERTI_RESERVATION'`,
    );

    await queryRunner.query(
      `CREATE TABLE "quote_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "quote_id" uuid NOT NULL,
        "type" character varying NOT NULL,
        "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quote_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_quote_events_quote_id" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_quote_events_quote_id_occurred_at" ON "quote_events" ("quote_id", "occurred_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_quote_events_quote_id_occurred_at"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "quote_events"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuotesAndPayments1773990000000 implements MigrationInterface {
  name = 'QuotesAndPayments1773990000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."quotes_status_enum" AS ENUM('NOUVELLE_DEMANDE', 'EN_ATTENTE_PAIEMENT', 'PAYEE', 'REFUSEE', 'ANNULEE')`,
    );

    await queryRunner.query(
      `CREATE TABLE "quotes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "public_reference" character varying NOT NULL,
        "requester_type" character varying NOT NULL,
        "requester_name" character varying NOT NULL,
        "requester_email" character varying NOT NULL,
        "requester_phone" character varying NOT NULL,
        "company_name" character varying,
        "company_siret" character varying,
        "pickup_city" character varying NOT NULL,
        "requested_vehicle_type" character varying NOT NULL,
        "requested_quantity" integer NOT NULL DEFAULT '1',
        "start_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "comment" text,
        "status" "public"."quotes_status_enum" NOT NULL DEFAULT 'NOUVELLE_DEMANDE',
        "amount_ttc" numeric(10,2) NOT NULL DEFAULT '0',
        "currency" character varying(3) NOT NULL DEFAULT 'EUR',
        "payment_session_id" character varying,
        "payment_intent_id" character varying,
        "payment_paid_at" TIMESTAMP WITH TIME ZONE,
        "proposal_details" jsonb,
        "proposal_message" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "archived_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_quotes_public_reference" UNIQUE ("public_reference"),
        CONSTRAINT "PK_quotes_id" PRIMARY KEY ("id")
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "quotes"`);
    await queryRunner.query(`DROP TYPE "public"."quotes_status_enum"`);
  }
}

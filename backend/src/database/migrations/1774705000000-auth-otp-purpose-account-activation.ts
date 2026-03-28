import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthOtpPurposeAccountActivation1774705000000
  implements MigrationInterface
{
  name = 'AuthOtpPurposeAccountActivation1774705000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'auth_otps_purpose_enum'
            AND e.enumlabel = 'ACCOUNT_ACTIVATION'
        ) THEN
          ALTER TYPE "public"."auth_otps_purpose_enum"
          ADD VALUE 'ACCOUNT_ACTIVATION';
        END IF;
      END
      $$;
    `);
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing enum values safely in a reversible way.
  }
}

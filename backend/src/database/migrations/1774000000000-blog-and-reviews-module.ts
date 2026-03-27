import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogAndReviewsModule1774000000000 implements MigrationInterface {
  name = 'BlogAndReviewsModule1774000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."blog_articles_status_enum" AS ENUM('DRAFT', 'PUBLISHED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "blog_articles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(255) NOT NULL,
        "slug" character varying(255) NOT NULL,
        "excerpt" text,
        "content" text NOT NULL,
        "category" character varying(100),
        "main_image_url" character varying,
        "status" "public"."blog_articles_status_enum" NOT NULL DEFAULT 'DRAFT',
        "published_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_blog_articles_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_blog_articles_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."reviews_status_enum" AS ENUM('DRAFT', 'PUBLISHED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "author_name" character varying(255) NOT NULL,
        "title" character varying(255),
        "rating" integer NOT NULL DEFAULT 5,
        "content" text NOT NULL,
        "image_url" character varying,
        "status" "public"."reviews_status_enum" NOT NULL DEFAULT 'PUBLISHED',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reviews_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_blog_articles_status" ON "blog_articles" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_status" ON "reviews" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_reviews_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_blog_articles_status"`);
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(`DROP TYPE "public"."reviews_status_enum"`);
    await queryRunner.query(`DROP TABLE "blog_articles"`);
    await queryRunner.query(`DROP TYPE "public"."blog_articles_status_enum"`);
  }
}

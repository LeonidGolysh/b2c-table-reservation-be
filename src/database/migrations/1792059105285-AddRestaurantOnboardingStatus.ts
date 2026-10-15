import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRestaurantOnboardingStatus1792059105285 implements MigrationInterface {
  name = 'AddRestaurantOnboardingStatus1792059105285';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."restaurants_onboarding_status_enum" AS ENUM('INPR', 'PAYP', 'CMPD')`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurants" ADD "onboarding_status" "public"."restaurants_onboarding_status_enum" NOT NULL DEFAULT 'INPR'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "restaurants" DROP COLUMN "onboarding_status"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."restaurants_onboarding_status_enum"`,
    );
  }
}

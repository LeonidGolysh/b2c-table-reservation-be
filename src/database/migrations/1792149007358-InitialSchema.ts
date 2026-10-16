import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1792149007358 implements MigrationInterface {
  name = 'InitialSchema1792149007358';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."workers_role_enum" AS ENUM('ADM', 'OWN', 'MGR', 'STF')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workers" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, "lastname" character varying(50) NOT NULL, "phone_number" character varying(10) NOT NULL, "email" character varying(100) NOT NULL, "password" character varying NOT NULL, "role" "public"."workers_role_enum" NOT NULL, "restaurant_id" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_87f2092ffaae628ef63547d2442" UNIQUE ("email"), CONSTRAINT "CHK_workers_restaurant_by_role" CHECK (("role" IN ('ADM', 'OWN') AND "restaurant_id" IS NULL) OR ("role" IN ('MGR', 'STF') AND "restaurant_id" IS NOT NULL)), CONSTRAINT "PK_e950c9aba3bd84a4f193058d838" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "restaurant_addresses" ("id" SERIAL NOT NULL, "country" character varying(50) NOT NULL, "city" character varying(100) NOT NULL, "street" character varying(255) NOT NULL, "building_number" character varying(5) NOT NULL, "postal_code" character varying(5), "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "restaurant_id" integer, CONSTRAINT "PK_39927b1630f1c0316d49280b76d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, "lastname" character varying(50) NOT NULL, "phone_number" character varying(10) NOT NULL, "email" character varying(100) NOT NULL, "password" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" SERIAL NOT NULL, "rate" integer NOT NULL, "comment" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "restaurantId" integer, CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('PEN', 'CHK', 'ACT', 'EXP')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_plan_enum" AS ENUM('TST', 'MTH')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_renewal_type_enum" AS ENUM('MNL', 'ATO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" SERIAL NOT NULL, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'PEN', "plan" "public"."subscriptions_plan_enum" NOT NULL, "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "renewal_type" "public"."subscriptions_renewal_type_enum" NOT NULL DEFAULT 'MNL', "stripeCustomerId" character varying, "stripeSubscriptionId" character varying, "restaurantId" integer, CONSTRAINT "REL_8efcb4b7bc1122ed19df1897d2" UNIQUE ("restaurantId"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reservations_status_enum" AS ENUM('PEN', 'CNF', 'CAN', 'CMP', 'NOS')`,
    );
    await queryRunner.query(
      `CREATE TABLE "reservations" ("id" SERIAL NOT NULL, "customer_name" character varying(100) NOT NULL, "customer_email" character varying(100) NOT NULL, "customer_number" character varying(10), "guests_count" integer NOT NULL, "start_time" TIMESTAMP WITH TIME ZONE NOT NULL, "duration_minutes" integer NOT NULL DEFAULT '120', "buffer_minutes" integer NOT NULL DEFAULT '60', "status" "public"."reservations_status_enum" NOT NULL DEFAULT 'PEN', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "check_in_token_hash" character varying(64), "restaurantId" integer, CONSTRAINT "PK_da95cef71b617ac35dc5bcda243" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ecd53ee1c33357145aecf0cbde" ON "reservations"  ("check_in_token_hash") `,
    );
    await queryRunner.query(
      `CREATE TABLE "reservation_tables" ("id" SERIAL NOT NULL, "reservationId" integer, "restaurantTableId" integer, CONSTRAINT "UQ_684e060fb549cc61d2088bf3ee4" UNIQUE ("reservationId", "restaurantTableId"), CONSTRAINT "PK_2edb8b4ab691f7530e916f84403" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."restaurant_tables_status_enum" AS ENUM('AVL', 'OCC', 'CLN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "restaurant_tables" ("id" SERIAL NOT NULL, "table_number" integer NOT NULL, "seat" integer NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "status" "public"."restaurant_tables_status_enum" NOT NULL DEFAULT 'AVL', "restaurantId" integer, CONSTRAINT "PK_2b4f4ef7ad8394abee2c1f4d57e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."restaurants_onboarding_status_enum" AS ENUM('INPR', 'PAYP', 'CMPD')`,
    );
    await queryRunner.query(
      `CREATE TABLE "restaurants" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "avgRating" double precision NOT NULL DEFAULT '0', "ratingCount" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT false, "onboarding_status" "public"."restaurants_onboarding_status_enum" NOT NULL DEFAULT 'INPR', "owner_id" integer, CONSTRAINT "PK_e2133a72eb1cc8f588f7b503e68" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('SCD', 'FLD', 'PND')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" SERIAL NOT NULL, "stripe_session_id" character varying, "stripe_payment_intent_id" character varying, "stripe_invoice_id" character varying, "stripe-subscription_id" character varying, "amount" integer NOT NULL DEFAULT '0', "currency" character varying NOT NULL DEFAULT 'usd', "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PND', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "restaurantId" integer, "subscriptionId" integer, CONSTRAINT "UQ_6279d48a63868aaa9827a54340e" UNIQUE ("stripe_session_id"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "stripe-event" ("id" SERIAL NOT NULL, "stripe_event_id" character varying NOT NULL, "type" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0c3fd8a6b1c576d37bc262c8ced" UNIQUE ("stripe_event_id"), CONSTRAINT "PK_d3ece923d7554dc72835dccf99f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."emails_type_enum" AS ENUM('PAYC', 'PAYR', 'RSRV')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."emails_status_enum" AS ENUM('sending', 'sent', 'delivered', 'opened', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "emails" ("id" SERIAL NOT NULL, "recipient_emails" character varying(100) NOT NULL, "type" "public"."emails_type_enum" NOT NULL, "status" "public"."emails_status_enum" NOT NULL DEFAULT 'sending', "provider_massage_id" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a54dcebef8d05dca7e839749571" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4d66755eb33aeadcd58fcea85a" ON "emails"  ("recipient_emails") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8838fd8b72d592f6fc3e9b32cc" ON "emails"  ("provider_massage_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "workers" ADD CONSTRAINT "FK_326e45c7d0f90d24b46fd285435" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_addresses" ADD CONSTRAINT "FK_567bf264870b086ccc38483114f" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_92ad8cd051c76d10e284bbc3283" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_8efcb4b7bc1122ed19df1897d22" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservations" ADD CONSTRAINT "FK_f290a56fcecb987c14c68414056" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservation_tables" ADD CONSTRAINT "FK_df1b0aff36e300c2e92e11d8e86" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservation_tables" ADD CONSTRAINT "FK_581ceec1d175fbfc5d3eb656838" FOREIGN KEY ("restaurantTableId") REFERENCES "restaurant_tables"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_tables" ADD CONSTRAINT "FK_e90558dc8b4609f3e7c75b28158" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurants" ADD CONSTRAINT "FK_efe4eead3adf44a4649a3353efc" FOREIGN KEY ("owner_id") REFERENCES "workers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_6dbeb6793f751150ace3326254c" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_2017d0cbfdbfec6b1b388e6aa08" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_2017d0cbfdbfec6b1b388e6aa08"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_6dbeb6793f751150ace3326254c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurants" DROP CONSTRAINT "FK_efe4eead3adf44a4649a3353efc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_tables" DROP CONSTRAINT "FK_e90558dc8b4609f3e7c75b28158"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservation_tables" DROP CONSTRAINT "FK_581ceec1d175fbfc5d3eb656838"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservation_tables" DROP CONSTRAINT "FK_df1b0aff36e300c2e92e11d8e86"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reservations" DROP CONSTRAINT "FK_f290a56fcecb987c14c68414056"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_8efcb4b7bc1122ed19df1897d22"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_92ad8cd051c76d10e284bbc3283"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_addresses" DROP CONSTRAINT "FK_567bf264870b086ccc38483114f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workers" DROP CONSTRAINT "FK_326e45c7d0f90d24b46fd285435"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8838fd8b72d592f6fc3e9b32cc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4d66755eb33aeadcd58fcea85a"`,
    );
    await queryRunner.query(`DROP TABLE "emails"`);
    await queryRunner.query(`DROP TYPE "public"."emails_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."emails_type_enum"`);
    await queryRunner.query(`DROP TABLE "stripe-event"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TABLE "restaurants"`);
    await queryRunner.query(
      `DROP TYPE "public"."restaurants_onboarding_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "restaurant_tables"`);
    await queryRunner.query(
      `DROP TYPE "public"."restaurant_tables_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "reservation_tables"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ecd53ee1c33357145aecf0cbde"`,
    );
    await queryRunner.query(`DROP TABLE "reservations"`);
    await queryRunner.query(`DROP TYPE "public"."reservations_status_enum"`);
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(
      `DROP TYPE "public"."subscriptions_renewal_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."subscriptions_plan_enum"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "restaurant_addresses"`);
    await queryRunner.query(`DROP TABLE "workers"`);
    await queryRunner.query(`DROP TYPE "public"."workers_role_enum"`);
  }
}

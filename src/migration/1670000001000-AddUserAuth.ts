import { MigrationInterface, QueryRunner } from "typeorm"

export class AddUserAuth1670000001000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_user_email" UNIQUE ("email")`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_user_email"`)
    }
}

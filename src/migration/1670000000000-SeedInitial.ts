import { MigrationInterface, QueryRunner } from "typeorm"

export class SeedInitial1670000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Insert a default place
        const placeInsert = await queryRunner.query(`INSERT INTO "place" DEFAULT VALUES RETURNING id`)
        // Insert a default user
        await queryRunner.query(`INSERT INTO "user"("firstName","lastName","status") VALUES ($1,$2,$3)`, ['Timber','Saw', 0])
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove seeded rows (best-effort)
        await queryRunner.query(`DELETE FROM "reservation"`)
        await queryRunner.query(`DELETE FROM "place"`)
        await queryRunner.query(`DELETE FROM "user"`)
    }
}

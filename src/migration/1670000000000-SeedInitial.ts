import { MigrationInterface, QueryRunner } from "typeorm"

export class SeedInitial1670000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {

        for(let i = 1; i <= 10; i++) {
            await queryRunner.query(`INSERT INTO "place"("label","status") VALUES ($1,$2)`, ['A' + i.toString().padStart(2, '0'), 1])
        }
        const rows = ['B', 'C', 'D', 'E']
        for(const row of rows) {
            for(let i = 1; i <= 10; i++) {
                await queryRunner.query(`INSERT INTO "place"("label","status") VALUES ($1,$2)`, [row + i.toString().padStart(2, '0'), 0])
            }
        }
        for(let i = 1; i <= 10; i++) {
            await queryRunner.query(`INSERT INTO "place"("label","status") VALUES ($1,$2)`, ['F' + i.toString().padStart(2, '0'), 1])
        }

        await queryRunner.query(`INSERT INTO "user"("firstName","lastName","status") VALUES ($1,$2,$3)`, ['Timber','Saw', 0])
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove seeded rows (best-effort)
        await queryRunner.query(`DELETE FROM "reservation"`)
        await queryRunner.query(`DELETE FROM "place"`)
        await queryRunner.query(`DELETE FROM "user"`)
    }
}

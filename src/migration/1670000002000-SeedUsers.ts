import { MigrationInterface, QueryRunner } from "typeorm"
import * as bcrypt from "bcryptjs"

export class SeedUsers1670000002000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hashedPassword = await bcrypt.hash('password123', 10)

        await queryRunner.query(
            `INSERT INTO "user"("firstName","lastName","email","password","status") VALUES ($1,$2,$3,$4,$5)`,
            ['Jean', 'Dupont', 'jean.dupont@company.com', hashedPassword, 0]
        )
        await queryRunner.query(
            `INSERT INTO "user"("firstName","lastName","email","password","status") VALUES ($1,$2,$3,$4,$5)`,
            ['Marie', 'Martin', 'marie.martin@company.com', hashedPassword, 0]
        )

        await queryRunner.query(
            `INSERT INTO "user"("firstName","lastName","email","password","status") VALUES ($1,$2,$3,$4,$5)`,
            ['Sophie', 'Bernard', 'sophie.bernard@company.com', hashedPassword, 1]
        )

        await queryRunner.query(
            `INSERT INTO "user"("firstName","lastName","email","password","status") VALUES ($1,$2,$3,$4,$5)`,
            ['Pierre', 'Dubois', 'pierre.dubois@company.com', hashedPassword, 2]
        )

        await queryRunner.query(
            `INSERT INTO "user"("firstName","lastName","email","password","status") VALUES ($1,$2,$3,$4,$5)`,
            ['Admin', 'System', 'admin@company.com', hashedPassword, 3]
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "user" WHERE "email" IN ($1, $2, $3, $4, $5)`, [
            'jean.dupont@company.com',
            'marie.martin@company.com',
            'sophie.bernard@company.com',
            'pierre.dubois@company.com',
            'admin@company.com'
        ])
    }
}

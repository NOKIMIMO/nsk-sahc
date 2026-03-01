import { DataSource } from "typeorm"
import { User } from "../entity/User"
import { Place } from "../entity/Place"
import { Reservation } from "../entity/Reservation"

export class TestHelper {
    private dbConnect!: DataSource
    private schema: string

    constructor() {
        this.schema = `test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    }

    getRepo(entity: any) { return this.dbConnect.getRepository(entity) }
    getDataSource() { return this.dbConnect }

    async setupTestDB() {
        const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env

        const bootstrap = new DataSource({
            type: "postgres",
            host: DB_HOST,
            port: parseInt(DB_PORT || "5432"),
            username: DB_USER,
            password: DB_PASSWORD,
            database: DB_DATABASE,
        })
        await bootstrap.initialize()
        await bootstrap.query(`CREATE SCHEMA IF NOT EXISTS "${this.schema}"`)
        await bootstrap.destroy()

        this.dbConnect = new DataSource({
            type: "postgres",
            host: DB_HOST,
            port: parseInt(DB_PORT || "5432"),
            username: DB_USER,
            password: DB_PASSWORD,
            database: DB_DATABASE,
            schema: this.schema,
            entities: [User, Place, Reservation],
            synchronize: true,
        })
        await this.dbConnect.initialize()
    }

    async teardownTestDB() {
        if (this.dbConnect?.isInitialized) await this.dbConnect.destroy()

        const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env
        const bootstrap = new DataSource({
            type: "postgres",
            host: DB_HOST,
            port: parseInt(DB_PORT || "5432"),
            username: DB_USER,
            password: DB_PASSWORD,
            database: DB_DATABASE,
        })
        await bootstrap.initialize()
        await bootstrap.query(`DROP SCHEMA IF EXISTS "${this.schema}" CASCADE`)
        await bootstrap.destroy()
    }
}

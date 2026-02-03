import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User"
import { Place } from "./entity/Place"
import { Reservation } from "./entity/Reservation"
import { config } from "dotenv"
import * as path from "path"

config({ path: path.resolve(__dirname, "..", ".env") })

const DB_HOST = process.env.DB_HOST
const DB_PORT = process.env.DB_PORT
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_USERNAME = process.env.DB_USERNAME ?? process.env.DB_USER
const DB_NAME = process.env.DB_NAME ?? process.env.DB_DATABASE

const missing: string[] = []
if (!DB_HOST) missing.push("DB_HOST")
if (!DB_PORT) missing.push("DB_PORT")
if (!DB_PASSWORD) missing.push("DB_PASSWORD")
if (!DB_USERNAME) missing.push("DB_USERNAME or DB_USER")
if (!DB_NAME) missing.push("DB_NAME or DB_DATABASE")
if (missing.length) throw new Error(`Environment variables missing: ${missing.join(", ")}`)

export const AppDataSource = new DataSource({
    type: "postgres",
    host: DB_HOST,
    port: Number(DB_PORT),
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
    synchronize: true,
    logging: false,
    entities: [User, Place, Reservation],
    migrations: [__dirname + "/migration/*{.ts,.js}"],
    subscribers: [],
})

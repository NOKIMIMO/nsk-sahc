import { DataSource } from "typeorm"
import { User } from "../entity/User"
import { Place } from "../entity/Place"
import { Reservation, ReservationStatus } from "../entity/Reservation"
import { createReservation, isPlaceLocked, expireOldReservations } from "../service/reservationService"
import userType from "../type/UserType"

class TestHelper {
    private static _instance: TestHelper

    private constructor() {}

    public static get instance(): TestHelper {
        if (!this._instance) this._instance = new TestHelper()
        return this._instance
    }

    private dbConnect!: DataSource

    getRepo(entity: any) {
        return this.dbConnect.getRepository(entity)
    }

    async setupTestDB() {
        const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE } = process.env

        this.dbConnect = new DataSource({
            name: `unit-tests-${Date.now()}`,
            type: "postgres",
            host: DB_HOST,
            port: parseInt(DB_PORT || "5432"),
            username: DB_USER,
            password: DB_PASSWORD,
            database: DB_DATABASE,
            entities: [User, Place, Reservation],
            synchronize: true,
            dropSchema: true
        })

        await this.dbConnect.initialize()
    }

    async teardownTestDB() {
        if (this.dbConnect?.isInitialized) {
            await this.dbConnect.destroy()
        }
    }
}

const testHelper = TestHelper.instance

beforeEach(async () => {
    await testHelper.setupTestDB()
})

afterEach(async () => {
    await testHelper.teardownTestDB()
})

test("create reservation and lock behavior", async () => {
    const userRepo = testHelper.getRepo(User)
    const placeRepo = testHelper.getRepo(Place)
    const resRepo = testHelper.getRepo(Reservation)

    const user = userRepo.create({ firstName: "A", lastName: "B", status: userType.EMPLOYEE })
    const savedUser = await userRepo.save(user)

    const place = placeRepo.create({})
    const savedPlace = await placeRepo.save(place)

    const reservation = await createReservation(savedPlace.id, savedUser.id, testHelper["dbConnect"])
    expect(reservation.status).toBe(ReservationStatus.LOCKED)

    // cannot create another while locked
    await expect(createReservation(savedPlace.id, savedUser.id, testHelper["dbConnect"])).rejects.toThrow(/already reserved/)

    // expire and then can create
    reservation.expiresAt = new Date(Date.now() - 1000)
    await resRepo.save(reservation)
    await expireOldReservations(testHelper["dbConnect"])

    const reloaded = await resRepo.findOne({ where: { id: reservation.id } })
    expect(reloaded?.status).toBe(ReservationStatus.EXPIRED)

    const reservation2 = await createReservation(savedPlace.id, savedUser.id, testHelper["dbConnect"])
    expect(reservation2.status).toBe(ReservationStatus.LOCKED)
})
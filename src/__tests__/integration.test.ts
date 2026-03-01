import { Place } from "../entity/Place"
import { User } from "../entity/User"
import { Reservation } from "../entity/Reservation"
import { createReservation, checkInReservation, expireOldReservations } from "../service/reservationService"
import { getAllWithAvailability } from "../service/placeService"
import { getParkingAnalytics } from "../service/analyticsService"
import userType from "../type/UserType"
import placeType from "../type/PlaceType"
import { TestHelper } from "./testHelper"

const testHelper = new TestHelper()

beforeEach(async () => { await testHelper.setupTestDB() })
afterEach(async () => { await testHelper.teardownTestDB() })

test("reserved place shows as occupied in availability list", async () => {
    const userRepo = testHelper.getRepo(User)
    const placeRepo = testHelper.getRepo(Place)
    const user = await userRepo.save(userRepo.create({ firstName: "A", lastName: "B", email: "a@test.com", password: "x", status: userType.EMPLOYEE }))
    const place = await placeRepo.save(placeRepo.create({ label: "A01", status: placeType.DEFAULT }))

    await createReservation(place.id, user.id, testHelper.getDataSource())

    const places = await getAllWithAvailability(testHelper.getDataSource())

    expect(places.find(p => p.id === "A01")?.isOccupied).toBe(true)
})

test("checked-in place still shows as occupied in availability list", async () => {
    const userRepo = testHelper.getRepo(User)
    const placeRepo = testHelper.getRepo(Place)
    const user = await userRepo.save(userRepo.create({ firstName: "A", lastName: "B", email: "a@test.com", password: "x", status: userType.EMPLOYEE }))
    const place = await placeRepo.save(placeRepo.create({ label: "A01", status: placeType.DEFAULT }))

    await createReservation(place.id, user.id, testHelper.getDataSource())
    await checkInReservation(place.label, "09:00", testHelper.getDataSource())

    const places = await getAllWithAvailability(testHelper.getDataSource())

    expect(places.find(p => p.id === "A01")?.isOccupied).toBe(true)
})

test("expired reservation makes place available again", async () => {
    const userRepo = testHelper.getRepo(User)
    const placeRepo = testHelper.getRepo(Place)
    const resRepo = testHelper.getRepo(Reservation)
    const user = await userRepo.save(userRepo.create({ firstName: "A", lastName: "B", email: "a@test.com", password: "x", status: userType.EMPLOYEE }))
    const place = await placeRepo.save(placeRepo.create({ label: "A01", status: placeType.DEFAULT }))

    const reservation = await createReservation(place.id, user.id, testHelper.getDataSource())
    reservation.expiresAt = new Date(Date.now() - 60000)
    await resRepo.save(reservation)
    await expireOldReservations(testHelper.getDataSource())

    const places = await getAllWithAvailability(testHelper.getDataSource())

    expect(places.find(p => p.id === "A01")?.isOccupied).toBe(false)
})

test("analytics reflects current occupancy after reservation", async () => {
    const userRepo = testHelper.getRepo(User)
    const placeRepo = testHelper.getRepo(Place)
    const user = await userRepo.save(userRepo.create({ firstName: "A", lastName: "B", email: "a@test.com", password: "x", status: userType.EMPLOYEE }))
    const place = await placeRepo.save(placeRepo.create({ label: "A01", status: placeType.DEFAULT }))

    await createReservation(place.id, user.id, testHelper.getDataSource())

    const analytics = await getParkingAnalytics(testHelper.getDataSource())

    expect(analytics.currentOccupancy).toBe(1)
    expect(analytics.totalPlaces).toBe(1)
})

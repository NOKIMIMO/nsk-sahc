import { Place } from "../entity/Place"
import { User } from "../entity/User"
import { getAllWithAvailability } from "../service/placeService"
import { createReservation, checkInReservation } from "../service/reservationService"
import placeType from "../type/PlaceType"
import userType from "../type/UserType"
import { TestHelper } from "./testHelper"

const testHelper = new TestHelper()

beforeEach(async () => { await testHelper.setupTestDB() })
afterEach(async () => { await testHelper.teardownTestDB() })

test("new place is available by default", async () => {
    const placeRepo = testHelper.getRepo(Place)
    await placeRepo.save(placeRepo.create({ label: "A01", status: placeType.DEFAULT }))

    const places = await getAllWithAvailability(testHelper.getDataSource())

    expect(places[0].isOccupied).toBe(false)
})

test("reserved place shows as occupied", async () => {
    const userRepo = testHelper.getRepo(User)
    const placeRepo = testHelper.getRepo(Place)
    const user = await userRepo.save(userRepo.create({ firstName: "A", lastName: "B", email: "a@test.com", password: "x", status: userType.EMPLOYEE }))
    const place = await placeRepo.save(placeRepo.create({ label: "A01", status: placeType.DEFAULT }))

    await createReservation(place.id, user.id, testHelper.getDataSource())

    const places = await getAllWithAvailability(testHelper.getDataSource())

    expect(places[0].isOccupied).toBe(true)
})

test("checked-in place shows as occupied", async () => {
    const userRepo = testHelper.getRepo(User)
    const placeRepo = testHelper.getRepo(Place)
    const user = await userRepo.save(userRepo.create({ firstName: "A", lastName: "B", email: "a@test.com", password: "x", status: userType.EMPLOYEE }))
    const place = await placeRepo.save(placeRepo.create({ label: "A01", status: placeType.DEFAULT }))

    await createReservation(place.id, user.id, testHelper.getDataSource())
    await checkInReservation(place.label, "09:00", testHelper.getDataSource())

    const places = await getAllWithAvailability(testHelper.getDataSource())

    expect(places[0].isOccupied).toBe(true)
})

test("electric place is flagged as electric", async () => {
    const placeRepo = testHelper.getRepo(Place)
    await placeRepo.save(placeRepo.create({ label: "A01", status: placeType.ELEC }))

    const places = await getAllWithAvailability(testHelper.getDataSource())

    expect(places[0].isElectric).toBe(true)
})

test("regular place is not flagged as electric", async () => {
    const placeRepo = testHelper.getRepo(Place)
    await placeRepo.save(placeRepo.create({ label: "A01", status: placeType.DEFAULT }))

    const places = await getAllWithAvailability(testHelper.getDataSource())

    expect(places[0].isElectric).toBe(false)
})

test("two places with the same label are rejected", async () => {
    const placeRepo = testHelper.getRepo(Place)
    await placeRepo.save(placeRepo.create({ label: "D03", status: placeType.DEFAULT }))

    await expect(placeRepo.save(placeRepo.create({ label: "D03", status: placeType.DEFAULT }))).rejects.toThrow()
})

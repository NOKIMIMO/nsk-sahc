import { Place } from "../entity/Place"
import { getParkingAnalytics } from "../service/analyticsService"
import { createReservation, checkInReservation } from "../service/reservationService"
import userType from "../type/UserType"
import placeType from "../type/PlaceType"
import { User } from "../entity/User"
import { TestHelper } from "./testHelper"

const testHelper = new TestHelper()

beforeEach(async () => { await testHelper.setupTestDB() })
afterEach(async () => { await testHelper.teardownTestDB() })

test("empty database returns zero totals", async () => {
    const analytics = await getParkingAnalytics(testHelper.getDataSource())
    expect(analytics.totalPlaces).toBe(0)
    expect(analytics.currentOccupancy).toBe(0)
    expect(analytics.totalReservations).toBe(0)
})

test("counts total parking places", async () => {
    const placeRepo = testHelper.getRepo(Place)
    await placeRepo.save(placeRepo.create({ label: "A01", status: placeType.DEFAULT }))
    await placeRepo.save(placeRepo.create({ label: "A02", status: placeType.DEFAULT }))
    await placeRepo.save(placeRepo.create({ label: "A03", status: placeType.DEFAULT }))

    const analytics = await getParkingAnalytics(testHelper.getDataSource())

    expect(analytics.totalPlaces).toBe(3)
})

test("counts electric places separately from regular places", async () => {
    const placeRepo = testHelper.getRepo(Place)
    await placeRepo.save(placeRepo.create({ label: "A01", status: placeType.DEFAULT }))
    await placeRepo.save(placeRepo.create({ label: "A02", status: placeType.ELEC }))
    await placeRepo.save(placeRepo.create({ label: "A03", status: placeType.ELEC }))

    const analytics = await getParkingAnalytics(testHelper.getDataSource())

    expect(analytics.electricPlaces).toBe(2)
    expect(analytics.totalPlaces).toBe(3)
})

test("reserved place counts as occupied", async () => {
    const userRepo = testHelper.getRepo(User)
    const placeRepo = testHelper.getRepo(Place)
    const user = await userRepo.save(userRepo.create({ firstName: "A", lastName: "B", email: "a@test.com", password: "x", status: userType.EMPLOYEE }))
    const place = await placeRepo.save(placeRepo.create({ label: "B01", status: placeType.DEFAULT }))

    await createReservation(place.id, user.id, testHelper.getDataSource())

    const analytics = await getParkingAnalytics(testHelper.getDataSource())

    expect(analytics.currentOccupancy).toBe(1)
})

test("checked-in reservation counts as occupied", async () => {
    const userRepo = testHelper.getRepo(User)
    const placeRepo = testHelper.getRepo(Place)
    const user = await userRepo.save(userRepo.create({ firstName: "A", lastName: "B", email: "a@test.com", password: "x", status: userType.EMPLOYEE }))
    const place = await placeRepo.save(placeRepo.create({ label: "B01", status: placeType.DEFAULT }))

    await createReservation(place.id, user.id, testHelper.getDataSource())
    await checkInReservation(place.label, "09:00", testHelper.getDataSource())

    const analytics = await getParkingAnalytics(testHelper.getDataSource())

    expect(analytics.currentOccupancy).toBe(1)
    expect(analytics.checkedInReservations).toBe(1)
})

test("free place is not counted as occupied", async () => {
    const placeRepo = testHelper.getRepo(Place)
    await placeRepo.save(placeRepo.create({ label: "C01", status: placeType.DEFAULT }))

    const analytics = await getParkingAnalytics(testHelper.getDataSource())

    expect(analytics.totalPlaces).toBe(1)
    expect(analytics.currentOccupancy).toBe(0)
})

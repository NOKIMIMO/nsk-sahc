import { AppDataSource } from "../data-source"
import { Place } from "../entity/Place"
import { Reservation, ReservationStatus } from "../entity/Reservation"
import { DataSource } from "typeorm"

export async function getAllPlace() {
    const repo = AppDataSource.getRepository(Place)
    return await repo.find()
}

export async function getAllWithAvailability(ds?: DataSource) {
    const dataSrc = ds ?? AppDataSource
    const placeRepo = dataSrc.getRepository(Place)
    
    const now = new Date()
    
    const places = await placeRepo
        .createQueryBuilder("place")
        .leftJoinAndSelect(
            "place.reservations",
            "reservation",
            "reservation.status IN (:...statuses) AND reservation.expiresAt > :now",
            { statuses: [ReservationStatus.LOCKED, ReservationStatus.CHECKED_IN], now }
        )
        .getMany()
    
    return places.map(place => ({
        id: place.label,
        isOccupied: place.reservations.length > 0,
        isElectric: place.status === 1
    }))
}
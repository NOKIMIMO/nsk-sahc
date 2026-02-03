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
    
    // Récupérer toutes les places avec leurs réservations actives
    const places = await placeRepo
        .createQueryBuilder("place")
        .leftJoinAndSelect(
            "place.reservations",
            "reservation",
            "reservation.status = :status AND reservation.expiresAt > :now",
            { status: ReservationStatus.LOCKED, now }
        )
        .getMany()
    
    // Mapper les places avec leur disponibilité
    return places.map(place => ({
        id: place.label,
        isOccupied: place.reservations.length > 0,
        isElectric: place.status === 1
    }))
}
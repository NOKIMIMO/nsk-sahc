import { AppDataSource } from "../data-source"
import { Reservation, ReservationStatus } from "../entity/Reservation"
import { Place } from "../entity/Place"
import { User } from "../entity/User"
import userType from "../type/UserType"
import { DataSource } from "typeorm"

export async function expireOldReservations(ds?: DataSource) {
    const repo = (ds ?? AppDataSource).getRepository(Reservation)
    const now = new Date()
    const expiring = await repo.find({ where: { status: ReservationStatus.LOCKED } })
    const toExpire = expiring.filter(r => r.expiresAt <= now)
    if (toExpire.length === 0) return
    for (const r of toExpire) {
        r.status = ReservationStatus.EXPIRED
    }
    await repo.save(toExpire)
}

export async function expireSelectedReservations(placeLabels: string[], ds?: DataSource) {
    const dataSrc = ds ?? AppDataSource
    const placeRepo = dataSrc.getRepository(Place)
    const resRepo = dataSrc.getRepository(Reservation)
    
    const places = await placeRepo.find({ where: placeLabels.map(label => ({ label })) })
    const placeIds = places.map(p => p.id)
    
    const reservations = await resRepo.find({ where: { status: ReservationStatus.LOCKED } })
    const toExpire = reservations.filter(r => placeIds.includes(r.place.id))
    
    if (toExpire.length === 0) return []
    
    for (const r of toExpire) {
        r.status = ReservationStatus.EXPIRED
    }
    
    return await resRepo.save(toExpire)
}

export async function expireAllReservations(ds?: DataSource) {
    const repo = (ds ?? AppDataSource).getRepository(Reservation)
    const allLocked = await repo.find({ where: { status: ReservationStatus.LOCKED } })
    
    if (allLocked.length === 0) return []
    
    for (const r of allLocked) {
        r.status = ReservationStatus.EXPIRED
    }
    
    return await repo.save(allLocked)
}

export async function isPlaceLocked(placeId: number, ds?: DataSource) {
    const repo = (ds ?? AppDataSource).getRepository(Reservation)
    const now = new Date()
    const active = await repo.createQueryBuilder("r")
        .where("r.place = :placeId", { placeId })
        .andWhere("r.status = :status", { status: ReservationStatus.LOCKED })
        .andWhere("r.expiresAt > :now", { now })
        .getOne()
    return !!active
}

export async function createReservation(placeId: number, userId: number, ds?: DataSource) {
    const dataSrc = ds ?? AppDataSource
    const placeRepo = dataSrc.getRepository(Place)
    const userRepo = dataSrc.getRepository(User)
    const resRepo = dataSrc.getRepository(Reservation)

    const place = await placeRepo.findOne({ where: { id: placeId } })
    if (!place) throw new Error("Place not found")
    const user = await userRepo.findOne({ where: { id: userId } })
    if (!user) throw new Error("User not found")

    await expireOldReservations(dataSrc)

    const locked = await isPlaceLocked(placeId, dataSrc)
    if (locked) throw new Error("Place already reserved")

    const now = new Date()
    const days = user.status === userType.MANAGER ? 7 : 3
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const reservation = new Reservation()
    reservation.place = place
    reservation.user = user
    reservation.status = ReservationStatus.LOCKED
    reservation.expiresAt = expiresAt

    return await resRepo.save(reservation)
}

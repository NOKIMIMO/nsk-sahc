import { AppDataSource } from "../data-source"
import { Reservation, ReservationStatus } from "../entity/Reservation"
import { Place } from "../entity/Place"
import { User } from "../entity/User"
import userType from "../type/UserType"
import { DataSource } from "typeorm"
import { messageQueueService } from "./messageQueueService"

function addWorkingDays(startDate: Date, workingDays: number): Date {
    const result = new Date(startDate)
    let daysAdded = 0
    
    while (daysAdded < workingDays) {
        result.setDate(result.getDate() + 1)
        const dayOfWeek = result.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            daysAdded++
        }
    }
    
    return result
}

export async function expireOldReservations(ds?: DataSource) {
    const repo = (ds ?? AppDataSource).getRepository(Reservation)
    const now = new Date()
    const currentHour = now.getHours()
    
    const expiring = await repo.find({ where: { status: ReservationStatus.LOCKED } })
    const toExpire = expiring.filter(r => {
        if (r.expiresAt <= now) return true
        
        const reservationDate = new Date(r.reservationDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        reservationDate.setHours(0, 0, 0, 0)
        
        const elevenAMToday = new Date()
        elevenAMToday.setHours(11, 0, 0, 0)
        
        if (reservationDate.getTime() === today.getTime() && 
            currentHour >= 11 && 
            !r.isCheckedIn &&
            r.createdAt < elevenAMToday) {
            return true
        }
        
        return false
    })
    
    if (toExpire.length === 0) return
    
    for (const r of toExpire) {
        if (!r.isCheckedIn && r.expiresAt > now) {
            r.status = ReservationStatus.NO_SHOW
        } else {
            r.status = ReservationStatus.EXPIRED
        }
    }
    await repo.save(toExpire)
}

export async function expireSelectedReservations(placeLabels: string[], ds?: DataSource) {
    const dataSrc = ds ?? AppDataSource
    const placeRepo = dataSrc.getRepository(Place)
    const resRepo = dataSrc.getRepository(Reservation)
    
    const places = await placeRepo.find({ where: placeLabels.map(label => ({ label })) })
    
    if (places.length === 0) return []
    
    const placeIds = places.map(p => p.id)
    
    const reservations = await resRepo.createQueryBuilder("r")
        .leftJoinAndSelect("r.place", "place")
        .leftJoinAndSelect("r.user", "user")
        .where("r.status IN (:...statuses)", { statuses: [ReservationStatus.LOCKED, ReservationStatus.CHECKED_IN] })
        .andWhere("place.id IN (:...placeIds)", { placeIds })
        .getMany()
    
    if (reservations.length === 0) return []
    
    for (const r of reservations) {
        r.status = ReservationStatus.CANCELLED
    }
    
    return await resRepo.save(reservations)
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
        .where("r.placeId = :placeId", { placeId })
        .andWhere("r.status IN (:...statuses)", { statuses: [ReservationStatus.LOCKED, ReservationStatus.CHECKED_IN] })
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
    let expiresAt: Date
    
    if (user.status === userType.MANAGER) {
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    } else {
        expiresAt = addWorkingDays(now, 5)
    }

    const reservation = new Reservation()
    reservation.place = place
    reservation.user = user
    reservation.status = ReservationStatus.LOCKED
    reservation.expiresAt = expiresAt
    reservation.reservationDate = now
    reservation.isCheckedIn = false
    reservation.checkedInAt = null

    const savedReservation = await resRepo.save(reservation)
    
    await messageQueueService.sendReservationMessage(
        messageQueueService.createReservationCreatedMessage(savedReservation)
    )

    return savedReservation
}

export async function checkInReservation(placeLabel: string, checkinTime?: string, ds?: DataSource) {
    const dataSrc = ds ?? AppDataSource
    const placeRepo = dataSrc.getRepository(Place)
    const resRepo = dataSrc.getRepository(Reservation)
    
    const place = await placeRepo.findOne({ where: { label: placeLabel } })
    if (!place) throw new Error("Place not found")
    
    const now = new Date()
    let checkinDateTime = now
    
    if (checkinTime) {
        const [hours, minutes] = checkinTime.split(':').map(Number)
        checkinDateTime = new Date()
        checkinDateTime.setHours(hours, minutes, 0, 0)
    }
    
    const reservation = await resRepo.createQueryBuilder("r")
        .leftJoinAndSelect("r.place", "place")
        .leftJoinAndSelect("r.user", "user")
        .where("place.id = :placeId", { placeId: place.id })
        .andWhere("r.status = :status", { status: ReservationStatus.LOCKED })
        .andWhere("r.expiresAt > :now", { now })
        .orderBy("r.createdAt", "DESC")
        .getOne()
    
    if (!reservation) {
        throw new Error("No active reservation found for this place")
    }
    
    if (reservation.isCheckedIn) {
        throw new Error("Reservation already checked in")
    }
    
    const checkinHour = checkinDateTime.getHours()
    if (checkinHour >= 11) {
        console.warn(`Late check-in for place ${placeLabel} at ${checkinTime || checkinDateTime.toTimeString()}`)
    }
    
    reservation.isCheckedIn = true
    reservation.checkedInAt = checkinDateTime
    reservation.status = ReservationStatus.CHECKED_IN
    
    const savedReservation = await resRepo.save(reservation)
    
    await messageQueueService.sendReservationMessage(
        messageQueueService.createReservationCheckedInMessage(savedReservation)
    )
    
    return savedReservation
}

import { AppDataSource } from "../data-source"
import { Reservation, ReservationStatus } from "../entity/Reservation"
import { Place } from "../entity/Place"
import placeType from "../type/PlaceType"
import { DataSource } from "typeorm"

export async function getParkingAnalytics(ds?: DataSource) {
    const dataSrc = ds ?? AppDataSource
    const resRepo = dataSrc.getRepository(Reservation)
    const placeRepo = dataSrc.getRepository(Place)
    
    const totalPlaces = await placeRepo.count()
    
    const electricPlaces = await placeRepo.count({ where: { status: placeType.ELEC } })
    const electricPlacesPercentage = (electricPlaces / totalPlaces) * 100
    
    const now = new Date()
    const activeReservations = await resRepo
        .createQueryBuilder("r")
        .where("r.status IN (:...statuses)", { statuses: [ReservationStatus.LOCKED, ReservationStatus.CHECKED_IN] })
        .andWhere("r.expiresAt > :now", { now })
        .getCount()
    
    const currentOccupancyRate = (activeReservations / totalPlaces) * 100
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentReservations = await resRepo
        .createQueryBuilder("r")
        .where("r.createdAt >= :thirtyDaysAgo", { thirtyDaysAgo })
        .getMany()
    
    const dailyOccupancy = new Map<string, number>()
    
    for (const res of recentReservations) {
        const resDate = res.reservationDate instanceof Date 
            ? res.reservationDate 
            : new Date(res.reservationDate)
        const dateKey = resDate.toISOString().split('T')[0]
        dailyOccupancy.set(dateKey, (dailyOccupancy.get(dateKey) || 0) + 1)
    }
    
    const averageOccupancy = dailyOccupancy.size > 0
        ? (Array.from(dailyOccupancy.values()).reduce((a, b) => a + b, 0) / dailyOccupancy.size)
        : 0
    
    const averageOccupancyRate = (averageOccupancy / totalPlaces) * 100
    
    const totalReservationsLast30Days = recentReservations.length
    const noShowReservations = await resRepo
        .createQueryBuilder("r")
        .where("r.createdAt >= :thirtyDaysAgo", { thirtyDaysAgo })
        .andWhere("r.status = :status", { status: ReservationStatus.NO_SHOW })
        .getCount()
    
    const noShowRate = totalReservationsLast30Days > 0
        ? (noShowReservations / totalReservationsLast30Days) * 100
        : 0
    
    const totalReservations = await resRepo.count()
    
    const checkedInReservations = await resRepo.count({ 
        where: { status: ReservationStatus.CHECKED_IN } 
    })
    
    return {
        totalPlaces,
        electricPlaces,
        electricPlacesPercentage: Math.round(electricPlacesPercentage * 100) / 100,
        currentOccupancy: activeReservations,
        currentOccupancyRate: Math.round(currentOccupancyRate * 100) / 100,
        averageOccupancy: Math.round(averageOccupancy * 100) / 100,
        averageOccupancyRate: Math.round(averageOccupancyRate * 100) / 100,
        totalReservations,
        totalReservationsLast30Days,
        checkedInReservations,
        noShowReservations,
        noShowRate: Math.round(noShowRate * 100) / 100,
        period: {
            from: thirtyDaysAgo.toISOString(),
            to: now.toISOString()
        }
    }
}

export async function getReservationHistory(ds?: DataSource, limit: number = 100) {
    const repo = (ds ?? AppDataSource).getRepository(Reservation)
    
    const reservations = await repo
        .createQueryBuilder("r")
        .leftJoinAndSelect("r.place", "place")
        .leftJoinAndSelect("r.user", "user")
        .orderBy("r.createdAt", "DESC")
        .take(limit)
        .getMany()
    
    return reservations
}

export async function getUserReservationHistory(userId: number, ds?: DataSource) {
    const repo = (ds ?? AppDataSource).getRepository(Reservation)
    
    const reservations = await repo
        .createQueryBuilder("r")
        .leftJoinAndSelect("r.place", "place")
        .leftJoinAndSelect("r.user", "user")
        .where("user.id = :userId", { userId })
        .orderBy("r.createdAt", "DESC")
        .getMany()
    
    return reservations
}

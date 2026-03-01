import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm"
import { Place } from "./Place"
import { User } from "./User"

export enum ReservationStatus {
    LOCKED = "LOCKED",
    CHECKED_IN = "CHECKED_IN",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED",
    NO_SHOW = "NO_SHOW",
}

@Entity()
export class Reservation {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Place, (place) => place.reservations, { nullable: false })
    place: Place

    @ManyToOne(() => User, (user) => user.reservations, { nullable: false })
    user: User

    @Column({ type: "varchar", enum: ReservationStatus, default: ReservationStatus.LOCKED })
    status: ReservationStatus

    @CreateDateColumn()
    createdAt: Date

    @Column({ type: "timestamp" })
    expiresAt: Date

    @Column({ type: "date" })
    reservationDate: Date

    @Column({ type: "timestamp", nullable: true })
    checkedInAt: Date | null

    @Column({ type: "boolean", default: false })
    isCheckedIn: boolean
}
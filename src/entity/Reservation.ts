import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm"
import { Place } from "./Place"
import { User } from "./User"

export enum ReservationStatus {
    LOCKED = "LOCKED",
    EXPIRED = "EXPIRED",
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
}
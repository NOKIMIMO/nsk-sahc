import { Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm"
import { Reservation } from "./Reservation"


@Entity()
export class Place {
    @PrimaryGeneratedColumn()
    id: number

    @OneToMany(() => Reservation, (reservation) => reservation.place)
    reservations: Reservation[]
}
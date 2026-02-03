import { Entity, PrimaryGeneratedColumn, OneToMany, Column } from "typeorm"
import { Reservation } from "./Reservation"
import placeType from "../type/PlaceType"


@Entity()
export class Place {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    label: string

    @Column({ type: "int" })
    status: placeType

    @OneToMany(() => Reservation, (reservation) => reservation.place)
    reservations: Reservation[]

    
}
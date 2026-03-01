import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import userType from "../type/UserType"
import { Reservation } from "./Reservation"

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column({ unique: true })
    email: string

    @Column()
    password: string

    @Column({ type: "int" })
    status: userType

    @OneToMany(() => Reservation, (reservation) => reservation.user)
    reservations: Reservation[]

}

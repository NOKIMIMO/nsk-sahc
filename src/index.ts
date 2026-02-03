import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
import { Place } from "./entity/Place"
import userType from "./type/UserType"
import { createReservation, expireOldReservations } from "./service/reservationService"
import express from "express"
import userRouter from "./routes/user"
import reservationRouter from "./routes/reservation"
import placeRouter from "./routes/place"
import authRouter from "./routes/auth"

AppDataSource.initialize().then(async () => {

    // Run pending migrations (will run only once per migration)
    await AppDataSource.runMigrations()

    // fetch seeded user/place created by migration
    // const users = await AppDataSource.manager.find(User)
    // const places = await AppDataSource.manager.find(Place)
    // const user = users[0]
    // const place = places[0]

    // console.log("Seeded user:", user)
    // console.log("Seeded place:", place)

    // // Example reservation attempt
    // if (user && place) {
    //     try {
    //         const reservation = await createReservation(place.id, user.id)
    //         console.log("Reservation created:", reservation)
    //     } catch (e) {
    //         console.error("Could not create reservation:", e.message)
    //     }
    // }

    await expireOldReservations()

    // Start express and mount route skeletons
    const app = express()
    
    // Enable CORS for frontend
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
        next()
    })
    
    app.use(express.json())
    app.use('/users', userRouter)
    app.use('/reservations', reservationRouter)
    app.use('/places', placeRouter)
    app.use('/auth', authRouter)

    const PORT = process.env.PORT ? Number(process.env.PORT) : 3000
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`))

}).catch(error => console.log(error))

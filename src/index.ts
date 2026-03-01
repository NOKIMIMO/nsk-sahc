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
import dashboardRouter from "./routes/dashboard"
import path from "path"

AppDataSource.initialize().then(async () => {

    await AppDataSource.runMigrations()

    await expireOldReservations()

    const app = express()
    
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
        next()
    })
    
    app.use(express.json())

    app.use(express.static(path.join(__dirname, 'front')))

    app.use('/users', userRouter)
    app.use('/reservations', reservationRouter)
    app.use('/places', placeRouter)
    app.use('/api/auth', authRouter)
    app.use('/dashboard', dashboardRouter)

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'front', 'index.html'))
    })

    const PORT = process.env.PORT ? Number(process.env.PORT) : 3000
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`))

}).catch(error => console.log(error))

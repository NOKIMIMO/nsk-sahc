import { Router } from "express"
import { createReservation } from "../service/reservationService"

const router = Router()

router.post("/", async (req, res) => {
    const { placeId, userId } = req.body
    try {
        const reservation = await createReservation(placeId, userId)
        res.status(201).json(reservation)
    } catch (e) {
        res.status(400).json({ error: e.message })
    }
})

export default router

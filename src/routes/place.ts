import { Router } from "express"
import { isPlaceLocked } from "../service/reservationService"

const router = Router()

router.get("/:id/availability", async (req, res) => {
    const placeId = Number(req.params.id)
    const locked = await isPlaceLocked(placeId)
    res.json({ placeId, available: !locked })
})

export default router

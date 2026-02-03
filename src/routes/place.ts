import { Router } from "express"
import { isPlaceLocked } from "../service/reservationService"
import { getAllPlace, getAllWithAvailability } from "../service/placeService"

const router = Router()

router.get("/:id/availability", async (req, res) => {
    const placeId = Number(req.params.id)
    const locked = await isPlaceLocked(placeId)
    res.json({ placeId, available: !locked })
})

router.get("/", async (req, res) => {
    const places = await getAllWithAvailability()
    res.json({ places: places })
})

export default router

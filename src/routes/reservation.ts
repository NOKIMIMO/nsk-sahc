import { Router } from "express"
import { createReservation } from "../service/reservationService"
import { AppDataSource } from "../data-source"
import { Place } from "../entity/Place"
import { User } from "../entity/User"

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

router.post("/by-label", async (req, res) => {
    const { labels } = req.body
    
    if (!labels || !Array.isArray(labels) || labels.length === 0) {
        return res.status(400).json({ error: "Labels array is required" })
    }
    
    try {
        const placeRepo = AppDataSource.getRepository(Place)
        const userRepo = AppDataSource.getRepository(User)
        
        // Get the first (and only) user
        const user = await userRepo.findOne({ where: {} })
        if (!user) {
            return res.status(404).json({ error: "No user found" })
        }
        
        const results = []
        const errors = []
        
        for (const label of labels) {
            try {
                const place = await placeRepo.findOne({ where: { label } })
                if (!place) {
                    errors.push({ label, error: "Place not found" })
                    continue
                }
                
                const reservation = await createReservation(place.id, user.id)
                results.push({ label, reservation })
            } catch (e) {
                errors.push({ label, error: e.message })
            }
        }
        
        res.status(201).json({ 
            success: results,
            errors: errors,
            total: labels.length,
            created: results.length
        })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

export default router

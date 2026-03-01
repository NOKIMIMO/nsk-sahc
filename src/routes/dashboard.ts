import { Router } from "express"
import { getParkingAnalytics, getReservationHistory, getUserReservationHistory } from "../service/analyticsService"

const router = Router()

router.get("/analytics", async (req, res) => {
    try {
        const analytics = await getParkingAnalytics()
        res.json(analytics)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

router.get("/reservations/history", async (req, res) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 100
        const history = await getReservationHistory(undefined, limit)
        res.json({ reservations: history, count: history.length })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

router.get("/reservations/user/:userId", async (req, res) => {
    try {
        const userId = Number(req.params.userId)
        const history = await getUserReservationHistory(userId)
        res.json({ reservations: history, count: history.length })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

router.get("/history", async (req, res) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 50
        const reservations = await getReservationHistory(undefined, limit)
        
        const formattedHistory = reservations.map(r => ({
            id: r.id,
            placeLabel: r.place?.label || 'N/A',
            userName: r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Utilisateur inconnu',
            userEmail: r.user?.email || '-',
            reservationDate: r.reservationDate,
            isCheckedIn: r.isCheckedIn,
            checkedInAt: r.checkedInAt,
            status: r.status,
            createdAt: r.createdAt
        }))
        
        res.json({ history: formattedHistory, count: formattedHistory.length })
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

export default router

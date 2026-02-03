import { Router } from "express"

const router = Router()

router.post("/login", async (req, res) => {
    // Stub: implement proper auth later
    res.status(501).json({ error: "Not implemented" })
})

export default router

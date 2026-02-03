import { Router } from "express"
import { AppDataSource } from "../data-source"
import { User } from "../entity/User"

const router = Router()
const repo = AppDataSource.getRepository(User)

router.get("/", async (req, res) => {
    const users = await repo.find()
    res.json(users)
})

router.get("/:id", async (req, res) => {
    const id = Number(req.params.id)
    const user = await repo.findOne({ where: { id } })
    if (!user) return res.status(404).send("Not found")
    res.json(user)
})

router.post("/", async (req, res) => {
    const { firstName, lastName, status } = req.body
    const user = repo.create({ firstName, lastName, status })
    await repo.save(user)
    res.status(201).json(user)
})

export default router

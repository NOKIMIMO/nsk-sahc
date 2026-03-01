import { Router } from "express"
import { AppDataSource } from "../data-source"
import { User } from "../entity/User"
import * as bcrypt from "bcryptjs"
import * as crypto from "crypto"

const router = Router()

const tokenStore = new Map<string, { userId: number; expires: Date }>()

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ error: "Email et mot de passe requis" })
        }

        const userRepository = AppDataSource.getRepository(User)
        const user = await userRepository.findOne({ where: { email } })

        if (!user) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect" })
        }

        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) {
            return res.status(401).json({ error: "Email ou mot de passe incorrect" })
        }

        const token = crypto.randomBytes(32).toString('hex')
        const expires = new Date()
        expires.setHours(expires.getHours() + 24)

        tokenStore.set(token, { userId: user.id, expires })

        res.json({
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                status: user.status
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ error: "Erreur serveur" })
    }
})

router.post("/logout", (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
        tokenStore.delete(token)
    }
    res.json({ message: "Déconnecté" })
})

router.get("/verify", async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '')
        
        if (!token) {
            return res.status(401).json({ error: "Non authentifié" })
        }

        const session = tokenStore.get(token)
        if (!session || session.expires < new Date()) {
            if (session) tokenStore.delete(token)
            return res.status(401).json({ error: "Session expirée" })
        }

        const userRepository = AppDataSource.getRepository(User)
        const user = await userRepository.findOne({ where: { id: session.userId } })

        if (!user) {
            tokenStore.delete(token)
            return res.status(401).json({ error: "Utilisateur non trouvé" })
        }

        res.json({
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                status: user.status
            }
        })
    } catch (error) {
        console.error('Verify error:', error)
        res.status(500).json({ error: "Erreur serveur" })
    }
})

export default router

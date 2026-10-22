import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { config } from './config'
import routes from './routes'
import { errorHandler, notFound } from './middleware/errorHandler'

const app = express()

// ── Security & compression ────────────────────────────────────────────────────
app.use(helmet())
app.use(compression())

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: config.env === 'production'
    ? [config.frontendUrl]
    : ['http://localhost:5173', 'http://localhost:3000', config.frontendUrl],
  credentials: true,
}))

// ── Rate limiting ─────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many requests' } })

app.use('/api/', generalLimiter)
app.use('/api/auth/send-otp', authLimiter)
app.use('/api/auth/verify-otp', authLimiter)

// ── Body parsing ──────────────────────────────────────────────────────────────
// Webhook route gets raw body (defined in bookings.routes.ts)
app.use('/api/bookings/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', routes)

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

export default app

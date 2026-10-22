import { Router } from 'express'
import authRoutes from './auth.routes'
import slotsRoutes from './slots.routes'
import poojasRoutes from './poojas.routes'
import bookingsRoutes from './bookings.routes'
import accountRoutes from './account.routes'
import poojaPassRoutes from './poojaPass.routes'
import contentRoutes from './content.routes'
import adminRoutes from './admin.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/slots', slotsRoutes)
router.use('/poojas', poojasRoutes)
router.use('/bookings', bookingsRoutes)
router.use('/account', accountRoutes)
router.use('/pooja-pass', poojaPassRoutes)
router.use('/content', contentRoutes)
router.use('/admin', adminRoutes)

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default router

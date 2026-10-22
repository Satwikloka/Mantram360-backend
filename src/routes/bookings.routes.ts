import { Router, raw } from 'express'
import { bookingsController } from '../controllers/bookings.controller'
import { requireAuth, optionalAuth } from '../middleware/auth'

const router = Router()

// Razorpay webhook — must receive raw body for signature verification
router.post('/webhook', raw({ type: 'application/json' }), bookingsController.webhook)

// Booking creation — optional auth (guest users allowed)
router.post('/one-to-one/initiate', optionalAuth, bookingsController.initiateOTO)
router.post('/group/initiate', optionalAuth, bookingsController.initiateGroup)

// Payment confirmation
router.post('/confirm', optionalAuth, bookingsController.confirmPayment)

export default router

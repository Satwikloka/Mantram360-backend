import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.post('/send-otp', authController.sendOtp)
router.post('/verify-otp', authController.verifyOtp)
router.get('/me', requireAuth, authController.getMe)

// Admin auth
router.post('/admin/login', authController.adminLogin)

export default router

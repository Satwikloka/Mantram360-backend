import { Router } from 'express'
import { accountController } from '../controllers/account.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)

router.get('/profile', accountController.getProfile)
router.put('/profile', accountController.updateProfile)

router.get('/family-members', accountController.getFamilyMembers)
router.post('/family-members', accountController.addFamilyMember)
router.put('/family-members/:id', accountController.updateFamilyMember)
router.delete('/family-members/:id', accountController.deleteFamilyMember)

router.get('/bookings', accountController.getMyBookings)
router.get('/bookings/:id', accountController.getBookingById)
router.post('/bookings/:id/sankalpam', accountController.submitSankalpam)

router.get('/recordings', accountController.getMyRecordings)
router.get('/package-purchases', accountController.getMyPackagePurchases)

export default router

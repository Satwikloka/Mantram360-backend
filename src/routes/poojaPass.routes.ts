import { Router } from 'express'
import { poojaPassController } from '../controllers/poojaPass.controller'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/config', poojaPassController.getConfig)
router.get('/my-pass', requireAuth, poojaPassController.getMyPass)
router.post('/initiate', requireAuth, poojaPassController.initiatePurchase)
router.post('/confirm', requireAuth, poojaPassController.confirmPurchase)

export default router

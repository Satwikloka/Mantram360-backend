import { Router } from 'express'
import { poojasController } from '../controllers/poojas.controller'

const router = Router()

// One-to-One poojas
router.get('/one-to-one', poojasController.listOneToOne)
router.get('/one-to-one/:slug', poojasController.getOneToOne)

// Group poojas
router.get('/group', poojasController.listGroup)
router.get('/group/:slug', poojasController.getGroup)

// Group packages
router.get('/packages', poojasController.listPackages)
router.get('/packages/:slug', poojasController.getPackage)

// Categories & occasions
router.get('/categories', poojasController.listCategories)
router.get('/occasions', poojasController.listOccasions)

export default router

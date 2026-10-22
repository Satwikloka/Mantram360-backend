import { Router } from 'express'
import { adminController } from '../controllers/admin.controller'
import { requireAdmin } from '../middleware/auth'

const router = Router()

router.use(requireAdmin)

// Dashboard
router.get('/dashboard', adminController.getDashboard)

// Bookings
router.get('/bookings', adminController.listBookings)
router.get('/bookings/:ref', adminController.getBooking)
router.patch('/bookings/:ref', adminController.updateBookingStatus)
router.post('/bookings/:ref/send-live-link', adminController.sendLiveLink)

// One-to-One Poojas
router.get('/poojas/one-to-one', adminController.listOneToOnePoojas)
router.post('/poojas/one-to-one', adminController.createOneToOnePooja)
router.put('/poojas/one-to-one/:id', adminController.updateOneToOnePooja)
router.delete('/poojas/one-to-one/:id', adminController.deleteOneToOnePooja)

// Group Poojas
router.get('/poojas/group', adminController.listGroupPoojas)
router.post('/poojas/group', adminController.createGroupPooja)
router.put('/poojas/group/:id', adminController.updateGroupPooja)

// Group Packages
router.get('/packages', adminController.listGroupPackages)
router.post('/packages', adminController.createGroupPackage)
router.put('/packages/:id', adminController.updateGroupPackage)

// Customers
router.get('/customers', adminController.listCustomers)

// Pooja Pass
router.get('/pooja-pass/config', adminController.getPassConfig)
router.put('/pooja-pass/config', adminController.updatePassConfig)
router.get('/pooja-pass/passes', adminController.listPasses)

// Package Purchases
router.get('/package-purchases', adminController.listPackagePurchases)

// Content Management
router.post('/faqs', adminController.createFaq)
router.put('/faqs/:id', adminController.updateFaq)
router.delete('/faqs/:id', adminController.deleteFaq)

router.post('/testimonials', adminController.createTestimonial)
router.put('/testimonials/:id', adminController.updateTestimonial)

router.post('/gallery', adminController.createGalleryItem)
router.put('/gallery/:id', adminController.updateGalleryItem)

router.post('/recordings', adminController.createRecording)
router.put('/recordings/:id', adminController.updateRecording)

router.post('/blogs', adminController.createBlog)
router.put('/blogs/:id', adminController.updateBlog)

// Settings
router.get('/settings', adminController.getSettings)
router.put('/settings', adminController.updateSettings)

// Admin user creation (superadmin only — protect further if needed)
router.post('/users', adminController.createAdminUser)

export default router

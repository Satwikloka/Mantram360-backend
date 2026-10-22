import { Router } from 'express'
import { contentController } from '../controllers/content.controller'

const router = Router()

router.get('/faqs', contentController.getFaqs)
router.get('/gallery', contentController.getGallery)
router.get('/testimonials', contentController.getTestimonials)
router.get('/recordings', contentController.getRecordings)
router.get('/blogs', contentController.listBlogs)
router.get('/blogs/:slug', contentController.getBlog)

export default router

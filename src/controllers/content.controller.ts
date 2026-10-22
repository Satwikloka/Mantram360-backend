import { Request, Response } from 'express'
import { prisma } from '../config/prisma'

export const contentController = {
  async getFaqs(req: Request, res: Response) {
    const { category } = req.query
    const faqs = await prisma.faq.findMany({
      where: { is_active: true, ...(category ? { category: String(category) } : {}) },
      orderBy: { sort_order: 'asc' },
    })
    res.json({ success: true, faqs })
  },

  async getGallery(_req: Request, res: Response) {
    const items = await prisma.galleryItem.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    })
    res.json({ success: true, gallery: items })
  },

  async getTestimonials(_req: Request, res: Response) {
    const items = await prisma.testimonial.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    })
    res.json({ success: true, testimonials: items })
  },

  async getRecordings(_req: Request, res: Response) {
    const items = await prisma.recording.findMany({
      where: { is_active: true },
      orderBy: [{ sort_order: 'asc' }, { id: 'desc' }],
    })
    res.json({ success: true, recordings: items })
  },

  async listBlogs(req: Request, res: Response) {
    const { category, page = 1, limit = 12 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = { is_active: true, ...(category ? { category: String(category) } : {}) }

    const [total, blogs] = await Promise.all([
      prisma.blog.count({ where }),
      prisma.blog.findMany({
        where,
        select: { id: true, slug: true, title: true, subtitle: true, author: true, image_url: true, category: true, tags: true, published_at: true },
        orderBy: { published_at: 'desc' },
        skip,
        take: Number(limit),
      }),
    ])

    res.json({
      success: true,
      blogs,
      pagination: { total, page: Number(page), limit: Number(limit) },
    })
  },

  async getBlog(req: Request, res: Response) {
    const { slug } = req.params
    const blog = await prisma.blog.findUnique({ where: { slug } })

    if (!blog || !blog.is_active) {
      res.status(404).json({ success: false, message: 'Blog post not found' })
      return
    }

    res.json({ success: true, blog })
  },
}

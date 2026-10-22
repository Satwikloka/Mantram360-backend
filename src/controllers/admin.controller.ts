import { Request, Response } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/prisma'
import { whatsappService } from '../services/whatsapp.service'

export const adminController = {
  // ── Dashboard ────────────────────────────────────────────────────────────

  async getDashboard(_req: Request, res: Response) {
    const [totalBookings, paidBookings, pendingBookings, totalUsers, activePasses] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { payment_status: 'paid' } }),
      prisma.booking.count({ where: { payment_status: 'pending' } }),
      prisma.user.count(),
      prisma.customerPass.count({ where: { is_active: true } }),
    ])

    // Revenue this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)

    const monthlyBookings = await prisma.booking.findMany({
      where: { payment_status: 'paid', created_at: { gte: startOfMonth } },
      select: { breakdown: true },
    })
    const monthlyRevenue = monthlyBookings.reduce((sum, b) => {
      const bd = b.breakdown as Record<string, number>
      return sum + (bd?.finalTotal ?? 0)
    }, 0)

    // Recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: { payment_status: 'paid' },
      orderBy: { created_at: 'desc' },
      take: 10,
    })

    res.json({
      success: true,
      stats: { totalBookings, paidBookings, pendingBookings, totalUsers, activePasses, monthlyRevenue },
      recentBookings,
    })
  },

  // ── Bookings Management ──────────────────────────────────────────────────

  async listBookings(req: Request, res: Response) {
    const { page = 1, limit = 20, status, type, search } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where: Record<string, unknown> = {}
    if (status) where['status'] = String(status)
    if (type) where['booking_type'] = String(type)
    if (search) {
      const q = String(search)
      where['OR'] = [
        { booking_ref: { contains: q } },
        { customer_name: { contains: q } },
        { customer_mobile: { contains: q } },
      ]
    }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({ where, orderBy: { created_at: 'desc' }, skip, take: Number(limit) }),
    ])

    res.json({ success: true, bookings, pagination: { total, page: Number(page), limit: Number(limit) } })
  },

  async getBooking(req: Request, res: Response) {
    const booking = await prisma.booking.findFirst({ where: { booking_ref: req.params.ref } })
    if (!booking) { res.status(404).json({ success: false, message: 'Not found' }); return }
    res.json({ success: true, booking })
  },

  async updateBookingStatus(req: Request, res: Response) {
    const { status, currentStage, meetUrl, youtubeUrl, recordingUrl, recordingData } = z.object({
      status: z.enum(['confirmed', 'completed', 'cancelled']).optional(),
      currentStage: z.string().optional(),
      meetUrl: z.string().url().optional(),
      youtubeUrl: z.string().url().optional(),
      recordingUrl: z.string().url().optional(),
      recordingData: z.record(z.unknown()).optional(),
    }).parse(req.body)

    const booking = await prisma.booking.findFirst({ where: { booking_ref: req.params.ref } })
    if (!booking) { res.status(404).json({ success: false, message: 'Not found' }); return }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        ...(status && { status }),
        ...(currentStage && { current_stage: currentStage }),
        ...(meetUrl !== undefined && { meet_url: meetUrl }),
        ...(youtubeUrl !== undefined && { youtube_url: youtubeUrl, current_stage: 'live_access_ready' }),
        ...(recordingUrl !== undefined && { recording_url: recordingUrl, current_stage: 'recording_available' }),
        ...(recordingData && { recording_data: recordingData as never }),
      },
    })

    res.json({ success: true, booking: updated })
  },

  async sendLiveLink(req: Request, res: Response) {
    const booking = await prisma.booking.findFirst({ where: { booking_ref: req.params.ref } })
    if (!booking) { res.status(404).json({ success: false, message: 'Not found' }); return }

    const liveUrl = booking.youtube_url ?? booking.meet_url ?? ''
    if (!liveUrl) { res.status(400).json({ success: false, message: 'No live link set on booking' }); return }

    const poojaTitle = (booking.pooja_title as Record<string, string>)?.en ?? ''
    await whatsappService.liveLink(booking.customer_mobile, {
      customerName: booking.customer_name,
      bookingRef: booking.booking_ref,
      poojaTitle,
      liveUrl,
    })

    res.json({ success: true, message: 'Live link sent via WhatsApp' })
  },

  // ── Poojas (One-to-One) Management ──────────────────────────────────────

  async listOneToOnePoojas(_req: Request, res: Response) {
    const poojas = await prisma.oneToOnePooja.findMany({
      include: { packages: { orderBy: { sort_order: 'asc' } } },
      orderBy: { sort_order: 'asc' },
    })
    res.json({ success: true, poojas })
  },

  async createOneToOnePooja(req: Request, res: Response) {
    const pooja = await prisma.oneToOnePooja.create({ data: req.body as never })
    res.status(201).json({ success: true, pooja })
  },

  async updateOneToOnePooja(req: Request, res: Response) {
    const pooja = await prisma.oneToOnePooja.update({
      where: { id: req.params.id },
      data: req.body as never,
    })
    res.json({ success: true, pooja })
  },

  async deleteOneToOnePooja(req: Request, res: Response) {
    await prisma.oneToOnePooja.update({ where: { id: req.params.id }, data: { is_active: false } })
    res.json({ success: true })
  },

  // ── Group Poojas Management ──────────────────────────────────────────────

  async listGroupPoojas(_req: Request, res: Response) {
    const poojas = await prisma.groupPooja.findMany({ orderBy: { sort_order: 'asc' } })
    res.json({ success: true, poojas })
  },

  async createGroupPooja(req: Request, res: Response) {
    const pooja = await prisma.groupPooja.create({ data: req.body as never })
    res.status(201).json({ success: true, pooja })
  },

  async updateGroupPooja(req: Request, res: Response) {
    const pooja = await prisma.groupPooja.update({ where: { id: req.params.id }, data: req.body as never })
    res.json({ success: true, pooja })
  },

  // ── Group Packages Management ────────────────────────────────────────────

  async listGroupPackages(_req: Request, res: Response) {
    const packages = await prisma.groupPackage.findMany({ orderBy: { display_order: 'asc' } })
    res.json({ success: true, packages })
  },

  async createGroupPackage(req: Request, res: Response) {
    const pkg = await prisma.groupPackage.create({ data: req.body as never })
    res.status(201).json({ success: true, package: pkg })
  },

  async updateGroupPackage(req: Request, res: Response) {
    const pkg = await prisma.groupPackage.update({ where: { id: req.params.id }, data: req.body as never })
    res.json({ success: true, package: pkg })
  },

  // ── Customers ────────────────────────────────────────────────────────────

  async listCustomers(req: Request, res: Response) {
    const { page = 1, limit = 20, search } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = search ? {
      OR: [
        { mobile: { contains: String(search) } },
        { name: { contains: String(search) } },
      ],
    } : {}

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        include: { _count: { select: { bookings: true } } },
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(limit),
      }),
    ])

    res.json({ success: true, customers: users, pagination: { total, page: Number(page), limit: Number(limit) } })
  },

  // ── Pooja Pass Admin ─────────────────────────────────────────────────────

  async getPassConfig(_req: Request, res: Response) {
    const cfg = await prisma.passConfig.findUnique({ where: { id: 1 } })
    res.json({ success: true, config: cfg })
  },

  async updatePassConfig(req: Request, res: Response) {
    const cfg = await prisma.passConfig.upsert({
      where: { id: 1 },
      create: { id: 1, ...(req.body as object) } as never,
      update: req.body as never,
    })
    res.json({ success: true, config: cfg })
  },

  async listPasses(req: Request, res: Response) {
    const { page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const [total, passes] = await Promise.all([
      prisma.customerPass.count(),
      prisma.customerPass.findMany({
        include: { user: { select: { mobile: true, name: true } } },
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(limit),
      }),
    ])

    res.json({ success: true, passes, pagination: { total, page: Number(page), limit: Number(limit) } })
  },

  // ── Content Management ───────────────────────────────────────────────────

  async createFaq(req: Request, res: Response) {
    const faq = await prisma.faq.create({ data: req.body as never })
    res.status(201).json({ success: true, faq })
  },

  async updateFaq(req: Request, res: Response) {
    const faq = await prisma.faq.update({ where: { id: Number(req.params.id) }, data: req.body as never })
    res.json({ success: true, faq })
  },

  async deleteFaq(req: Request, res: Response) {
    await prisma.faq.update({ where: { id: Number(req.params.id) }, data: { is_active: false } })
    res.json({ success: true })
  },

  async createTestimonial(req: Request, res: Response) {
    const item = await prisma.testimonial.create({ data: req.body as never })
    res.status(201).json({ success: true, testimonial: item })
  },

  async updateTestimonial(req: Request, res: Response) {
    const item = await prisma.testimonial.update({ where: { id: Number(req.params.id) }, data: req.body as never })
    res.json({ success: true, testimonial: item })
  },

  async createGalleryItem(req: Request, res: Response) {
    const item = await prisma.galleryItem.create({ data: req.body as never })
    res.status(201).json({ success: true, item })
  },

  async updateGalleryItem(req: Request, res: Response) {
    const item = await prisma.galleryItem.update({ where: { id: Number(req.params.id) }, data: req.body as never })
    res.json({ success: true, item })
  },

  async createRecording(req: Request, res: Response) {
    const item = await prisma.recording.create({ data: req.body as never })
    res.status(201).json({ success: true, recording: item })
  },

  async updateRecording(req: Request, res: Response) {
    const item = await prisma.recording.update({ where: { id: Number(req.params.id) }, data: req.body as never })
    res.json({ success: true, recording: item })
  },

  async createBlog(req: Request, res: Response) {
    const item = await prisma.blog.create({ data: req.body as never })
    res.status(201).json({ success: true, blog: item })
  },

  async updateBlog(req: Request, res: Response) {
    const item = await prisma.blog.update({ where: { id: Number(req.params.id) }, data: req.body as never })
    res.json({ success: true, blog: item })
  },

  // ── Admin User Management ────────────────────────────────────────────────

  async createAdminUser(req: Request, res: Response) {
    const { username, email, password, role } = z.object({
      username: z.string().min(3),
      email: z.string().email(),
      password: z.string().min(8),
      role: z.string().default('admin'),
    }).parse(req.body)

    const hashed = await bcrypt.hash(password, 12)
    const admin = await prisma.adminUser.create({ data: { username, email, password: hashed, role } })
    res.status(201).json({ success: true, admin: { id: admin.id, username: admin.username, role: admin.role } })
  },

  // ── Settings ─────────────────────────────────────────────────────────────

  async getSettings(_req: Request, res: Response) {
    const settings = await prisma.setting.findMany()
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
    res.json({ success: true, settings: map })
  },

  async updateSettings(req: Request, res: Response) {
    const updates = req.body as Record<string, string>
    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } })
      )
    )
    res.json({ success: true })
  },

  // ── Package Purchases ─────────────────────────────────────────────────────

  async listPackagePurchases(req: Request, res: Response) {
    const { page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const [total, purchases] = await Promise.all([
      prisma.packagePurchase.count(),
      prisma.packagePurchase.findMany({
        include: { package: true },
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(limit),
      }),
    ])

    res.json({ success: true, purchases, pagination: { total, page: Number(page), limit: Number(limit) } })
  },
}

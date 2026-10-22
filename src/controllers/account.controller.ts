import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(200).optional(),
  email: z.string().email().optional(),
  gotram: z.string().max(100).optional(),
  nakshatram: z.string().max(100).optional(),
  rashi: z.string().max(100).optional(),
})

const familyMemberSchema = z.object({
  fullName: z.string().min(2).max(200),
  relationship: z.enum(['self', 'spouse', 'son', 'daughter', 'father', 'mother', 'brother', 'sister', 'other']),
  relationshipLabel: z.string().max(100).optional(),
  gotram: z.string().max(100).optional(),
  nakshatram: z.string().max(100).optional(),
  rashi: z.string().max(100).optional(),
})

export const accountController = {
  async getProfile(req: Request, res: Response) {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { familyMembers: { orderBy: { created_at: 'asc' } } },
    })
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }

    const pass = await prisma.customerPass.findUnique({ where: { user_id: user.id } })

    res.json({
      success: true,
      user: {
        id: `devotee-${user.id}`,
        mobileNumber: user.mobile,
        fullName: user.name ?? '',
        email: user.email,
        gotram: user.gotram,
        nakshatram: user.nakshatram,
        rashi: user.rashi,
        hasPoojaPass: !!(pass?.is_active),
        poojaPassJoinedDate: pass?.purchased_date,
        totalPoojaPassSavings: pass?.total_savings ?? 0,
        createdAt: user.created_at.toISOString(),
        familyMembers: user.familyMembers.map(formatMember),
      },
    })
  },

  async updateProfile(req: Request, res: Response) {
    const data = updateProfileSchema.parse(req.body)
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name: data.fullName,
        email: data.email,
        gotram: data.gotram,
        nakshatram: data.nakshatram,
        rashi: data.rashi,
      },
    })
    res.json({ success: true, user: { id: `devotee-${user.id}`, fullName: user.name, email: user.email } })
  },

  async getFamilyMembers(req: Request, res: Response) {
    const members = await prisma.familyMember.findMany({
      where: { user_id: req.userId! },
      orderBy: { created_at: 'asc' },
    })
    res.json({ success: true, familyMembers: members.map(formatMember) })
  },

  async addFamilyMember(req: Request, res: Response) {
    const existing = await prisma.familyMember.count({ where: { user_id: req.userId! } })
    if (existing >= 10) {
      res.status(400).json({ success: false, message: 'Maximum 10 family members allowed' })
      return
    }

    const data = familyMemberSchema.parse(req.body)
    const member = await prisma.familyMember.create({
      data: {
        user_id: req.userId!,
        full_name: data.fullName,
        relationship: data.relationship,
        relationship_label: data.relationshipLabel,
        gotram: data.gotram,
        nakshatram: data.nakshatram,
        rashi: data.rashi,
      },
    })
    res.status(201).json({ success: true, familyMember: formatMember(member) })
  },

  async updateFamilyMember(req: Request, res: Response) {
    const { id } = req.params
    const data = familyMemberSchema.parse(req.body)

    const member = await prisma.familyMember.findFirst({
      where: { id: parseInt(id), user_id: req.userId! },
    })
    if (!member) { res.status(404).json({ success: false, message: 'Member not found' }); return }

    const updated = await prisma.familyMember.update({
      where: { id: parseInt(id) },
      data: {
        full_name: data.fullName,
        relationship: data.relationship,
        relationship_label: data.relationshipLabel,
        gotram: data.gotram,
        nakshatram: data.nakshatram,
        rashi: data.rashi,
      },
    })
    res.json({ success: true, familyMember: formatMember(updated) })
  },

  async deleteFamilyMember(req: Request, res: Response) {
    const { id } = req.params
    const member = await prisma.familyMember.findFirst({
      where: { id: parseInt(id), user_id: req.userId! },
    })
    if (!member) { res.status(404).json({ success: false, message: 'Member not found' }); return }

    await prisma.familyMember.delete({ where: { id: parseInt(id) } })
    res.json({ success: true })
  },

  async getMyBookings(req: Request, res: Response) {
    const { page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    // Find bookings by user_id or by mobile
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({
        where: { OR: [{ user_id: user.id }, { customer_mobile: user.mobile }] },
      }),
      prisma.booking.findMany({
        where: { OR: [{ user_id: user.id }, { customer_mobile: user.mobile }] },
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(limit),
      }),
    ])

    res.json({
      success: true,
      bookings: bookings.map(formatBooking),
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    })
  },

  async getBookingById(req: Request, res: Response) {
    const { id } = req.params
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }

    const booking = await prisma.booking.findFirst({
      where: {
        booking_ref: id,
        OR: [{ user_id: user.id }, { customer_mobile: user.mobile }],
      },
    })

    if (!booking) { res.status(404).json({ success: false, message: 'Booking not found' }); return }

    res.json({ success: true, booking: formatBooking(booking) })
  },

  async submitSankalpam(req: Request, res: Response) {
    const { id } = req.params
    const { participants } = z.object({
      participants: z.array(z.object({
        personIndex: z.number(),
        fullName: z.string().min(1),
        gotram: z.string(),
        nakshatram: z.string(),
        rashi: z.string().optional(),
        relationshipLabel: z.string().optional(),
      })),
    }).parse(req.body)

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }

    const booking = await prisma.booking.findFirst({
      where: {
        booking_ref: id,
        OR: [{ user_id: user.id }, { customer_mobile: user.mobile }],
      },
    })

    if (!booking) { res.status(404).json({ success: false, message: 'Booking not found' }); return }
    if (booking.payment_status !== 'paid') {
      res.status(400).json({ success: false, message: 'Booking not paid' }); return
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        participants: participants as never,
        sankalpam_status: 'completed',
        current_stage: 'sankalpam_submitted',
      },
    })

    res.json({ success: true, booking: formatBooking(updated) })
  },

  async getMyRecordings(req: Request, res: Response) {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [{ user_id: user.id }, { customer_mobile: user.mobile }],
        status: 'completed',
        recording_url: { not: null },
      },
      orderBy: { created_at: 'desc' },
    })

    res.json({ success: true, recordings: bookings.map(formatBooking) })
  },

  async getMyPackagePurchases(req: Request, res: Response) {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }

    const purchases = await prisma.packagePurchase.findMany({
      where: { OR: [{ user_id: user.id }, { customer_mobile: user.mobile }] },
      orderBy: { created_at: 'desc' },
      include: { package: true },
    })

    res.json({ success: true, purchases })
  },
}

function formatMember(m: { id: number; full_name: string; relationship: string; relationship_label: string | null; gotram: string | null; nakshatram: string | null; rashi: string | null }) {
  return {
    id: `fam-${m.id}`,
    fullName: m.full_name,
    relationship: m.relationship,
    relationshipLabel: m.relationship_label,
    gotram: m.gotram ?? '',
    nakshatram: m.nakshatram ?? '',
    rashi: m.rashi ?? '',
  }
}

function formatBooking(b: Record<string, unknown>) {
  return {
    bookingId: b['booking_ref'],
    poojaId: b['pooja_id'],
    poojaSlug: b['pooja_slug'],
    poojaType: b['booking_type'],
    poojaTitle: b['pooja_title'],
    deity: b['deity'],
    packageName: b['package_name'],
    packagePrice: b['package_price'],
    mode: b['mode'],
    scheduledDate: b['scheduled_date'],
    scheduledSlot: b['scheduled_slot'],
    slotDurationMinutes: b['duration_mins'],
    customerName: b['customer_name'],
    customerMobile: b['customer_mobile'],
    customerEmail: b['customer_email'],
    participantsCount: b['participants_count'],
    selectedAddOns: b['add_ons'],
    breakdown: b['breakdown'],
    status: b['status'],
    sankalpamStatus: b['sankalpam_status'],
    currentStage: b['current_stage'],
    participants: b['participants'],
    meetStatus: {
      meetingUrl: b['meet_url'] ?? '',
      isLive: b['is_live'],
      activeFromText: '',
      channelName: '',
    },
    liveStreamStatus: b['youtube_url'] ? {
      youtubeUrl: b['youtube_url'],
      isLive: b['is_live'],
      channelName: 'Mantram360 Sacred Temple Live',
      accessInstructions: { en: 'Link sent via WhatsApp 2 hours before ceremony.', te: 'కార్యక్రమానికి 2 గంటల ముందు వాట్సాప్‌కు పంపబడుతుంది.' },
    } : undefined,
    templeVenue: b['temple_venue'],
    timeDisplay: b['time_display'],
    tithiInfo: b['tithi_info'],
    recordingDetails: b['recording_data'],
    createdAt: b['created_at'],
  }
}

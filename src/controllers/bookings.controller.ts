import { Request, Response } from 'express'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../config/prisma'
import { paymentService } from '../services/payment.service'
import { pricingService } from '../services/pricing.service'
import { whatsappService } from '../services/whatsapp.service'
import { config } from '../config'

const initiateOTOSchema = z.object({
  poojaSlug: z.string(),
  packageId: z.string(),
  mode: z.enum(['online', 'at_temple']),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledSlot: z.string(),
  slotId: z.string().optional(),
  customerDetails: z.object({
    fullName: z.string().min(2),
    mobileNumber: z.string().regex(/^[6-9]\d{9}$/),
    email: z.string().email().optional(),
    participantsCount: z.number().int().min(1).max(20),
  }),
  addOns: z.object({
    includePrasadam: z.boolean(),
    prasadamAmount: z.number().min(0),
    annadanamAmount: z.number().min(0),
  }),
  applyPoojaPass: z.boolean().default(false),
})

const initiateGroupSchema = z.object({
  poojaSlug: z.string(),
  mode: z.enum(['online', 'at_temple']),
  personsCount: z.number().int().min(1).max(50),
  customerDetails: z.object({
    fullName: z.string().min(2),
    mobileNumber: z.string().regex(/^[6-9]\d{9}$/),
    email: z.string().email().optional(),
  }),
  addOns: z.object({
    includePrasadam: z.boolean(),
    prasadamAmount: z.number().min(0),
    annadanamAmount: z.number().min(0),
  }),
  applyPoojaPass: z.boolean().default(false),
})

const confirmPaymentSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
})

export const bookingsController = {
  // ── One-to-One booking ───────────────────────────────────────────────────

  async initiateOTO(req: Request, res: Response) {
    const data = initiateOTOSchema.parse(req.body)

    // Fetch pooja + package from DB (server computes price, client cannot forge it)
    const pooja = await prisma.oneToOnePooja.findUnique({
      where: { slug: data.poojaSlug },
      include: { packages: true },
    })
    if (!pooja || !pooja.is_active) {
      res.status(404).json({ success: false, message: 'Pooja not found' })
      return
    }

    const pkg = pooja.packages.find((p) => p.id === data.packageId)
    if (!pkg) {
      res.status(404).json({ success: false, message: 'Package not found' })
      return
    }

    // Enforce 48h lead time
    const ceremony = new Date(`${data.scheduledDate}T00:00:00+05:30`)
    const hoursUntil = (ceremony.getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < config.slot.minLeadHours) {
      res.status(400).json({ success: false, message: `Minimum ${config.slot.minLeadHours} hours advance booking required.` })
      return
    }

    // Compute pass discount
    let passDiscount = 0
    if (data.applyPoojaPass && req.userId) {
      const pass = await prisma.customerPass.findUnique({ where: { user_id: req.userId } })
      if (pass?.is_active) {
        passDiscount = pricingService.getPassDiscount(pass.benefits_used_count, 'one_to_one')
      }
    }

    // Server-side pricing
    const breakdown = pricingService.recomputeFromPackage(
      pkg.price,
      data.customerDetails.participantsCount,
      data.addOns,
      passDiscount,
    )

    const bookingRef = `M360-BK-${Math.floor(100000 + Math.random() * 900000)}`
    const amountPaise = breakdown.finalTotal * 100

    // Create Razorpay order
    const order = await paymentService.createOrder({
      amountPaise,
      receipt: bookingRef,
      notes: { bookingRef, poojaSlug: data.poojaSlug, mobile: data.customerDetails.mobileNumber },
    })

    // Create pending booking record
    await prisma.booking.create({
      data: {
        booking_ref: bookingRef,
        user_id: req.userId ?? null,
        booking_type: 'one_to_one',
        pooja_id: pooja.id,
        pooja_slug: pooja.slug,
        pooja_title: pooja.title as never,
        deity: pooja.deity as never,
        package_name: (pkg.name as unknown as object) as never,
        package_price: pkg.price,
        mode: data.mode,
        scheduled_date: data.scheduledDate,
        scheduled_slot: data.scheduledSlot,
        duration_mins: pkg.duration_mins,
        customer_name: data.customerDetails.fullName,
        customer_mobile: data.customerDetails.mobileNumber,
        customer_email: data.customerDetails.email,
        participants_count: data.customerDetails.participantsCount,
        add_ons: data.addOns as never,
        breakdown: breakdown as never,
        status: 'confirmed',
        sankalpam_status: 'pending',
        current_stage: 'booking_confirmed',
        razorpay_order_id: order.id,
        payment_status: 'pending',
      },
    })

    await paymentService.recordPayment({
      razorpayOrderId: order.id,
      amountPaise,
      entityType: 'booking',
      entityId: bookingRef,
      status: 'pending',
    })

    res.json({
      success: true,
      orderId: order.id,
      bookingRef,
      amount: amountPaise,
      currency: 'INR',
      breakdown,
      keyId: config.razorpay.keyId,
    })
  },

  // ── Group booking ────────────────────────────────────────────────────────

  async initiateGroup(req: Request, res: Response) {
    const data = initiateGroupSchema.parse(req.body)

    const pooja = await prisma.groupPooja.findUnique({ where: { slug: data.poojaSlug } })
    if (!pooja || !pooja.is_active) {
      res.status(404).json({ success: false, message: 'Group pooja not found' })
      return
    }

    // Check booking cutoff
    const now = new Date()
    if (pooja.next_date <= now) {
      res.status(400).json({ success: false, message: 'Booking window has closed for this event.' })
      return
    }

    const pricePerPerson = data.mode === 'online' ? pooja.price_online : pooja.price_offline

    let passDiscount = 0
    if (data.applyPoojaPass && req.userId) {
      const pass = await prisma.customerPass.findUnique({ where: { user_id: req.userId } })
      if (pass?.is_active) {
        passDiscount = pricingService.getPassDiscount(pass.benefits_used_count, 'group')
      }
    }

    const breakdown = pricingService.calculate({
      basePrice: pricePerPerson,
      personsCount: data.personsCount,
      bookingType: 'group',
      includePrasadam: data.addOns.includePrasadam,
      prasadamPrice: data.addOns.prasadamAmount,
      annadanamAmount: data.addOns.annadanamAmount,
      poojaPassDiscount: passDiscount,
    })

    const bookingRef = `M360-GRP-${Math.floor(100000 + Math.random() * 900000)}`
    const amountPaise = breakdown.finalTotal * 100

    const order = await paymentService.createOrder({
      amountPaise,
      receipt: bookingRef,
      notes: { bookingRef, poojaSlug: data.poojaSlug, type: 'group' },
    })

    const poojaTitle = pooja.title as Record<string, string>
    const nextDate = pooja.next_date

    await prisma.booking.create({
      data: {
        booking_ref: bookingRef,
        user_id: req.userId ?? null,
        booking_type: 'group',
        pooja_id: pooja.id,
        pooja_slug: pooja.slug,
        pooja_title: pooja.title as never,
        deity: pooja.deity as never,
        mode: data.mode,
        scheduled_date: nextDate.toISOString().split('T')[0],
        time_display: pooja.time_display as never,
        tithi_info: pooja.tithi_info as never,
        temple_venue: data.mode === 'at_temple' ? (pooja.venue_name as never) : undefined,
        customer_name: data.customerDetails.fullName,
        customer_mobile: data.customerDetails.mobileNumber,
        customer_email: data.customerDetails.email,
        participants_count: data.personsCount,
        add_ons: data.addOns as never,
        breakdown: breakdown as never,
        status: 'confirmed',
        sankalpam_status: 'pending',
        current_stage: 'booking_confirmed',
        razorpay_order_id: order.id,
        payment_status: 'pending',
      },
    })

    await paymentService.recordPayment({
      razorpayOrderId: order.id,
      amountPaise,
      entityType: 'booking',
      entityId: bookingRef,
      status: 'pending',
    })

    res.json({
      success: true,
      orderId: order.id,
      bookingRef,
      amount: amountPaise,
      currency: 'INR',
      breakdown,
      keyId: config.razorpay.keyId,
      // Info about the event
      poojaTitle: poojaTitle.en,
      scheduledDate: nextDate.toISOString().split('T')[0],
    })
  },

  // ── Confirm payment ──────────────────────────────────────────────────────

  async confirmPayment(req: Request, res: Response) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = confirmPaymentSchema.parse(req.body)

    const valid = paymentService.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)
    if (!valid) {
      res.status(400).json({ success: false, message: 'Invalid payment signature' })
      return
    }

    const booking = await prisma.booking.findFirst({
      where: { razorpay_order_id: razorpayOrderId },
    })

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found for this order' })
      return
    }

    if (booking.payment_status === 'paid') {
      res.json({ success: true, bookingRef: booking.booking_ref, alreadyPaid: true })
      return
    }

    // Generate meet URL for OTO bookings
    const meetCode = uuidv4().substring(0, 11).replace(/-/g, '').replace(/(.{3})(.{4})(.{4})/, '$1-$2-$3')
    const meetUrl = booking.booking_type === 'one_to_one'
      ? `https://meet.google.com/${meetCode}`
      : null

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        payment_status: 'paid',
        razorpay_payment_id: razorpayPaymentId,
        current_stage: 'sankalpam_pending',
        sankalpam_status: 'pending',
        status: 'confirmed',
        meet_url: meetUrl,
      },
    })

    await paymentService.recordPayment({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amountPaise: 0,
      entityType: 'booking',
      entityId: booking.booking_ref,
      status: 'paid',
      webhookVerified: false,
    })

    // Update pass usage if applicable
    if (req.userId) {
      const pass = await prisma.customerPass.findUnique({ where: { user_id: req.userId } })
      const breakdown = booking.breakdown as Record<string, number>
      if (pass && breakdown?.poojaPassDiscount > 0) {
        await prisma.customerPass.update({
          where: { user_id: req.userId },
          data: {
            benefits_used_count: { increment: 1 },
            total_savings: { increment: breakdown.poojaPassDiscount },
          },
        })
      }
    }

    // Send WhatsApp confirmation
    const poojaTitle = (booking.pooja_title as Record<string, string>)?.en ?? ''
    const breakdown = booking.breakdown as Record<string, number>
    whatsappService.bookingConfirmation(booking.customer_mobile, {
      customerName: booking.customer_name,
      bookingRef: booking.booking_ref,
      poojaTitle,
      scheduledDate: booking.scheduled_date,
      scheduledSlot: booking.scheduled_slot ?? undefined,
      finalTotal: breakdown?.finalTotal ?? 0,
    }).catch(console.error)

    res.json({
      success: true,
      bookingRef: booking.booking_ref,
      meetUrl,
      currentStage: 'sankalpam_pending',
    })
  },

  // ── Razorpay webhook (idempotent) ────────────────────────────────────────

  async webhook(req: Request, res: Response) {
    const signature = req.headers['x-razorpay-signature'] as string
    if (!signature) { res.status(400).json({ error: 'No signature' }); return }

    const rawBody = JSON.stringify(req.body)
    const valid = paymentService.verifyWebhookSignature(rawBody, signature)
    if (!valid) { res.status(400).json({ error: 'Invalid signature' }); return }

    const { event, payload } = req.body
    if (event === 'payment.captured') {
      const orderId = payload?.payment?.entity?.order_id
      const paymentId = payload?.payment?.entity?.id

      if (orderId) {
        const booking = await prisma.booking.findFirst({ where: { razorpay_order_id: orderId } })
        if (booking && booking.payment_status !== 'paid') {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { payment_status: 'paid', razorpay_payment_id: paymentId, current_stage: 'sankalpam_pending' },
          })
          await paymentService.recordPayment({
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            amountPaise: 0,
            entityType: 'booking',
            entityId: booking.booking_ref,
            status: 'paid',
            webhookVerified: true,
          })
        }
      }
    }

    res.json({ status: 'ok' })
  },
}

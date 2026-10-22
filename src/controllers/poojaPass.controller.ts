import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { paymentService } from '../services/payment.service'
import { whatsappService } from '../services/whatsapp.service'
import { config } from '../config'

const confirmSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
})

export const poojaPassController = {
  async getConfig(_req: Request, res: Response) {
    let cfg = await prisma.passConfig.findUnique({ where: { id: 1 } })
    if (!cfg) {
      // Return default config
      cfg = {
        id: 1,
        price: 1999,
        name: { en: 'Mantram360 Pooja Pass', te: 'మంత్రం360 పూజా పాస్' } as never,
        tagline: { en: 'Blessings for every occasion', te: 'ప్రతి పర్వానికి దైవ ఆశీర్వాదం' } as never,
        description: { en: 'One-time purchase, lifetime benefits.', te: 'ఒక్కసారి కొనుగోలు, జీవితకాల లబ్ది.' } as never,
        benefits_sequence: [] as never,
        recurring_benefit: {} as never,
        updated_at: new Date(),
      }
    }

    res.json({
      success: true,
      config: {
        price: cfg.price,
        name: cfg.name,
        tagline: cfg.tagline,
        description: cfg.description,
        sequenceOfBenefits: cfg.benefits_sequence,
        subsequentRecurringBenefit: cfg.recurring_benefit,
      },
    })
  },

  async getMyPass(req: Request, res: Response) {
    const pass = await prisma.customerPass.findUnique({ where: { user_id: req.userId! } })

    if (!pass) {
      res.json({ success: true, pass: null })
      return
    }

    res.json({ success: true, pass: formatPass(pass) })
  },

  async initiatePurchase(req: Request, res: Response) {
    const existing = await prisma.customerPass.findUnique({ where: { user_id: req.userId! } })
    if (existing?.is_active) {
      res.status(400).json({ success: false, message: 'You already have an active Pooja Pass' })
      return
    }

    const cfg = await prisma.passConfig.findUnique({ where: { id: 1 } })
    const price = cfg?.price ?? 1999

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }

    const receipt = `M360-PASS-${Date.now()}`
    const order = await paymentService.createOrder({
      amountPaise: price * 100,
      receipt,
      notes: { type: 'pass', userId: String(user.id) },
    })

    await paymentService.recordPayment({
      razorpayOrderId: order.id,
      amountPaise: price * 100,
      entityType: 'pass',
      entityId: `user-${user.id}`,
      status: 'pending',
    })

    res.json({
      success: true,
      orderId: order.id,
      amount: price * 100,
      currency: 'INR',
      keyId: config.razorpay.keyId,
    })
  },

  async confirmPurchase(req: Request, res: Response) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = confirmSchema.parse(req.body)

    const valid = paymentService.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)
    if (!valid) {
      res.status(400).json({ success: false, message: 'Invalid payment signature' })
      return
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return }

    // Idempotent: check if pass already activated for this order
    const existingPass = await prisma.customerPass.findUnique({ where: { user_id: user.id } })
    if (existingPass?.payment_status === 'paid') {
      res.json({ success: true, pass: formatPass(existingPass) })
      return
    }

    const passNumber = `M360-PASS-${Math.floor(1000 + Math.random() * 9000)}`
    const today = new Date().toISOString().split('T')[0]
    const cfg = await prisma.passConfig.findUnique({ where: { id: 1 } })
    const benefitsCount = Array.isArray(cfg?.benefits_sequence) ? (cfg.benefits_sequence as unknown[]).length : 5

    const pass = await prisma.customerPass.upsert({
      where: { user_id: user.id },
      create: {
        pass_number: passNumber,
        user_id: user.id,
        customer_name: user.name ?? user.mobile,
        mobile: user.mobile,
        purchased_date: today,
        is_active: true,
        no_expiry: true,
        total_savings: 0,
        benefits_used_count: 0,
        benefit_history: [] as never,
        razorpay_order_id: razorpayOrderId,
        payment_status: 'paid',
      },
      update: {
        is_active: true,
        razorpay_order_id: razorpayOrderId,
        payment_status: 'paid',
      },
    })

    // Update user hasPoojaPass
    await prisma.user.update({ where: { id: user.id }, data: {} })

    await paymentService.recordPayment({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amountPaise: 0,
      entityType: 'pass',
      entityId: passNumber,
      status: 'paid',
      webhookVerified: false,
    })

    whatsappService.passConfirmation(user.mobile, {
      customerName: user.name ?? 'Devotee',
      passNumber: pass.pass_number,
    }).catch(console.error)

    res.json({ success: true, pass: formatPass(pass) })
  },
}

function formatPass(p: Record<string, unknown>) {
  return {
    passNumber: p['pass_number'],
    mobileNumber: p['mobile'],
    customerName: p['customer_name'],
    purchasedDate: p['purchased_date'],
    isActive: p['is_active'],
    noExpiry: p['no_expiry'],
    totalSavingsRealized: p['total_savings'],
    benefitsUsedCount: p['benefits_used_count'],
    benefitHistory: p['benefit_history'],
  }
}

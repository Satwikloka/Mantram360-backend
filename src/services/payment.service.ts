import Razorpay from 'razorpay'
import crypto from 'crypto'
import { prisma } from '../config/prisma'
import { config } from '../config'

const razorpay = config.razorpay.keyId
  ? new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret })
  : null

export const paymentService = {
  async createOrder(input: {
    amountPaise: number
    receipt: string
    notes?: Record<string, string>
  }) {
    if (!razorpay) throw new Error('Razorpay not configured')

    const order = await razorpay.orders.create({
      amount: input.amountPaise,
      currency: 'INR',
      receipt: input.receipt,
      notes: input.notes,
    })

    return order
  },

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const body = `${orderId}|${paymentId}`
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(body)
      .digest('hex')
    return expectedSignature === signature
  },

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const expected = crypto
      .createHmac('sha256', config.razorpay.webhookSecret)
      .update(rawBody)
      .digest('hex')
    return expected === signature
  },

  async recordPayment(data: {
    razorpayOrderId: string
    razorpayPaymentId?: string
    razorpaySignature?: string
    amountPaise: number
    entityType: string
    entityId: string
    status: string
    webhookVerified?: boolean
  }) {
    return prisma.payment.upsert({
      where: { razorpay_order_id: data.razorpayOrderId },
      create: {
        razorpay_order_id: data.razorpayOrderId,
        razorpay_payment_id: data.razorpayPaymentId,
        razorpay_signature: data.razorpaySignature,
        amount: data.amountPaise,
        entity_type: data.entityType,
        entity_id: data.entityId,
        status: data.status,
        webhook_verified: data.webhookVerified ?? false,
      },
      update: {
        razorpay_payment_id: data.razorpayPaymentId,
        razorpay_signature: data.razorpaySignature,
        status: data.status,
        webhook_verified: data.webhookVerified ?? false,
      },
    })
  },
}

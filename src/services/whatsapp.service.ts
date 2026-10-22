import twilio from 'twilio'
import { prisma } from '../config/prisma'
import { config } from '../config'

const client = config.twilio.accountSid
  ? twilio(config.twilio.accountSid, config.twilio.authToken)
  : null

async function send(to: string, message: string, template: string, entityType?: string, entityId?: string) {
  let status = 'sent'
  let error: string | undefined

  try {
    if (!client) {
      console.log(`[WA Mock] To: ${to} | Template: ${template} | Msg: ${message}`)
    } else {
      await client.messages.create({
        from: config.twilio.whatsappFrom,
        to: `whatsapp:+91${to}`,
        body: message,
      })
    }
  } catch (err: unknown) {
    status = 'failed'
    error = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[WA] Failed to send to ${to}:`, error)
  }

  // Log in DB (non-blocking)
  prisma.whatsappLog
    .create({
      data: { to_mobile: to, template, entity_type: entityType, entity_id: entityId, status, error },
    })
    .catch(() => {})
}

export const whatsappService = {
  async bookingConfirmation(mobile: string, data: {
    customerName: string
    bookingRef: string
    poojaTitle: string
    scheduledDate: string
    scheduledSlot?: string
    finalTotal: number
  }) {
    const msg = `Jai Sri Gurubhyo! 🙏\n\nDear ${data.customerName},\n\nYour Mantram360 booking is confirmed!\n\nBooking ID: *${data.bookingRef}*\nPooja: ${data.poojaTitle}\nDate: ${data.scheduledDate}${data.scheduledSlot ? `\nTime: ${data.scheduledSlot}` : ''}\nAmount Paid: ₹${data.finalTotal}\n\nWe will send Sankalpam details shortly. For queries, reply to this message.\n\nShubhakankshalu! 🌸`
    await send(mobile, msg, 'booking_confirmation', 'booking', data.bookingRef)
  },

  async sankalpamReminder(mobile: string, data: {
    customerName: string
    bookingRef: string
    poojaTitle: string
  }) {
    const msg = `Dear ${data.customerName} 🙏\n\nYour Sankalpam details for *${data.poojaTitle}* (Booking: ${data.bookingRef}) are pending.\n\nPlease log in to your Mantram360 account and submit participant names, Gotram & Nakshatram at the earliest.\n\nShubhakankshalu! 🌸`
    await send(mobile, msg, 'sankalpam_reminder', 'booking', data.bookingRef)
  },

  async liveLink(mobile: string, data: {
    customerName: string
    bookingRef: string
    poojaTitle: string
    liveUrl: string
    ceremonyTime?: string
  }) {
    const msg = `Dear ${data.customerName} 🙏\n\n*${data.poojaTitle}* is starting soon!\n\nYour sacred live stream link:\n${data.liveUrl}\n\n${data.ceremonyTime ? `Ceremony time: ${data.ceremonyTime}\n` : ''}Booking: ${data.bookingRef}\n\nPlease join 5 minutes early and ensure you are ready for Sankalpam.\n\nOm Namah Shivaya 🌺`
    await send(mobile, msg, 'live_link', 'booking', data.bookingRef)
  },

  async meetingLinkReminder(mobile: string, data: {
    customerName: string
    bookingRef: string
    poojaTitle: string
    meetUrl: string
    scheduledSlot: string
    scheduledDate: string
  }) {
    const msg = `Dear ${data.customerName} 🙏\n\nReminder for tomorrow's *${data.poojaTitle}*\n\nDate: ${data.scheduledDate}\nTime: ${data.scheduledSlot}\n\nGoogle Meet link:\n${data.meetUrl}\n\nBooking: ${data.bookingRef}\n\nPlease join 5 minutes early. Ensure good internet connection and a clean, quiet space.\n\nShubhakankshalu! 🌸`
    await send(mobile, msg, 'meeting_reminder', 'booking', data.bookingRef)
  },

  async cancellation(mobile: string, data: {
    customerName: string
    bookingRef: string
    poojaTitle: string
  }) {
    const msg = `Dear ${data.customerName},\n\nYour booking for *${data.poojaTitle}* (${data.bookingRef}) has been cancelled.\n\nIf applicable, the refund will be processed within 5–7 working days.\n\nFor queries, reply to this message.\n\nMantram360 Team 🙏`
    await send(mobile, msg, 'cancellation', 'booking', data.bookingRef)
  },

  async passConfirmation(mobile: string, data: {
    customerName: string
    passNumber: string
  }) {
    const msg = `Jai Sri Gurubhyo! 🙏\n\nDear ${data.customerName},\n\nWelcome to the *Mantram360 Pooja Pass* family!\n\nPass Number: *${data.passNumber}*\n\nYou now enjoy exclusive discounts on every pooja booking. Your pass never expires.\n\nShubhakankshalu! 🌸`
    await send(mobile, msg, 'pass_confirmation', 'pass', data.passNumber)
  },
}

import bcrypt from 'bcryptjs'
import twilio from 'twilio'
import { prisma } from '../config/prisma'
import { config } from '../config'

const twilioClient = config.twilio.accountSid
  ? twilio(config.twilio.accountSid, config.twilio.authToken)
  : null

export const otpService = {
  async send(mobile: string): Promise<{ success: boolean; debugOtp?: string; waitSeconds?: number }> {
    // Enforce resend cooldown
    const recent = await prisma.otpSession.findFirst({
      where: {
        mobile,
        verified: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    })

    if (recent) {
      const secondsAgo = Math.floor((Date.now() - recent.created_at.getTime()) / 1000)
      if (secondsAgo < config.otp.resendCooldownSeconds) {
        return {
          success: false,
          waitSeconds: config.otp.resendCooldownSeconds - secondsAgo,
        }
      }
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const otpHash = await bcrypt.hash(otp, 10)

    // Expire old sessions for this mobile
    await prisma.otpSession.deleteMany({ where: { mobile, verified: false } })

    await prisma.otpSession.create({
      data: {
        mobile,
        otp_hash: otpHash,
        attempts: 0,
        verified: false,
        expires_at: new Date(Date.now() + config.otp.ttlMinutes * 60 * 1000),
      },
    })

    let smsSent = false
    if (twilioClient && config.twilio.fromNumber) {
      try {
        await twilioClient.messages.create({
          body: `Your Mantram360 verification code is: ${otp}. Valid for ${config.otp.ttlMinutes} minutes.`,
          from: config.twilio.fromNumber,
          to: `+91${mobile}`,
        })
        smsSent = true
      } catch (err) {
        console.error('Twilio SMS error:', err)
      }
    }

    return {
      success: true,
      // debugOtp exposed when SMS failed AND either not-production or OTP_DEBUG env var is set
      debugOtp: !smsSent && (config.env !== 'production' || process.env.OTP_DEBUG === 'true') ? otp : undefined,
    }
  },

  async verify(mobile: string, otp: string): Promise<{ success: boolean; error?: string }> {
    const session = await prisma.otpSession.findFirst({
      where: {
        mobile,
        verified: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    })

    if (!session) {
      return { success: false, error: 'OTP expired or not found. Please request a new one.' }
    }

    if (session.attempts >= config.otp.maxAttempts) {
      return { success: false, error: 'Too many attempts. Please request a new OTP.' }
    }

    // Increment attempt count
    await prisma.otpSession.update({
      where: { id: session.id },
      data: { attempts: { increment: 1 } },
    })

    const valid = await bcrypt.compare(otp, session.otp_hash)
    if (!valid) {
      return { success: false, error: 'Invalid OTP. Please check and try again.' }
    }

    await prisma.otpSession.update({
      where: { id: session.id },
      data: { verified: true },
    })

    return { success: true }
  },
}

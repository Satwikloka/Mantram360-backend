import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { config } from '../config'
import { otpService } from '../services/otp.service'

const sendOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
})

const verifyOtpSchema = z.object({
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6),
})

const adminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const authController = {
  async sendOtp(req: Request, res: Response) {
    const { mobile } = sendOtpSchema.parse(req.body)

    const result = await otpService.send(mobile)

    if (!result.success && result.waitSeconds) {
      res.status(429).json({
        success: false,
        message: `Please wait ${result.waitSeconds} seconds before requesting another OTP.`,
        waitSeconds: result.waitSeconds,
      })
      return
    }

    res.json({
      success: true,
      message: 'OTP sent to your mobile number.',
      debugOtp: result.debugOtp, // only non-null in dev when Twilio not configured
    })
  },

  async verifyOtp(req: Request, res: Response) {
    const { mobile, otp } = verifyOtpSchema.parse(req.body)

    const result = await otpService.verify(mobile, otp)
    if (!result.success) {
      res.status(400).json({ success: false, message: result.error })
      return
    }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { mobile },
      create: { mobile },
      update: {},
    })

    const token = jwt.sign(
      { userId: user.id, mobile: user.mobile },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    )

    res.json({
      success: true,
      token,
      user: formatUser(user),
    })
  },

  async getMe(req: Request, res: Response) {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { familyMembers: { orderBy: { created_at: 'asc' } } },
    })

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }

    const pass = await prisma.customerPass.findUnique({ where: { user_id: user.id } })

    res.json({
      success: true,
      user: { ...formatUser(user), familyMembers: user.familyMembers, hasPoojaPass: !!pass?.is_active },
    })
  },

  async adminLogin(req: Request, res: Response) {
    const { username, password } = adminLoginSchema.parse(req.body)

    const admin = await prisma.adminUser.findFirst({
      where: { OR: [{ username }, { email: username }], is_active: true },
    })

    if (!admin) {
      res.status(401).json({ success: false, message: 'Invalid credentials' })
      return
    }

    const valid = await bcrypt.compare(password, admin.password)
    if (!valid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' })
      return
    }

    const token = jwt.sign(
      { adminId: admin.id, username: admin.username, role: admin.role },
      config.adminJwt.secret,
      { expiresIn: config.adminJwt.expiresIn } as jwt.SignOptions
    )

    res.json({ success: true, token, admin: { id: admin.id, username: admin.username, role: admin.role } })
  },
}

function formatUser(user: { id: number; mobile: string; name: string | null; email: string | null; gotram: string | null; nakshatram: string | null; rashi: string | null; created_at: Date }) {
  return {
    id: `devotee-${user.id}`,
    mobileNumber: user.mobile,
    fullName: user.name ?? '',
    email: user.email ?? undefined,
    gotram: user.gotram ?? undefined,
    nakshatram: user.nakshatram ?? undefined,
    rashi: user.rashi ?? undefined,
    createdAt: user.created_at.toISOString(),
  }
}

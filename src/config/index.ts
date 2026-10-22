import dotenv from 'dotenv'
dotenv.config()

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_dev_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },

  adminJwt: {
    secret: process.env.ADMIN_JWT_SECRET || 'fallback_admin_secret',
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
  },

  templeTimezone: process.env.TEMPLE_TIMEZONE || 'Asia/Kolkata',

  // OTP config
  otp: {
    ttlMinutes: 10,
    maxAttempts: 5,
    resendCooldownSeconds: 60,
  },

  // Slot reservation
  slot: {
    holdMinutes: 10,
    minLeadHours: 48,
    maxBookingDays: 60,
  },
} as const

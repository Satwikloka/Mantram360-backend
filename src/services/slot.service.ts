import { prisma } from '../config/prisma'
import { config } from '../config'

export interface MuhurthamSlot {
  id: string
  timeString: string
  period: 'morning' | 'evening'
  durationMinutes: number
  isAvailable: boolean
  unavailableReason?: string
}

export interface DaySchedule {
  dateIso: string
  dayOfWeek: string
  monthShort: string
  dateNumber: number
  fullDisplayDate: string
  isWithin48Hours: boolean
  cutoffExplanation?: string
  slots: MuhurthamSlot[]
}

export const slotService = {
  async getSchedule(poojaSlug: string, durationMinutes: number, daysCount = 10): Promise<DaySchedule[]> {
    const now = new Date()
    const cutoffTime = new Date(now.getTime() + config.slot.minLeadHours * 60 * 60 * 1000)
    const schedules: DaySchedule[] = []

    // Get held slots for this pooja to mark as unavailable
    const heldSlots = await prisma.slotHold.findMany({
      where: { pooja_slug: poojaSlug, expires_at: { gt: now } },
    })
    const heldKeys = new Set(heldSlots.map((h) => `${h.date}-${h.slot_id}`))

    // Get existing confirmed bookings for date-slot conflicts
    const startDate = new Date(now)
    startDate.setDate(now.getDate())
    const bookedSlots = await prisma.booking.findMany({
      where: {
        pooja_slug: poojaSlug,
        payment_status: 'paid',
        scheduled_date: { gte: now.toISOString().split('T')[0] },
      },
      select: { scheduled_date: true, scheduled_slot: true },
    })
    const bookedKeys = new Set(bookedSlots.map((b) => `${b.scheduled_date}-${b.scheduled_slot}`))

    for (let i = 0; i < daysCount; i++) {
      const targetDate = new Date(now)
      targetDate.setDate(now.getDate() + i)
      targetDate.setHours(0, 0, 0, 0)

      const dateIso = targetDate.toISOString().split('T')[0]
      const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'short' })
      const monthShort = targetDate.toLocaleDateString('en-US', { month: 'short' })
      const dateNumber = targetDate.getDate()
      const fullDisplayDate = targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

      const endOfDay = new Date(targetDate)
      endOfDay.setHours(20, 30, 0, 0)
      const isWithin48Hours = endOfDay <= cutoffTime

      const slots: MuhurthamSlot[] = []
      const slotTimes = getSlotTimesForDuration(durationMinutes)

      slotTimes.morning.forEach((t, idx) => {
        const slotId = `${dateIso}-m-${idx}`
        const isHeld = heldKeys.has(`${dateIso}-${slotId}`)
        const isBooked = bookedKeys.has(`${dateIso}-${t}`)
        slots.push({
          id: slotId,
          timeString: t,
          period: 'morning',
          durationMinutes,
          isAvailable: !isWithin48Hours && !isHeld && !isBooked,
          unavailableReason: isWithin48Hours
            ? 'Within 48h Deeksha Window'
            : isHeld ? 'Being reserved' : isBooked ? 'Reserved by another family' : undefined,
        })
      })

      slotTimes.evening.forEach((t, idx) => {
        const slotId = `${dateIso}-e-${idx}`
        const isHeld = heldKeys.has(`${dateIso}-${slotId}`)
        const isBooked = bookedKeys.has(`${dateIso}-${t}`)
        slots.push({
          id: slotId,
          timeString: t,
          period: 'evening',
          durationMinutes,
          isAvailable: !isWithin48Hours && !isHeld && !isBooked,
          unavailableReason: isWithin48Hours
            ? 'Within 48h Deeksha Window'
            : isHeld ? 'Being reserved' : isBooked ? 'Temple Sandhya Archana window' : undefined,
        })
      })

      schedules.push({
        dateIso,
        dayOfWeek,
        monthShort,
        dateNumber,
        fullDisplayDate,
        isWithin48Hours,
        cutoffExplanation: isWithin48Hours
          ? 'Locked per 48-hour Shrouta protocol. Certified Pandits observe fasting deeksha and untainted Samagri is procured.'
          : undefined,
        slots,
      })
    }

    return schedules
  },

  async holdSlot(sessionId: string, poojaSlug: string, date: string, slotId: string, timeString: string) {
    // Release any existing hold for this session+pooja
    await prisma.slotHold.deleteMany({ where: { session_id: sessionId, pooja_slug: poojaSlug } })

    return prisma.slotHold.create({
      data: {
        session_id: sessionId,
        pooja_slug: poojaSlug,
        date,
        slot_id: slotId,
        time_string: timeString,
        expires_at: new Date(Date.now() + config.slot.holdMinutes * 60 * 1000),
      },
    })
  },

  async releaseHold(sessionId: string, poojaSlug: string) {
    await prisma.slotHold.deleteMany({ where: { session_id: sessionId, pooja_slug: poojaSlug } })
  },
}

function getSlotTimesForDuration(durationMinutes: number) {
  if (durationMinutes <= 75) {
    return { morning: ['07:30 AM', '09:15 AM', '11:00 AM'], evening: ['05:00 PM', '06:45 PM', '08:15 PM'] }
  } else if (durationMinutes <= 120) {
    return { morning: ['08:00 AM', '10:30 AM'], evening: ['05:00 PM', '07:30 PM'] }
  } else {
    return { morning: ['07:30 AM (Grand Morning Yajna)'], evening: ['04:30 PM (Grand Pradosha Yajna)'] }
  }
}

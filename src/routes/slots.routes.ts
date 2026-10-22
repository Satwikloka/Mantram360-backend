import { Router } from 'express'
import { Request, Response } from 'express'
import { z } from 'zod'
import { slotService } from '../services/slot.service'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const { poojaSlug, durationMinutes, days } = z.object({
    poojaSlug: z.string(),
    durationMinutes: z.coerce.number().int().min(30).max(300).default(90),
    days: z.coerce.number().int().min(1).max(60).default(10),
  }).parse(req.query)

  const schedule = await slotService.getSchedule(poojaSlug, durationMinutes, days)
  res.json({ success: true, schedule })
})

router.post('/hold', async (req: Request, res: Response) => {
  const { sessionId, poojaSlug, date, slotId, timeString } = z.object({
    sessionId: z.string().min(1),
    poojaSlug: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    slotId: z.string(),
    timeString: z.string(),
  }).parse(req.body)

  const hold = await slotService.holdSlot(sessionId, poojaSlug, date, slotId, timeString)
  res.json({ success: true, hold, expiresAt: hold.expires_at })
})

router.delete('/hold', async (req: Request, res: Response) => {
  const { sessionId, poojaSlug } = z.object({
    sessionId: z.string(),
    poojaSlug: z.string(),
  }).parse(req.body)

  await slotService.releaseHold(sessionId, poojaSlug)
  res.json({ success: true })
})

export default router

import { Request, Response } from 'express'
import { prisma } from '../config/prisma'

export const poojasController = {
  // ── One-to-One Poojas ────────────────────────────────────────────────────

  async listOneToOne(req: Request, res: Response) {
    const { category, search } = req.query

    const poojas = await prisma.oneToOnePooja.findMany({
      where: {
        is_active: true,
        ...(category ? { category_id: String(category) } : {}),
      },
      include: { packages: { orderBy: { sort_order: 'asc' } } },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
    })

    let result = poojas
    if (search) {
      const q = String(search).toLowerCase()
      result = poojas.filter((p) => {
        const title = p.title as Record<string, string>
        return title.en?.toLowerCase().includes(q) || title.te?.toLowerCase().includes(q)
      })
    }

    res.json({ success: true, poojas: result.map(formatOneToOne) })
  },

  async getOneToOne(req: Request, res: Response) {
    const { slug } = req.params

    const pooja = await prisma.oneToOnePooja.findUnique({
      where: { slug },
      include: { packages: { orderBy: { sort_order: 'asc' } } },
    })

    if (!pooja || !pooja.is_active) {
      res.status(404).json({ success: false, message: 'Pooja not found' })
      return
    }

    res.json({ success: true, pooja: formatOneToOne(pooja) })
  },

  // ── Group Poojas ─────────────────────────────────────────────────────────

  async listGroup(req: Request, res: Response) {
    const poojas = await prisma.groupPooja.findMany({
      where: { is_active: true },
      orderBy: [{ sort_order: 'asc' }, { next_date: 'asc' }],
    })

    res.json({ success: true, poojas: poojas.map(formatGroupPooja) })
  },

  async getGroup(req: Request, res: Response) {
    const { slug } = req.params

    const pooja = await prisma.groupPooja.findUnique({ where: { slug } })

    if (!pooja || !pooja.is_active) {
      res.status(404).json({ success: false, message: 'Group pooja not found' })
      return
    }

    res.json({ success: true, pooja: formatGroupPooja(pooja) })
  },

  // ── Group Packages ───────────────────────────────────────────────────────

  async listPackages(req: Request, res: Response) {
    const packages = await prisma.groupPackage.findMany({
      where: { status: 'active' },
      orderBy: { display_order: 'asc' },
    })

    res.json({ success: true, packages })
  },

  async getPackage(req: Request, res: Response) {
    const { slug } = req.params

    const pkg = await prisma.groupPackage.findUnique({ where: { slug } })

    if (!pkg || pkg.status !== 'active') {
      res.status(404).json({ success: false, message: 'Package not found' })
      return
    }

    res.json({ success: true, package: pkg })
  },

  // ── Categories & Occasions ───────────────────────────────────────────────

  async listCategories(_req: Request, res: Response) {
    const categories = await prisma.poojaCategory.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    })
    res.json({ success: true, categories })
  },

  async listOccasions(_req: Request, res: Response) {
    const occasions = await prisma.occasion.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    })
    res.json({ success: true, occasions })
  },
}

function formatOneToOne(p: Record<string, unknown> & { packages?: Record<string, unknown>[] }) {
  return {
    id: p['id'],
    slug: p['slug'],
    categoryId: p['category_id'],
    title: p['title'],
    subtitle: p['subtitle'],
    shortDescription: p['short_desc'],
    fullDescription: p['full_desc'],
    deity: p['deity'],
    tradition: p['tradition'],
    idealDays: p['ideal_days'],
    benefits: p['benefits'],
    modeAvailable: p['mode_available'],
    minLeadHours: p['min_lead_hours'],
    startingPrice: p['starting_price'],
    imageUrl: p['image_url'],
    faqs: p['faqs'],
    deliverablesAfterward: p['deliverables'],
    mantramArrangements: p['arrangements'],
    homePreparationItems: p['home_prep'],
    prerequisites: p['prerequisites'],
    isFlagship: p['is_flagship'],
    occasionIds: p['occasion_ids'],
    durationRange: p['duration_range'],
    relatedPoojaSlugs: p['related_slugs'],
    packages: (p['packages'] ?? []).map((pkg: Record<string, unknown>) => ({
      id: pkg['id'],
      name: pkg['name'],
      tagline: pkg['tagline'],
      durationMinutes: pkg['duration_mins'],
      vedaPanditsCount: pkg['pandits_count'],
      price: pkg['price'],
      features: pkg['features'],
      inclusions: pkg['inclusions'],
      samagriIncluded: pkg['samagri'],
      onlineEligible: pkg['online_eligible'],
      atTempleEligible: pkg['temple_eligible'],
      isPopular: pkg['is_popular'],
      description: pkg['description'],
    })),
  }
}

function formatGroupPooja(p: Record<string, unknown>) {
  return {
    id: p['id'],
    slug: p['slug'],
    title: p['title'],
    subtitle: p['subtitle'],
    deity: p['deity'],
    shortDescription: p['short_desc'],
    fullDescription: p['full_desc'],
    nextScheduledDate: p['next_date'] instanceof Date ? (p['next_date'] as Date).toISOString() : p['next_date'],
    tithiAuspiciousInfo: p['tithi_info'],
    bookingClosesAt: p['booking_closes'],
    timeDisplay: p['time_display'],
    durationMinutes: p['duration_mins'],
    categoryTag: p['category_tag'],
    frequency: p['frequency'],
    pricing: {
      onlinePerPerson: p['price_online'],
      offlinePerPerson: p['price_offline'],
    },
    onlineIncludes: p['online_includes'],
    offlineIncludes: p['offline_includes'],
    deliverablesAfterward: p['deliverables'],
    imageUrl: p['image_url'],
    faqs: p['faqs'],
    sankalpamProcess: p['sankalpam_info'],
    liveParticipationDetails: p['live_info'],
    prasadamDetails: p['prasadam_info'],
    previousHighlights: p['prev_highlights'],
    venueName: p['venue_name'],
  }
}

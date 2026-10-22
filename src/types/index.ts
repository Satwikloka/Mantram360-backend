// Shared types matching frontend TypeScript exactly

export interface LocalizedString {
  en: string
  te: string
}

export type PoojaMode = 'online' | 'at_temple' | 'both'

export interface PaymentBreakdown {
  basePrice: number
  personsCount?: number
  prasadamPrice: number
  annadanamDonation: number
  taxAndFees: number
  poojaPassDiscount: number
  finalTotal: number
}

export interface ParticipantSankalpam {
  personIndex: number
  fullName: string
  gotram: string
  nakshatram: string
  rashi?: string
  relationshipLabel?: string
}

export interface FAQItem {
  id: string
  question: LocalizedString
  answer: LocalizedString
}

export interface PassBenefitItem {
  id: string
  benefitType: 'flat_discount' | 'percentage_discount' | 'free_service'
  discountAmount?: number
  discountPercentage?: number
  applicableOn: 'one_to_one' | 'group' | 'both'
  label: LocalizedString
  description: LocalizedString
}

// Express augmentation for auth
declare global {
  namespace Express {
    interface Request {
      userId?: number
      adminId?: number
      userMobile?: string
    }
  }
}

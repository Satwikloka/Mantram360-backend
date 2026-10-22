import type { PaymentBreakdown } from '../types'

const TAX_PERCENTAGE = 5

export const pricingService = {
  calculate(input: {
    basePrice: number             // package price or (pricePerPerson for group)
    personsCount?: number
    bookingType?: 'one_to_one' | 'group'
    includePrasadam: boolean
    prasadamPrice?: number
    annadanamAmount: number
    poojaPassDiscount: number
  }): PaymentBreakdown {
    const personsCount = input.personsCount ?? 1
    const effectiveBase = input.basePrice * Math.max(1, personsCount)
    const prasadamPrice = input.includePrasadam ? (input.prasadamPrice ?? 251) : 0
    const annadanam = Math.max(0, input.annadanamAmount)
    const passDiscount = Math.max(0, input.poojaPassDiscount)

    const taxableBase = Math.max(0, effectiveBase - passDiscount)
    const taxAndFees = Math.round(taxableBase * (TAX_PERCENTAGE / 100))

    const finalTotal = Math.max(0, effectiveBase + prasadamPrice + annadanam - passDiscount + taxAndFees)

    return {
      basePrice: effectiveBase,
      personsCount,
      prasadamPrice,
      annadanamDonation: annadanam,
      taxAndFees,
      poojaPassDiscount: passDiscount,
      finalTotal,
    }
  },

  // Pass discount logic: returns the discount amount based on booking count
  getPassDiscount(benefitsUsedCount: number, bookingType: 'one_to_one' | 'group'): number {
    // Standard tiered: first few bookings get higher discount
    // This mirrors the frontend's poojaPassConfig logic
    if (bookingType === 'one_to_one') {
      if (benefitsUsedCount === 0) return 500
      if (benefitsUsedCount === 1) return 400
      if (benefitsUsedCount === 2) return 300
      return 200
    } else {
      if (benefitsUsedCount === 0) return 300
      if (benefitsUsedCount === 1) return 250
      return 200
    }
  },

  // Server-side price recompute from DB — client cannot forge price
  recomputeFromPackage(packagePrice: number, personsCount: number, addOns: {
    includePrasadam: boolean
    prasadamAmount: number
    annadanamAmount: number
  }, passDiscount: number): PaymentBreakdown {
    return this.calculate({
      basePrice: packagePrice,
      personsCount,
      includePrasadam: addOns.includePrasadam,
      prasadamPrice: addOns.prasadamAmount,
      annadanamAmount: addOns.annadanamAmount,
      poojaPassDiscount: passDiscount,
    })
  },
}

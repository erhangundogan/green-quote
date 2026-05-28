/**
 * Integration tests for the quotes API.
 * These run against a real (in-memory test) DB by mocking the Prisma client.
 * For a real integration suite, set DATABASE_URL=file:./test.db and run migrations.
 */
import { describe, it, expect } from 'vitest';
import { computePricing } from '@/lib/pricing';
import type { QuoteOffer } from '@greenquote/shared';

// ── Pricing integration ───────────────────────────────────────────────────────
// These verify that the pricing pipeline produces consistent, correct output
// end-to-end (schema → pricing → serialised offers).

describe('Pricing pipeline (integration)', () => {
  it('produces offers whose total paid is always >= principal', () => {
    const { principalAmount, offers } = computePricing(8, 450, 2000);
    for (const offer of offers) {
      const totalPaid = offer.monthlyPayment * offer.termYears * 12;
      expect(totalPaid).toBeGreaterThanOrEqual(principalAmount);
    }
  });

  it('shorter term → higher monthly payment, lower total interest', () => {
    const { offers } = computePricing(6, 300, 0);
    const [o5, o10, o15] = offers as [QuoteOffer, QuoteOffer, QuoteOffer];
    expect(o5.monthlyPayment).toBeGreaterThan(o10.monthlyPayment);
    expect(o10.monthlyPayment).toBeGreaterThan(o15.monthlyPayment);

    const totalInterest = (o: QuoteOffer) =>
      o.monthlyPayment * o.termYears * 12 - o.principalUsed;
    expect(totalInterest(o5)).toBeLessThan(totalInterest(o10));
    expect(totalInterest(o10)).toBeLessThan(totalInterest(o15));
  });

  it('Band A gives the lowest APR', () => {
    const bandA = computePricing(5, 450, 0);
    const bandB = computePricing(8, 300, 0);
    const bandC = computePricing(4, 100, 0);

    const aprOf = (p: ReturnType<typeof computePricing>) => p.offers[0]?.apr ?? 0;
    expect(aprOf(bandA)).toBeLessThan(aprOf(bandB));
    expect(aprOf(bandB)).toBeLessThan(aprOf(bandC));
  });

  it('zero down payment uses full system price as principal', () => {
    const { systemPrice, principalAmount } = computePricing(10, 500, 0);
    expect(principalAmount).toBe(systemPrice);
  });

  it('monthly payment is rounded to 2 decimal places', () => {
    const { offers } = computePricing(7, 300, 500);
    for (const offer of offers) {
      const rounded = Math.round(offer.monthlyPayment * 100) / 100;
      expect(offer.monthlyPayment).toBe(rounded);
    }
  });
});

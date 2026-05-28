import { describe, it, expect } from 'vitest';
import {
  computeSystemPrice,
  computeRiskBand,
  computeMonthlyPayment,
  computeOffers,
  computePricing,
} from '@/lib/pricing';

describe('computeSystemPrice', () => {
  it('multiplies systemSizeKw by 1200', () => {
    expect(computeSystemPrice(5)).toBe(6000);
    expect(computeSystemPrice(10)).toBe(12000);
    expect(computeSystemPrice(0.5)).toBe(600);
  });
});

describe('computeRiskBand', () => {
  it('returns A when consumption >= 400 and size <= 6', () => {
    expect(computeRiskBand(400, 6)).toBe('A');
    expect(computeRiskBand(500, 5)).toBe('A');
    expect(computeRiskBand(400, 3)).toBe('A');
  });

  it('returns B when consumption >= 250 but does not qualify for A', () => {
    expect(computeRiskBand(400, 7)).toBe('B');
    expect(computeRiskBand(250, 10)).toBe('B');
    expect(computeRiskBand(300, 8)).toBe('B');
  });

  it('returns C for consumption < 250', () => {
    expect(computeRiskBand(200, 4)).toBe('C');
    expect(computeRiskBand(100, 1)).toBe('C');
    expect(computeRiskBand(249, 5)).toBe('C');
  });
});

describe('computeMonthlyPayment', () => {
  it('applies standard amortization formula', () => {
    const payment = computeMonthlyPayment(10000, 0.089, 10);
    expect(payment).toBeCloseTo(126.14, 2);
  });

  it('returns principal / n when rate is 0', () => {
    const payment = computeMonthlyPayment(12000, 0, 10);
    expect(payment).toBeCloseTo(100, 5);
  });

  it('produces higher monthly payment for shorter terms', () => {
    const p5 = computeMonthlyPayment(10000, 0.089, 5);
    const p10 = computeMonthlyPayment(10000, 0.089, 10);
    const p15 = computeMonthlyPayment(10000, 0.089, 15);
    expect(p5).toBeGreaterThan(p10);
    expect(p10).toBeGreaterThan(p15);
  });
});

describe('computeOffers', () => {
  it('returns three offers for terms 5, 10, 15', () => {
    const offers = computeOffers(10000, 'A');
    expect(offers).toHaveLength(3);
    expect(offers.map((o) => o.termYears)).toEqual([5, 10, 15]);
  });

  it('uses correct APR for band A (6.9%)', () => {
    const offers = computeOffers(10000, 'A');
    offers.forEach((o) => expect(o.apr).toBe(0.069));
  });

  it('uses correct APR for band B (8.9%)', () => {
    const offers = computeOffers(10000, 'B');
    offers.forEach((o) => expect(o.apr).toBe(0.089));
  });

  it('uses correct APR for band C (11.9%)', () => {
    const offers = computeOffers(10000, 'C');
    offers.forEach((o) => expect(o.apr).toBe(0.119));
  });

  it('sets principalUsed on every offer', () => {
    const offers = computeOffers(8500, 'B');
    offers.forEach((o) => expect(o.principalUsed).toBe(8500));
  });
});

describe('computePricing', () => {
  it('computes full pricing result', () => {
    const result = computePricing(5, 300, 600);
    expect(result.systemPrice).toBe(6000);
    expect(result.principalAmount).toBe(5400);
    expect(result.riskBand).toBe('B');
    expect(result.offers).toHaveLength(3);
  });

  it('clamps principalAmount to 0 when downPayment exceeds price', () => {
    const result = computePricing(5, 300, 99999);
    expect(result.principalAmount).toBe(0);
  });
});

import type { RiskBand, QuoteOffer } from '@greenquote/shared';

const PRICE_PER_KW = 1200;

const APR_BY_BAND: Record<RiskBand, number> = {
  A: 0.069,
  B: 0.089,
  C: 0.119,
};

const OFFER_TERMS = [5, 10, 15] as const;

export function computeSystemPrice(systemSizeKw: number): number {
  return systemSizeKw * PRICE_PER_KW;
}

export function computeRiskBand(monthlyConsumptionKwh: number, systemSizeKw: number): RiskBand {
  if (monthlyConsumptionKwh >= 400 && systemSizeKw <= 6) return 'A';
  if (monthlyConsumptionKwh >= 250) return 'B';
  return 'C';
}

export function computeMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number,
): number {
  const r = annualRate / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  const factor = Math.pow(1 + r, n);
  return (principal * r * factor) / (factor - 1);
}

export function computeOffers(principal: number, band: RiskBand): QuoteOffer[] {
  const apr = APR_BY_BAND[band];
  return OFFER_TERMS.map((termYears) => ({
    termYears,
    apr,
    principalUsed: principal,
    monthlyPayment: Math.round(computeMonthlyPayment(principal, apr, termYears) * 100) / 100,
  }));
}

export interface PricingResult {
  systemPrice: number;
  principalAmount: number;
  riskBand: RiskBand;
  offers: QuoteOffer[];
}

export function computePricing(
  systemSizeKw: number,
  monthlyConsumptionKwh: number,
  downPayment: number,
): PricingResult {
  const systemPrice = computeSystemPrice(systemSizeKw);
  const principalAmount = Math.max(0, systemPrice - downPayment);
  const riskBand = computeRiskBand(monthlyConsumptionKwh, systemSizeKw);
  const offers = computeOffers(principalAmount, riskBand);
  return { systemPrice, principalAmount, riskBand, offers };
}

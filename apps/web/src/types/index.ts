import type { QuoteOffer, RiskBand } from '@greenquote/shared';

export interface QuoteRow {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  address: string;
  monthlyConsumptionKwh: number;
  systemSizeKw: number;
  downPayment: number;
  systemPrice: number;
  principalAmount: number;
  riskBand: RiskBand;
  offers: QuoteOffer[];
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  };
}

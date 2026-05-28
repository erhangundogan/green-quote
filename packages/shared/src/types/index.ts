export type RiskBand = 'A' | 'B' | 'C';
export type UserRole = 'USER' | 'ADMIN';

export interface QuoteOffer {
  termYears: number;
  apr: number;
  principalUsed: number;
  monthlyPayment: number;
}

export interface QuoteResult {
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
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

import { z } from 'zod';

export const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const QuoteInputSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  address: z.string().min(5, 'Address must be at least 5 characters').max(255),
  monthlyConsumptionKwh: z
    .number({ invalid_type_error: 'Monthly consumption must be a number' })
    .positive('Monthly consumption must be positive')
    .max(10_000, 'Monthly consumption must be below 10,000 kWh'),
  systemSizeKw: z
    .number({ invalid_type_error: 'System size must be a number' })
    .positive('System size must be positive')
    .max(1_000, 'System size must be below 1,000 kW'),
  downPayment: z
    .number({ invalid_type_error: 'Down payment must be a number' })
    .min(0, 'Down payment cannot be negative')
    .optional()
    .default(0),
});

export const QuoteOfferSchema = z.object({
  termYears: z.number().int().positive(),
  apr: z.number().positive(),
  principalUsed: z.number().positive(),
  monthlyPayment: z.number().positive(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type QuoteInput = z.infer<typeof QuoteInputSchema>;
export type QuoteOfferInput = z.infer<typeof QuoteOfferSchema>;

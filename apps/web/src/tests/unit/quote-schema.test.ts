import { describe, it, expect } from 'vitest';
import { QuoteInputSchema, RegisterSchema, LoginSchema } from '@greenquote/shared';

describe('QuoteInputSchema', () => {
  const valid = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    address: '123 Solar St, Austin, TX',
    monthlyConsumptionKwh: 350,
    systemSizeKw: 5.5,
  };

  it('accepts a valid quote input', () => {
    expect(QuoteInputSchema.safeParse(valid).success).toBe(true);
  });

  it('defaults downPayment to 0 when omitted', () => {
    const result = QuoteInputSchema.safeParse(valid);
    expect(result.success && result.data.downPayment).toBe(0);
  });

  it('rejects negative monthlyConsumptionKwh', () => {
    const result = QuoteInputSchema.safeParse({ ...valid, monthlyConsumptionKwh: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects zero systemSizeKw', () => {
    const result = QuoteInputSchema.safeParse({ ...valid, systemSizeKw: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative downPayment', () => {
    const result = QuoteInputSchema.safeParse({ ...valid, downPayment: -100 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = QuoteInputSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});

describe('RegisterSchema', () => {
  const valid = {
    fullName: 'John Smith',
    email: 'john@example.com',
    password: 'SecurePass1',
  };

  it('accepts a valid registration', () => {
    expect(RegisterSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects password without uppercase', () => {
    expect(RegisterSchema.safeParse({ ...valid, password: 'nouppercase1' }).success).toBe(false);
  });

  it('rejects password without number', () => {
    expect(RegisterSchema.safeParse({ ...valid, password: 'NoNumbers' }).success).toBe(false);
  });

  it('rejects short password', () => {
    expect(RegisterSchema.safeParse({ ...valid, password: 'Ab1' }).success).toBe(false);
  });
});

describe('LoginSchema', () => {
  it('accepts valid login', () => {
    expect(
      LoginSchema.safeParse({ email: 'a@b.com', password: 'anything' }).success,
    ).toBe(true);
  });

  it('rejects empty password', () => {
    expect(LoginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

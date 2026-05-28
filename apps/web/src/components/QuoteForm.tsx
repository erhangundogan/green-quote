import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QuoteInputSchema, type QuoteInput } from '@greenquote/shared';
import type { AuthUser } from '@greenquote/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { QuoteRow } from '@/types';

interface QuoteFormProps {
  user: AuthUser;
  onSuccess: (quote: QuoteRow) => void;
}

export function QuoteForm({ user, onSuccess }: QuoteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<QuoteInput>({
    resolver: zodResolver(QuoteInputSchema),
    defaultValues: {
      fullName: user.fullName,
      email: user.email,
      downPayment: 0,
    },
  });

  async function onSubmit(data: QuoteInput) {
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = (await res.json()) as { error: string };
      setError('root', { message: body.error ?? 'Something went wrong' });
      return;
    }

    const json = (await res.json()) as { data: QuoteRow };
    onSuccess(json.data);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" {...register('fullName')} aria-describedby="fullName-error" />
          {errors.fullName && (
            <p id="fullName-error" className="text-xs text-destructive">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            aria-describedby="email-error"
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Installation address</Label>
        <Input id="address" {...register('address')} aria-describedby="address-error" />
        {errors.address && (
          <p id="address-error" className="text-xs text-destructive">
            {errors.address.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="monthlyConsumptionKwh">Monthly consumption (kWh)</Label>
          <Input
            id="monthlyConsumptionKwh"
            type="number"
            step="1"
            min="0"
            {...register('monthlyConsumptionKwh', { valueAsNumber: true })}
            aria-describedby="consumption-error"
          />
          {errors.monthlyConsumptionKwh && (
            <p id="consumption-error" className="text-xs text-destructive">
              {errors.monthlyConsumptionKwh.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="systemSizeKw">System size (kW)</Label>
          <Input
            id="systemSizeKw"
            type="number"
            step="0.1"
            min="0"
            {...register('systemSizeKw', { valueAsNumber: true })}
            aria-describedby="system-size-error"
          />
          {errors.systemSizeKw && (
            <p id="system-size-error" className="text-xs text-destructive">
              {errors.systemSizeKw.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="downPayment">Down payment (EUR, optional)</Label>
        <Input
          id="downPayment"
          type="number"
          step="100"
          min="0"
          {...register('downPayment', { valueAsNumber: true })}
          placeholder="0"
          aria-describedby="down-payment-error"
        />
        {errors.downPayment && (
          <p id="down-payment-error" className="text-xs text-destructive">
            {errors.downPayment.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Calculating…' : 'Get pre-qualification'}
      </Button>
    </form>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { QuoteRow } from '@/types';
import type { RiskBand } from '@greenquote/shared';

interface QuoteResultsProps {
  quote: QuoteRow;
}

const BAND_VARIANT: Record<RiskBand, 'success' | 'warning' | 'danger'> = {
  A: 'success',
  B: 'warning',
  C: 'danger',
};

const BAND_LABEL: Record<RiskBand, string> = {
  A: 'Band A — Low risk',
  B: 'Band B — Moderate risk',
  C: 'Band C — Higher risk',
};

export function QuoteResults({ quote }: QuoteResultsProps) {
  const band = quote.riskBand as RiskBand;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              System Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(quote.systemPrice)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Financed Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(quote.principalAmount)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              After {formatCurrency(quote.downPayment)} down payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Risk Band</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={BAND_VARIANT[band]} className="text-sm px-3 py-1">
              {BAND_LABEL[band]}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financing Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table aria-label="Financing offers">
            <TableHeader>
              <TableRow>
                <TableHead>Term</TableHead>
                <TableHead>APR</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Monthly Payment</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.offers.map((offer) => {
                const totalCost = offer.monthlyPayment * offer.termYears * 12;
                return (
                  <TableRow key={offer.termYears}>
                    <TableCell className="font-medium">{offer.termYears} years</TableCell>
                    <TableCell>{formatPercent(offer.apr)}</TableCell>
                    <TableCell>{formatCurrency(offer.principalUsed)}</TableCell>
                    <TableCell>{formatCurrency(offer.monthlyPayment)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(totalCost)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

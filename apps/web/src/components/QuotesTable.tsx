import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { QuoteRow } from '@/types';
import type { RiskBand } from '@greenquote/shared';

// ── Types ──────────────────────────────────────────────────────────────────

export type SortKey = 'user' | 'date' | 'systemSize' | 'price' | 'band';
export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: SortKey;
  dir: SortDir;
}

interface QuotesTableProps {
  quotes: QuoteRow[];
  showUser?: boolean;
  currentUserId?: string | undefined;
}

// ── Constants ──────────────────────────────────────────────────────────────

const BAND_VARIANT: Record<RiskBand, 'success' | 'warning' | 'danger'> = {
  A: 'success',
  B: 'warning',
  C: 'danger',
};

const BAND_ORDER: Record<string, number> = { A: 0, B: 1, C: 2 };

// ── Sorting ────────────────────────────────────────────────────────────────

export function sortQuotes(quotes: QuoteRow[], sort: SortState): QuoteRow[] {
  return [...quotes].sort((a, b) => {
    let cmp = 0;
    switch (sort.key) {
      case 'user':
        cmp = (a.user?.fullName ?? a.fullName).localeCompare(
          b.user?.fullName ?? b.fullName,
        );
        break;
      case 'date':
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'systemSize':
        cmp = a.systemSizeKw - b.systemSizeKw;
        break;
      case 'price':
        cmp = a.systemPrice - b.systemPrice;
        break;
      case 'band':
        cmp = (BAND_ORDER[a.riskBand] ?? 0) - (BAND_ORDER[b.riskBand] ?? 0);
        break;
    }
    return sort.dir === 'asc' ? cmp : -cmp;
  });
}

// ── SortableHead ───────────────────────────────────────────────────────────

interface SortableHeadProps {
  label: string;
  sortKey: SortKey;
  current: SortState;
  onSort: (key: SortKey) => void;
}

function SortableHead({ label, sortKey, current, onSort }: SortableHeadProps) {
  const active = current.key === sortKey;
  const Icon = active ? (current.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <TableHead aria-sort={active ? (current.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        <Icon className={`h-3.5 w-3.5 ${active ? 'text-foreground' : 'text-muted-foreground/50'}`} aria-hidden="true" />
      </button>
    </TableHead>
  );
}

// ── QuotesTable ────────────────────────────────────────────────────────────

export function QuotesTable({ quotes, showUser = false, currentUserId }: QuotesTableProps) {
  const [sort, setSort] = useState<SortState>({ key: 'date', dir: 'desc' });

  function handleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    );
  }

  const sorted = useMemo(() => sortQuotes(quotes, sort), [quotes, sort]);

  if (quotes.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">No quotes found.<br/>Create a new one from the Quotes menu.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showUser && (
            <SortableHead label="User" sortKey="user" current={sort} onSort={handleSort} />
          )}
          <SortableHead label="Date" sortKey="date" current={sort} onSort={handleSort} />
          <SortableHead label="System Size" sortKey="systemSize" current={sort} onSort={handleSort} />
          <SortableHead label="Price" sortKey="price" current={sort} onSort={handleSort} />
          <SortableHead label="Band" sortKey="band" current={sort} onSort={handleSort} />
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((quote) => (
          <TableRow key={quote.id}>
            {showUser && (
              <TableCell>
                <div>
                  <p className="flex items-center gap-2 font-medium">
                    {quote.user?.fullName ?? quote.fullName}
                    {currentUserId && quote.userId === currentUserId && (
                      <Badge variant="success" className="text-xs">Yours</Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{quote.user?.email ?? quote.email}</p>
                </div>
              </TableCell>
            )}
            <TableCell>{formatDate(quote.createdAt)}</TableCell>
            <TableCell>{quote.systemSizeKw} kW</TableCell>
            <TableCell>{formatCurrency(quote.systemPrice)}</TableCell>
            <TableCell>
              <Badge variant={BAND_VARIANT[quote.riskBand as RiskBand]}>
                {quote.riskBand}
              </Badge>
            </TableCell>
            <TableCell>
              <Link href={`/quotes/${quote.id}`}>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

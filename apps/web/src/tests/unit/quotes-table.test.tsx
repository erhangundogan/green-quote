/**
 * Unit tests for QuotesTable sorting.
 *
 * Two layers:
 *  1. Pure function — sortQuotes() is exported and tested in isolation so
 *     every sort key / direction combination has a focused, fast assertion.
 *  2. Component behaviour — renders <QuotesTable> with known data and drives
 *     header clicks through userEvent to verify that the rendered row order
 *     and aria-sort attribute stay in sync.
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { QuotesTable, sortQuotes } from '@/components/QuotesTable';
import type { SortState } from '@/components/QuotesTable';
import type { QuoteRow } from '@/types';

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/router', () => ({
  useRouter: () => ({ push: vi.fn(), query: {}, pathname: '/' }),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────
//
// Three quotes with deliberately different values on every sortable axis:
//   Alice  – Jan, 3 kW, €3 600, Band C
//   Bob    – Mar, 8 kW, €9 600, Band A
//   Charlie– Feb, 5 kW, €6 000, Band B
//
// Expected order per sort:
//   date  asc  → Alice, Charlie, Bob
//   date  desc → Bob, Charlie, Alice   (component default)
//   size  asc  → Alice, Charlie, Bob
//   size  desc → Bob, Charlie, Alice
//   price asc  → Alice, Charlie, Bob
//   price desc → Bob, Charlie, Alice
//   band  asc  → Bob(A), Charlie(B), Alice(C)
//   band  desc → Alice(C), Charlie(B), Bob(A)
//   user  asc  → Alice, Bob, Charlie
//   user  desc → Charlie, Bob, Alice

const ALICE: QuoteRow = {
  id: 'q-alice',
  userId: 'u1',
  fullName: 'Alice',
  email: 'alice@test.com',
  address: '1 A St',
  monthlyConsumptionKwh: 300,
  systemSizeKw: 3,
  downPayment: 0,
  systemPrice: 3600,
  principalAmount: 3600,
  riskBand: 'C',
  offers: [],
  createdAt: '2024-01-15T00:00:00.000Z',
};

const BOB: QuoteRow = {
  id: 'q-bob',
  userId: 'u2',
  fullName: 'Bob',
  email: 'bob@test.com',
  address: '2 B St',
  monthlyConsumptionKwh: 450,
  systemSizeKw: 8,
  downPayment: 0,
  systemPrice: 9600,
  principalAmount: 9600,
  riskBand: 'A',
  offers: [],
  createdAt: '2024-03-20T00:00:00.000Z',
};

const CHARLIE: QuoteRow = {
  id: 'q-charlie',
  userId: 'u3',
  fullName: 'Charlie',
  email: 'charlie@test.com',
  address: '3 C St',
  monthlyConsumptionKwh: 260,
  systemSizeKw: 5,
  downPayment: 0,
  systemPrice: 6000,
  principalAmount: 6000,
  riskBand: 'B',
  offers: [],
  createdAt: '2024-02-10T00:00:00.000Z',
};

const QUOTES = [ALICE, BOB, CHARLIE]; // unsorted input

// Helper: extract the text of the first cell in every data row
function firstCellNames(): string[] {
  const tbody = screen.getAllByRole('rowgroup')[1]!;
  return within(tbody)
    .getAllByRole('row')
    .map((row) => within(row).getAllByRole('cell')[0]!.textContent ?? '');
}

// ── 1. Pure sortQuotes() function ──────────────────────────────────────────

describe('sortQuotes()', () => {
  function sort(key: SortState['key'], dir: SortState['dir']) {
    return sortQuotes(QUOTES, { key, dir }).map((q) => q.fullName);
  }

  it('date asc — oldest first', () => {
    expect(sort('date', 'asc')).toEqual(['Alice', 'Charlie', 'Bob']);
  });

  it('date desc — newest first', () => {
    expect(sort('date', 'desc')).toEqual(['Bob', 'Charlie', 'Alice']);
  });

  it('systemSize asc — smallest first', () => {
    expect(sort('systemSize', 'asc')).toEqual(['Alice', 'Charlie', 'Bob']);
  });

  it('systemSize desc — largest first', () => {
    expect(sort('systemSize', 'desc')).toEqual(['Bob', 'Charlie', 'Alice']);
  });

  it('price asc — cheapest first', () => {
    expect(sort('price', 'asc')).toEqual(['Alice', 'Charlie', 'Bob']);
  });

  it('price desc — most expensive first', () => {
    expect(sort('price', 'desc')).toEqual(['Bob', 'Charlie', 'Alice']);
  });

  it('band asc — A < B < C', () => {
    expect(sort('band', 'asc')).toEqual(['Bob', 'Charlie', 'Alice']);
  });

  it('band desc — C > B > A', () => {
    expect(sort('band', 'desc')).toEqual(['Alice', 'Charlie', 'Bob']);
  });

  it('user asc — alphabetical A→Z', () => {
    expect(sort('user', 'asc')).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('user desc — alphabetical Z→A', () => {
    expect(sort('user', 'desc')).toEqual(['Charlie', 'Bob', 'Alice']);
  });
});

// ── 2. Component behaviour ─────────────────────────────────────────────────

describe('QuotesTable — sort interactions', () => {
  it('default sort is date descending (newest row first)', () => {
    render(<QuotesTable quotes={QUOTES} />);

    // Default: date desc → Bob(Mar), Charlie(Feb), Alice(Jan)
    // The Date column is col 0 when showUser=false
    const tbody = screen.getAllByRole('rowgroup')[1]!;
    const rows = within(tbody).getAllByRole('row');
    expect(rows[0]).toHaveTextContent('20 Mar 2024');
    expect(rows[1]).toHaveTextContent('10 Feb 2024');
    expect(rows[2]).toHaveTextContent('15 Jan 2024');
  });

  it('Date header has aria-sort="descending" by default', () => {
    render(<QuotesTable quotes={QUOTES} />);

    expect(screen.getByRole('columnheader', { name: /date/i })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  it('clicking Date once flips to ascending; aria-sort updates', async () => {
    render(<QuotesTable quotes={QUOTES} />);

    await userEvent.click(screen.getByRole('button', { name: /date/i }));

    expect(screen.getByRole('columnheader', { name: /date/i })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );

    const tbody = screen.getAllByRole('rowgroup')[1]!;
    const rows = within(tbody).getAllByRole('row');
    expect(rows[0]).toHaveTextContent('15 Jan 2024');
    expect(rows[2]).toHaveTextContent('20 Mar 2024');
  });

  it('clicking a different column resets to ascending for that column', async () => {
    render(<QuotesTable quotes={QUOTES} />);

    await userEvent.click(screen.getByRole('button', { name: /system size/i }));

    // System Size asc: Alice(3), Charlie(5), Bob(8)
    expect(screen.getByRole('columnheader', { name: /system size/i })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(screen.getByRole('columnheader', { name: /date/i })).toHaveAttribute(
      'aria-sort',
      'none',
    );
    // First col (Date) in each row — order is now Alice, Charlie, Bob
    const tbody = screen.getAllByRole('rowgroup')[1]!;
    const rows = within(tbody).getAllByRole('row');
    expect(rows[0]).toHaveTextContent('3 kW');
    expect(rows[1]).toHaveTextContent('5 kW');
    expect(rows[2]).toHaveTextContent('8 kW');
  });

  it('clicking the same column twice toggles asc → desc', async () => {
    render(<QuotesTable quotes={QUOTES} />);

    const priceBtn = screen.getByRole('button', { name: /price/i });
    await userEvent.click(priceBtn); // asc
    await userEvent.click(priceBtn); // desc

    expect(screen.getByRole('columnheader', { name: /price/i })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    // Price desc: Bob(9600), Charlie(6000), Alice(3600)
    expect(firstCellNames()[0]).toContain('20 Mar'); // Bob is first
  });

  it('User column sorts alphabetically when showUser=true', async () => {
    render(<QuotesTable quotes={QUOTES} showUser />);

    await userEvent.click(screen.getByRole('button', { name: /user/i }));

    // user asc: Alice, Bob, Charlie
    const tbody = screen.getAllByRole('rowgroup')[1]!;
    const rows = within(tbody).getAllByRole('row');
    expect(rows[0]).toHaveTextContent('Alice');
    expect(rows[1]).toHaveTextContent('Bob');
    expect(rows[2]).toHaveTextContent('Charlie');
  });
});

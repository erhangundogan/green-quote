/* eslint-disable react/display-name */
/**
 * Unit tests for the Layout header.
 *
 * Covers two independent areas:
 *  1. "Quotes" NavigationMenu (center) — trigger visibility, content items, role-based gating
 *  2. Right side — Sign Out button (logged in) / Sign in + Get started (logged out)
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Module mocks ───────────────────────────────────────────────────────────

// Named function so ESLint's react/display-name is satisfied.
// Defined inside the factory so it isn't subject to vi.mock hoisting constraints.
vi.mock('next/link', () => ({
  default: React.forwardRef(function MockLink(
    { href, children }: { href: string; children: React.ReactNode },
    ref: React.Ref<HTMLAnchorElement>
  ) {
    return React.createElement('a', { href, ref }, children);
  }),
}));

const mockPush = vi.fn();
vi.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush, asPath: '/' }),
}));

vi.mock('@/hooks/useAuth');

// ── Helpers ────────────────────────────────────────────────────────────────

import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import type { AuthUser } from '@greenquote/shared';

const mockUseAuth = vi.mocked(useAuth);

function makeUser(role: 'USER' | 'ADMIN'): AuthUser {
  return { id: '1', fullName: 'Test User', email: 'test@test.com', role };
}

function stubAuth(role: 'USER' | 'ADMIN') {
  mockUseAuth.mockReturnValue({
    user: makeUser(role),
    loading: false,
    logout: vi.fn(),
    refresh: vi.fn(),
  });
}

async function openQuotesMenu() {
  await userEvent.click(screen.getByRole('button', { name: /quotes/i }));
}

// ── Tests — NavigationMenu ─────────────────────────────────────────────────

describe('Layout — Quotes NavigationMenu', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows "Quotes" trigger when logged in', () => {
    stubAuth('USER');
    render(<Layout><div /></Layout>);

    expect(screen.getByRole('button', { name: /quotes/i })).toBeInTheDocument();
  });

  it('does not show "Quotes" trigger when logged out', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn(), refresh: vi.fn() });
    render(<Layout><div /></Layout>);

    expect(screen.queryByRole('button', { name: /quotes/i })).not.toBeInTheDocument();
  });

  it('opens menu and shows My Quotes and New Quote for USER', async () => {
    stubAuth('USER');
    render(<Layout><div /></Layout>);

    await openQuotesMenu();

    expect(screen.getByRole('link', { name: /my quotes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /new quote/i })).toBeInTheDocument();
  });

  it('shows All Quotes link inside menu for ADMIN', async () => {
    stubAuth('ADMIN');
    render(<Layout><div /></Layout>);

    await openQuotesMenu();

    expect(screen.getByRole('link', { name: /all quotes/i })).toBeInTheDocument();
  });

  it('does not show All Quotes link inside menu for USER', async () => {
    stubAuth('USER');
    render(<Layout><div /></Layout>);

    await openQuotesMenu();

    expect(screen.queryByRole('link', { name: /all quotes/i })).not.toBeInTheDocument();
  });

  it('My Quotes link points to /quotes', async () => {
    stubAuth('USER');
    render(<Layout><div /></Layout>);

    await openQuotesMenu();

    expect(screen.getByRole('link', { name: /my quotes/i })).toHaveAttribute('href', '/quotes');
  });

  it('New Quote link points to /new-quote', async () => {
    stubAuth('USER');
    render(<Layout><div /></Layout>);

    await openQuotesMenu();

    expect(screen.getByRole('link', { name: /new quote/i })).toHaveAttribute('href', '/new-quote');
  });
});

// ── Tests — right-side auth controls ──────────────────────────────────────

describe('Layout — right-side auth controls', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows Sign Out button when logged in', () => {
    stubAuth('USER');
    render(<Layout><div /></Layout>);

    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  it('calls logout when Sign Out is clicked', async () => {
    const logout = vi.fn();
    mockUseAuth.mockReturnValue({ user: makeUser('USER'), loading: false, logout, refresh: vi.fn() });
    render(<Layout><div /></Layout>);

    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));

    expect(logout).toHaveBeenCalledOnce();
  });

  it('shows sign-in / get-started when logged out', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, logout: vi.fn(), refresh: vi.fn() });
    render(<Layout><div /></Layout>);

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
  });
});

import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { Search } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { AuthGuard } from '@/components/AuthGuard';
import { QuotesTable } from '@/components/QuotesTable';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import type { QuoteRow } from '@/types';

export default function AdminQuotesPage() {
  return (
    <Layout>
      <Head>
        <title>Admin — All Quotes — GreenQuote</title>
      </Head>
      <AuthGuard requireAdmin>
        <AdminQuotesContent />
      </AuthGuard>
    </Layout>
  );
}

function AdminQuotesContent() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [search, setSearch] = useState('');
  // `loading` is only true during the very first fetch — keeps the spinner on
  // initial page open without replacing the table on every search keystroke.
  const [loading, setLoading] = useState(true);
  // `searching` is true during any subsequent search refetch; used for subtle
  // opacity feedback so the table stays in place rather than flickering.
  const [searching, setSearching] = useState(false);
  // Prevents the search debounce effect from firing an extra fetch on mount.
  const isFirstRender = useRef(true);

  const fetchQuotes = useCallback(async (query: string) => {
    const params = new URLSearchParams({ all: 'true' });
    if (query) params.set('search', query);
    const res = await fetch(`/api/quotes?${params.toString()}`);
    if (res.ok) {
      const json = (await res.json()) as { data: QuoteRow[] };
      setQuotes(json.data);
    }
    setLoading(false);
    setSearching(false);
  }, []);

  // Initial load — runs once, clears the full-page spinner when done.
  useEffect(() => {
    void fetchQuotes('');
  }, [fetchQuotes]);

  // Search debounce — skipped on mount so it doesn't race the initial load.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      void fetchQuotes(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, fetchQuotes]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">All Quotes</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label="Search quotes"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div
          className={searching ? 'opacity-50 transition-opacity duration-150' : 'transition-opacity duration-150'}
          aria-busy={searching}
        >
          <QuotesTable quotes={quotes} showUser currentUserId={user?.id} />
        </div>
      )}

      {!loading && (
        <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
          {quotes.length} quote{quotes.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

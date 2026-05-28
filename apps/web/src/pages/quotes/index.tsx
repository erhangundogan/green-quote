import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/Layout';
import { AuthGuard } from '@/components/AuthGuard';
import { QuotesTable } from '@/components/QuotesTable';
import type { QuoteRow } from '@/types';

export default function QuotesPage() {
  return (
    <Layout>
      <Head>
        <title>My Quotes — GreenQuote</title>
      </Head>
      <AuthGuard>
        <QuotesContent />
      </AuthGuard>
    </Layout>
  );
}

function QuotesContent() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchQuotes();
  }, []);

  async function fetchQuotes() {
    const res = await fetch('/api/quotes');
    if (res.ok) {
      const json = (await res.json()) as { data: QuoteRow[] };
      setQuotes(json.data);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">My Quotes</h1>

      <div>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <QuotesTable quotes={quotes} />
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { Download } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { AuthGuard } from '@/components/AuthGuard';
import { QuoteResults } from '@/components/QuoteResults';
import { Button } from '@/components/ui/button';
import type { QuoteRow } from '@/types';

export default function QuoteDetailPage() {
  return (
    <Layout>
      <AuthGuard>
        <QuoteDetailContent />
      </AuthGuard>
    </Layout>
  );
}

function QuoteDetailContent() {
  const router = useRouter();
  const { id } = router.query;
  const [quote, setQuote] = useState<QuoteRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof id !== 'string') return;
    void fetchQuote(id);
  }, [id]);

  async function fetchQuote(quoteId: string) {
    const res = await fetch(`/api/quotes/${quoteId}`);
    if (res.ok) {
      const json = (await res.json()) as { data: QuoteRow };
      setQuote(json.data);
    } else {
      const json = (await res.json()) as { error: string };
      setError(json.error);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center" role="status" aria-label="Loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-hidden="true" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-destructive">{error ?? 'Quote not found'}</p>
        <Link href="/quotes">
          <Button variant="outline">Back to quotes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Head>
        <title>Quote {quote.id.slice(0, 8)}… — GreenQuote</title>
      </Head>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quote Details</h1>
          <p className="mt-1 text-xs text-muted-foreground/60 font-mono">{quote.id}</p>
        </div>
        <a href={`/api/quotes/${quote.id}/pdf`} download>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Download PDF
          </Button>
        </a>
      </div>

      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        <p>
          <strong>Address:</strong> {quote.address}
        </p>
        <p>
          <strong>System size:</strong> {quote.systemSizeKw} kW &middot;{' '}
          <strong>Monthly consumption:</strong> {quote.monthlyConsumptionKwh} kWh/mo
        </p>
      </div>

      <QuoteResults quote={quote} />
    </div>
  );
}

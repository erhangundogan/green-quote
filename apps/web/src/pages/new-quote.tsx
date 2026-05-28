import Head from 'next/head';
import { useRouter } from 'next/router';
import { Layout } from '@/components/Layout';
import { AuthGuard } from '@/components/AuthGuard';
import { QuoteForm } from '@/components/QuoteForm';
import { useAuth } from '@/hooks/useAuth';
import type { QuoteRow } from '@/types';

export default function NewQuotePage() {
  return (
    <Layout>
      <Head>
        <title>New Quote — GreenQuote</title>
      </Head>
      <AuthGuard>
        <NewQuoteContent />
      </AuthGuard>
    </Layout>
  );
}

function NewQuoteContent() {
  const { user } = useAuth();
  const router = useRouter();

  function handleSuccess(quote: QuoteRow) {
    void router.push(`/quotes/${quote.id}`);
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Quote</h1>
      <QuoteForm user={user} onSuccess={handleSuccess} />
    </div>
  );
}

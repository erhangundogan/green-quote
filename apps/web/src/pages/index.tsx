import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { Leaf, Zap, Shield, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      void router.replace('/quotes');
    }
  }, [user, loading, router]);

  return (
    <Layout>
      <Head>
        <title>GreenQuote — Solar Financing Pre-Qualification</title>
      </Head>

      <section className="py-20 text-center" aria-labelledby="hero-heading">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4" aria-hidden="true">
              <Leaf className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 id="hero-heading" className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Solar financing made simple
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Get a pre-qualification quote for your residential solar system in minutes.
            No hard credit check required.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg">Get your free quote</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-8 py-16 sm:grid-cols-3" aria-label="Key features">
        {[
          { icon: Zap, title: 'Instant results', desc: 'Pre-qualification in under 60 seconds.' },
          { icon: TrendingDown, title: 'Competitive rates', desc: 'APR from 6.9% based on your risk profile.' },
          { icon: Shield, title: 'Secure & private', desc: 'Your data is encrypted and never sold.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-lg border p-6 text-center">
            <Icon className="mx-auto mb-3 h-8 w-8 text-primary" aria-hidden="true" />
            <h3 className="mb-1 font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </section>
    </Layout>
  );
}

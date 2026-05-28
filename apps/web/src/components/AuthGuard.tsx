import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (requireAdmin && user.role !== 'ADMIN') {
      void router.replace('/quotes');
    }
  }, [user, loading, requireAdmin, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center" role="status" aria-label="Loading">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-hidden="true" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (!user) return null;
  if (requireAdmin && user.role !== 'ADMIN') return null;

  return <>{children}</>;
}

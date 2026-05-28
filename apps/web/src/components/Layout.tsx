import type { ReactNode } from 'react';
import Link from 'next/link';
import { Leaf, LogOut, PlusCircle, FileText, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, loading, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        {/* 3-column grid: logo | nav | user */}
        <div className="container mx-auto grid h-16 grid-cols-3 items-center px-4">

          {/* ── Left: logo ── */}
          <Link href="/" className="flex items-center gap-2 font-bold text-primary">
            <Leaf className="h-5 w-5" aria-hidden="true" />
            <span>GreenQuote</span>
          </Link>

          {/* ── Centre: Quotes navigation menu (logged-in only) ── */}
          <div className="flex justify-center">
            {!loading && user && (
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Quotes</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="w-48 p-2">
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              href="/quotes"
                              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                            >
                              <FileText className="h-4 w-4" aria-hidden="true" />
                              My Quotes
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        {user.role === 'ADMIN' && (
                          <li>
                            <NavigationMenuLink asChild>
                              <Link
                                href="/admin/quotes"
                                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                              >
                                <LayoutList className="h-4 w-4" aria-hidden="true" />
                                All Quotes
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        )}
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              href="/new-quote"
                              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                            >
                              <PlusCircle className="h-4 w-4" aria-hidden="true" />
                              New Quote
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>

          {/* ── Right: sign out / auth buttons ── */}
          <div className="flex items-center justify-end">
            {!loading && user ? (
              <Button variant="ghost" size="sm" onClick={() => void logout()} className="gap-1.5">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign Out
              </Button>
            ) : (
              !loading && (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Get started</Button>
                  </Link>
                </div>
              )
            )}
          </div>

        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} GreenQuote — Solar Financing Pre-Qualification</p>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Music, BookOpen, Users, ShoppingBag, User, Shield, ShoppingCart } from 'lucide-react';
import { useIsCallerAdmin, useGetCallerUserProfile } from '../hooks/useQueries';
import { useCartStore } from '../lib/cartStore';
import CartDrawer from './CartDrawer';

export default function Layout() {
  const navigate = useNavigate();
  const { pathname } = useRouterState().location;
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: userProfile } = useGetCallerUserProfile();
  const cart = useCartStore(state => state.cart);
  const getItemCount = useCartStore(state => state.getItemCount);
  const [showCart, setShowCart] = useState(false);

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const tokenBalance = userProfile?.tokenBalance ? Number(userProfile.tokenBalance) : 0;
  const cartItemCount = getItemCount();

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      navigate({ to: '/' });
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Music },
    { path: '/learning', label: 'Learning', icon: BookOpen },
    { path: '/community', label: 'Community', icon: Users },
    { path: '/store', label: 'Store', icon: ShoppingBag },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={() => navigate({ to: '/' })}
              className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity"
            >
              <img src="/assets/generated/ocarina-logo-transparent.dim_200x200.png" alt="Ocarina" className="h-10 w-10" />
              <span className="hidden sm:inline">Ocarina Hub</span>
            </button>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? 'secondary' : 'ghost'}
                    onClick={() => navigate({ to: item.path })}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && userProfile && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate({ to: '/wallet' })}
                className="gap-2 hidden sm:flex"
              >
                <img src="/assets/generated/token-coin-icon-transparent.dim_64x64.png" alt="Tokens" className="h-4 w-4" />
                <span className="font-semibold">{tokenBalance}</span>
              </Button>
            )}
            {isAuthenticated && cartItemCount > 0 && (
              <Button variant="ghost" size="icon" onClick={() => setShowCart(true)} className="relative">
                <ShoppingCart className="h-5 w-5" />
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {cartItemCount}
                </Badge>
              </Button>
            )}
            {isAuthenticated && (
              <>
                <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/profile' })}>
                  <User className="h-5 w-5" />
                </Button>
                {isAdmin && (
                  <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/admin' })}>
                    <Shield className="h-5 w-5" />
                  </Button>
                )}
              </>
            )}
            <Button onClick={handleAuth} disabled={disabled} variant={isAuthenticated ? 'outline' : 'default'}>
              {loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login'}
            </Button>
          </div>
        </div>
        <nav className="md:hidden border-t border-border/40 bg-background/95">
          <div className="container flex items-center justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => navigate({ to: item.path })}
                  className="flex-col h-auto py-2 gap-1"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border/40 bg-card/50 backdrop-blur">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© 2025. Built with</span>
              <span className="text-red-500">♥</span>
              <span>using</span>
              <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-foreground transition-colors">
                caffeine.ai
              </a>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <button onClick={() => navigate({ to: '/learning' })} className="hover:text-foreground transition-colors">
                Tutorials
              </button>
              <button onClick={() => navigate({ to: '/community' })} className="hover:text-foreground transition-colors">
                Community
              </button>
              <button onClick={() => navigate({ to: '/store' })} className="hover:text-foreground transition-colors">
                Shop
              </button>
            </div>
          </div>
        </div>
      </footer>
      <CartDrawer open={showCart} onOpenChange={setShowCart} />
    </div>
  );
}

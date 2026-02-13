import { Link, useNavigate, Outlet } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useIsCallerAdmin, useGetBalance, useGetBranding } from '../hooks/useQueries';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '../lib/cartStore';
import { Badge } from '@/components/ui/badge';
import { getBuildInfo } from '../config/appBuildInfo';
import { useEffect } from 'react';

export default function Layout() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: balance } = useGetBalance();
  const { data: branding } = useGetBranding();
  const cartCount = useCartStore(state => state.getItemCount());

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';
  const text = loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login';

  const buildInfo = getBuildInfo();

  // Update favicon when branding icon changes
  useEffect(() => {
    if (branding?.icon) {
      const iconUrl = branding.icon.getDirectURL();
      
      // Remove existing favicon links
      const existingLinks = document.querySelectorAll("link[rel*='icon']");
      existingLinks.forEach(link => link.remove());
      
      // Add new favicon link
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = iconUrl;
      document.head.appendChild(link);
    }
  }, [branding?.icon]);

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

  // Use branding values with fallbacks
  const siteName = branding?.siteName || 'Ocarina Learning';
  const logoUrl = branding?.logo?.getDirectURL() || '/assets/generated/ocarina-logo-transparent.dim_200x200.png';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={logoUrl}
                alt={siteName}
                className="h-10 w-10"
              />
              <span className="font-bold text-xl">{siteName}</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/learning" className="text-sm font-medium hover:text-primary transition-colors">
                Learning
              </Link>
              <Link to="/community" className="text-sm font-medium hover:text-primary transition-colors">
                Community
              </Link>
              <Link to="/store" className="text-sm font-medium hover:text-primary transition-colors">
                Store
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated && balance !== undefined && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: '/wallet' })}
                className="gap-2"
              >
                <img 
                  src="/assets/generated/token-coin-icon-transparent.dim_64x64.png" 
                  alt="Tokens" 
                  className="h-4 w-4"
                />
                <span className="font-semibold">{balance.toString()}</span>
              </Button>
            )}
            {cartCount > 0 && (
              <Button
                variant="outline"
                size="icon"
                className="relative"
                onClick={() => navigate({ to: '/store' })}
              >
                <ShoppingCart className="h-4 w-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {cartCount}
                </Badge>
              </Button>
            )}
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: '/profile' })}
              >
                Profile
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: '/admin' })}
              >
                Admin
              </Button>
            )}
            <Button
              onClick={handleAuth}
              disabled={disabled}
              size="sm"
              variant={isAuthenticated ? 'outline' : 'default'}
            >
              {text}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-8 mt-16">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col items-center md:items-start gap-2">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} {siteName}. All rights reserved.
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Built with <Heart className="h-3 w-3 fill-red-500 text-red-500" /> using{' '}
                <a
                  href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors font-medium"
                >
                  caffeine.ai
                </a>
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2">
              <p className="text-xs text-muted-foreground">
                Build: {new Date(buildInfo.buildTime).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

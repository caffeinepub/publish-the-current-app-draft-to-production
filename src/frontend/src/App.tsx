import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LearningPage from './pages/LearningPage';
import CommunityPage from './pages/CommunityPage';
import StorePage from './pages/StorePage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import WalletPage from './pages/WalletPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
import ProfileSetupModal from './components/ProfileSetupModal';
import LoadingScreen from './components/LoadingScreen';
import AIChatTutor from './components/AIChatTutor';

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const learningRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/learning',
  component: LearningPage,
});

const communityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/community',
  component: CommunityPage,
});

const storeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/store',
  component: StorePage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallet',
  component: WalletPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminPage,
});

const paymentSuccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment-success',
  component: PaymentSuccessPage,
});

const paymentFailureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/payment-failure',
  component: PaymentFailurePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  learningRoute,
  communityRoute,
  storeRoute,
  profileRoute,
  walletRoute,
  adminRoute,
  paymentSuccessRoute,
  paymentFailureRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const isAuthenticated = !!identity;

  // Update modal visibility when profile state changes
  useEffect(() => {
    if (isAuthenticated && !profileLoading && isFetched && userProfile === null) {
      setShowProfileModal(true);
    } else {
      setShowProfileModal(false);
    }
  }, [isAuthenticated, profileLoading, isFetched, userProfile]);

  if (isInitializing) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
      <ProfileSetupModal open={showProfileModal} onOpenChange={setShowProfileModal} />
      <AIChatTutor />
      <Toaster />
    </ThemeProvider>
  );
}
